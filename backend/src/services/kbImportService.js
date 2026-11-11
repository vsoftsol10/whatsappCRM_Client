// ============================================
// KNOWLEDGE BASE - CSV / EXCEL IMPORT
// ============================================
// Lets a company admin load a whole catalog or FAQ sheet at once.
//
//   previewImport(...)  reads the file and says what WOULD happen (changes nothing)
//   applyImport(...)    does it, in one database transaction
//
// TENANT ISOLATION: companyId always comes from the logged-in admin's token.
// Existing entries are matched by title ONLY among that company's own rows,
// and every write below filters on companyId (including the bulk UPDATE).
//
// File rules
//   - .csv, .xlsx or .xls, first sheet only, first row = column names
//   - needs a title column (Name / Title / Product / Question ...)
//   - description column optional (Description / Details / Answer ...)
//   - Category, Keywords (or Tags) and Active columns are optional
//   - ANY other column (Price, Size, Stock ...) is added to the answer text
//     as "Price: 450", so product sheets work as they are
//   - rows with the same title (ignoring capitals) are one entry; the last wins

const XLSX = require("xlsx");
const prisma = require("../config/prisma");
const {
  MAX_ENTRIES_PER_COMPANY,
  DEFAULT_CATEGORY,
  normalizeTitle,
  sanitizeEntry,
} = require("./kbEntryRules");

const MAX_IMPORT_ROWS =
  Number(process.env.KB_MAX_IMPORT_ROWS) > 0
    ? Number(process.env.KB_MAX_IMPORT_ROWS)
    : 5000;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ERRORS_SHOWN = 50;
const CREATE_CHUNK = 500;
const UPDATE_CHUNK = 500;

const MODES = ["update", "skip"];

class ImportError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ---------- column names we recognise ----------
const normalizeHeader = (header) =>
  String(header || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

const ALIASES = {
  title: ["title", "name", "productname", "product", "item", "itemname", "question", "topic", "heading"],
  content: ["content", "answer", "description", "details", "info", "information", "reply", "response", "about"],
  category: ["category", "type", "group", "section"],
  keywords: ["keywords", "keyword", "tags", "tag", "alsoknownas", "aliases", "synonyms", "othernames"],
  active: ["active", "isactive", "enabled", "published", "live"],
};

const fieldForHeader = (header) => {
  const key = normalizeHeader(header);

  for (const [field, names] of Object.entries(ALIASES)) {
    if (names.includes(key)) return field;
  }

  return null;
};

const TRUE_WORDS = new Set(["yes", "y", "true", "1", "active", "on", "enabled"]);
const FALSE_WORDS = new Set(["no", "n", "false", "0", "inactive", "off", "disabled"]);

// "" -> undefined (not given). Unknown words -> null (reported as an error).
const parseActive = (value) => {
  const word = String(value ?? "").trim().toLowerCase();

  if (!word) return undefined;
  if (TRUE_WORDS.has(word)) return true;
  if (FALSE_WORDS.has(word)) return false;
  return null;
};

// ---------- reading the file ----------
const isZip = (buffer) => buffer.length > 3 && buffer[0] === 0x50 && buffer[1] === 0x4b; // .xlsx
const isOle = (buffer) => buffer.length > 4 && buffer[0] === 0xd0 && buffer[1] === 0xcf; // .xls

// CSV bytes -> text. Excel's "CSV UTF-8" has a BOM, others don't; old
// "CSV (Comma delimited)" files are not UTF-8 at all. Decoding here (instead
// of letting the parser guess) keeps Tamil / Hindi etc. intact.
const decodeText = (buffer) => {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buffer.subarray(2));
  }

  const bytes =
    buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf
      ? buffer.subarray(3)
      : buffer;

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
};

const readSheetRows = (file) => {
  if (!file || !file.buffer || !file.buffer.length) {
    throw new ImportError("Please choose a CSV or Excel file.");
  }

  if (file.buffer.length > MAX_FILE_BYTES) {
    throw new ImportError("The file is too large. Keep it under 5 MB.");
  }

  // header row + MAX rows + 1 extra, so "too many rows" can be detected
  const sheetRows = MAX_IMPORT_ROWS + 2;

  let workbook;

  try {
    workbook =
      isZip(file.buffer) || isOle(file.buffer)
        ? XLSX.read(file.buffer, { type: "buffer", sheetRows })
        : XLSX.read(decodeText(file.buffer), { type: "string", raw: true, sheetRows });
  } catch {
    throw new ImportError("This file could not be read. Please upload a .csv or .xlsx file.");
  }

  if (!workbook.SheetNames.length) {
    throw new ImportError("The file has no data.");
  }

  // blankrows: keep empty rows so "row N" in error messages is the real
  // spreadsheet row number
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
    defval: "",
    raw: false,
    blankrows: true,
  });

  if (rows.length === 0) {
    throw new ImportError("The file is empty. Add a header row and at least one entry.");
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    throw new ImportError(
      `This file has more than ${MAX_IMPORT_ROWS} rows. Please split it into smaller files.`
    );
  }

  return rows;
};

// ---------- one sheet row -> one entry ----------
const rowToEntry = (row, columns) => {
  const get = (field) => (columns[field] ? String(row[columns[field]] ?? "").trim() : undefined);

  const extras = columns.extras
    .map((header) => {
      const value = String(row[header] ?? "").trim();
      return value ? `${header.trim()}: ${value}` : null;
    })
    .filter(Boolean);

  const description = get("content");
  const content = [description, ...extras].filter(Boolean).join("\n");

  const input = { title: get("title"), content };

  if (columns.category) input.category = get("category");
  if (columns.keywords) input.keywords = get("keywords");

  if (columns.active) {
    const active = parseActive(get("active"));

    if (active === null) return { error: "Active must be yes or no" };
    if (active !== undefined) input.isActive = active;
  }

  return sanitizeEntry(input, { partial: false });
};

const findColumns = (headers) => {
  const columns = { extras: [] };

  for (const header of headers) {
    if (/^__EMPTY/.test(header)) continue; // blank header cell

    const field = fieldForHeader(header);

    if (field && !columns[field]) columns[field] = header;
    else columns.extras.push(header);
  }

  return columns;
};

// ---------- analyse: read + validate + compare with what the company already has ----------
const analyze = async (companyId, file, mode) => {
  if (!MODES.includes(mode)) {
    throw new ImportError('Mode must be "update" or "skip".');
  }

  const rows = readSheetRows(file);
  const columns = findColumns(Object.keys(rows[0]));

  if (!columns.title) {
    throw new ImportError(
      'No title column found. Name the first column "Title" (or Name, Product, Question).'
    );
  }

  const invalid = [];
  const byTitle = new Map(); // normalized title -> { row, data }
  let blankRows = 0;
  let duplicatesInFile = 0;

  rows.forEach((row, index) => {
    const sheetRow = index + 2; // row 1 is the header

    if (Object.values(row).every((value) => !String(value ?? "").trim())) {
      blankRows += 1;
      return;
    }

    const { data, error } = rowToEntry(row, columns);

    if (error) {
      invalid.push({ row: sheetRow, title: String(row[columns.title] ?? "").trim(), message: error });
      return;
    }

    const key = normalizeTitle(data.title);

    if (byTitle.has(key)) duplicatesInFile += 1;
    byTitle.set(key, { row: sheetRow, data });
  });

  // Only THIS company's entries (companyId in the WHERE), to match titles
  const existing = await prisma.kbEntry.findMany({
    where: { companyId },
    select: { id: true, title: true },
  });

  const existingByTitle = new Map();
  for (const entry of existing) {
    const key = normalizeTitle(entry.title);
    if (!existingByTitle.has(key)) existingByTitle.set(key, entry.id);
  }

  const toCreate = [];
  const toUpdate = [];
  let skipped = 0;

  for (const [key, { row, data }] of byTitle) {
    const existingId = existingByTitle.get(key);

    if (existingId === undefined) toCreate.push({ row, data });
    else if (mode === "update") toUpdate.push({ row, data, id: existingId });
    else skipped += 1;
  }

  return {
    columns,
    invalid,
    blankRows,
    duplicatesInFile,
    toCreate,
    toUpdate,
    skipped,
    currentTotal: existing.length,
  };
};

const describeColumns = (columns) => ({
  title: columns.title,
  content: columns.content || null,
  category: columns.category || null,
  keywords: columns.keywords || null,
  active: columns.active || null,
  addedToAnswer: columns.extras.filter((header) => !/^__EMPTY/.test(header)),
});

// ============================================
// PREVIEW (changes nothing)
// ============================================
const previewImport = async (companyId, file, mode = "update") => {
  const plan = await analyze(companyId, file, mode);

  const afterImport = plan.currentTotal + plan.toCreate.length;

  const sample = [...plan.toCreate.map((item) => ({ ...item, action: "new" })),
    ...plan.toUpdate.map((item) => ({ ...item, action: "update" }))]
    .sort((a, b) => a.row - b.row)
    .slice(0, 5)
    .map(({ row, data, action }) => ({
      row,
      action,
      title: data.title,
      category: data.category || null,
      content: data.content.length > 220 ? `${data.content.slice(0, 220)}...` : data.content,
    }));

  return {
    mode,
    columns: describeColumns(plan.columns),
    totals: {
      willCreate: plan.toCreate.length,
      willUpdate: plan.toUpdate.length,
      willSkip: plan.skipped,
      invalid: plan.invalid.length,
      duplicatesInFile: plan.duplicatesInFile,
      blankRows: plan.blankRows,
    },
    capacity: {
      current: plan.currentTotal,
      limit: MAX_ENTRIES_PER_COMPANY,
      afterImport,
      overLimit: afterImport > MAX_ENTRIES_PER_COMPANY,
    },
    errors: plan.invalid.slice(0, MAX_ERRORS_SHOWN),
    sample,
  };
};

// ============================================
// APPLY (one transaction: all valid rows or nothing)
// ============================================
// Updates existing entries in ONE statement. The WHERE has BOTH the id and the
// companyId, so an id that belongs to another company changes nothing.
// Empty category / absent columns keep what the entry already has.
// items: [{ id, data: { title, content, category?, keywords?, isActive? } }]
// Returns the number of rows changed.
const bulkUpdateEntries = (db, companyId, items, hasKeywords) => {
  const ids = items.map((item) => item.id);
  const titles = items.map((item) => item.data.title);
  const contents = items.map((item) => item.data.content);
  const categories = items.map((item) => item.data.category || "");
  const keywords = items.map((item) => item.data.keywords || "");
  const actives = items.map((item) =>
    item.data.isActive === undefined ? "" : String(item.data.isActive)
  );

  return db.$executeRaw`
    UPDATE "KbEntry" AS e
    SET title = v.title,
        content = v.content,
        category = CASE WHEN v.category = '' THEN e.category ELSE v.category END,
        keywords = CASE WHEN ${Boolean(hasKeywords)}::boolean THEN NULLIF(v.keywords, '') ELSE e.keywords END,
        "isActive" = CASE v.active WHEN 'true' THEN true WHEN 'false' THEN false ELSE e."isActive" END,
        "updatedAt" = now()
    FROM unnest(
      ${ids}::int[], ${titles}::text[], ${contents}::text[],
      ${categories}::text[], ${keywords}::text[], ${actives}::text[]
    ) AS v(id, title, content, category, keywords, active)
    WHERE e.id = v.id AND e."companyId" = ${companyId}
  `;
};

const chunk = (list, size) => {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

const applyImport = async (companyId, file, mode = "update", createdById = null) => {
  const plan = await analyze(companyId, file, mode);

  const afterImport = plan.currentTotal + plan.toCreate.length;

  if (afterImport > MAX_ENTRIES_PER_COMPANY) {
    throw new ImportError(
      `This import would make ${afterImport} entries, but the limit is ${MAX_ENTRIES_PER_COMPANY}. ` +
        "Remove some entries or import a smaller file."
    );
  }

  if (plan.toCreate.length === 0 && plan.toUpdate.length === 0) {
    return {
      created: 0,
      updated: 0,
      skipped: plan.skipped,
      invalid: plan.invalid.length,
      errors: plan.invalid.slice(0, MAX_ERRORS_SHOWN),
    };
  }

  const hasKeywords = Boolean(plan.columns.keywords);

  await prisma.$transaction(
    async (tx) => {
      // ----- new entries -----
      for (const part of chunk(plan.toCreate, CREATE_CHUNK)) {
        await tx.kbEntry.createMany({
          data: part.map(({ data }) => ({
            companyId,
            title: data.title,
            content: data.content,
            category: data.category || DEFAULT_CATEGORY,
            keywords: data.keywords || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
            createdById: createdById ? String(createdById) : null,
          })),
        });
      }

      // ----- existing entries (matched by title in THIS company) -----
      for (const part of chunk(plan.toUpdate, UPDATE_CHUNK)) {
        await bulkUpdateEntries(tx, companyId, part, hasKeywords);
      }
    },
    { timeout: 120000, maxWait: 30000 }
  );

  return {
    created: plan.toCreate.length,
    updated: plan.toUpdate.length,
    skipped: plan.skipped,
    invalid: plan.invalid.length,
    errors: plan.invalid.slice(0, MAX_ERRORS_SHOWN),
  };
};

module.exports = {
  bulkUpdateEntries, // exported for the isolation tests
  ImportError,
  MAX_IMPORT_ROWS,
  MAX_FILE_BYTES,
  MODES,
  previewImport,
  applyImport,
};
