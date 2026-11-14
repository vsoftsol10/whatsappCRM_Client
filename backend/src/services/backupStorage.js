// Stores backup Excel files so they can be downloaded from ANY server.
//
// Why: the database (Supabase) is shared, but the old code saved the file on the
// local disk of the one machine that ran the backup. Downloading from another
// machine / after a redeploy then gave "Excel file is not available".
//
// Now the file goes to a PRIVATE Supabase Storage bucket. The DB column
// `storagePath` holds "supabase:<bucket>/<object path>". If Supabase upload
// fails, we fall back to the local disk so the backup is never lost.

const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");

const BUCKET = process.env.BACKUP_BUCKET || "crm-backups";
const PREFIX = "supabase:";
const LOCAL_DIR = path.join(process.cwd(), "backups");
const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

let bucketReady = false;

const ensureBucket = async () => {
  if (bucketReady) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
  // "already exists" is fine
  if (error && !/already exists|duplicate/i.test(error.message || "")) {
    throw new Error(`Cannot create backup bucket: ${error.message}`);
  }
  bucketReady = true;
};

const isRemote = (storagePath) =>
  typeof storagePath === "string" && storagePath.startsWith(PREFIX);

const parseRemote = (storagePath) => {
  const rest = storagePath.slice(PREFIX.length);
  const i = rest.indexOf("/");
  return { bucket: rest.slice(0, i), objectPath: rest.slice(i + 1) };
};

// Returns the value to save in Backup.storagePath
const saveBackupFile = async (
  companyKey,
  fileName,
  buffer,
  contentType = XLSX_TYPE
) => {
  try {
    await ensureBucket();
    const objectPath = `${companyKey}/${fileName}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buffer, { contentType, upsert: false });
    if (error) throw new Error(error.message);
    return `${PREFIX}${BUCKET}/${objectPath}`;
  } catch (err) {
    console.error("Backup cloud upload failed, saving locally instead:", err.message);
    if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
    const localPath = path.join(LOCAL_DIR, fileName);
    fs.writeFileSync(localPath, buffer);
    return localPath;
  }
};

// Returns a Buffer, or null if the file cannot be found.
const readBackupFile = async (storagePath) => {
  if (!storagePath) return null;

  if (isRemote(storagePath)) {
    const { bucket, objectPath } = parseRemote(storagePath);
    const { data, error } = await supabase.storage.from(bucket).download(objectPath);
    if (error || !data) {
      console.error("Backup cloud download failed:", error && error.message);
      return null;
    }
    return Buffer.from(await data.arrayBuffer());
  }

  // Local file (new .xlsx or the older .zip + .xlsx pair)
  const excelPath = /\.xlsx$/i.test(storagePath)
    ? storagePath
    : storagePath.replace(/\.zip$/i, ".xlsx");
  if (!fs.existsSync(excelPath)) return null;
  return fs.readFileSync(excelPath);
};

const deleteBackupFile = async (storagePath) => {
  try {
    if (!storagePath) return;
    if (isRemote(storagePath)) {
      const { bucket, objectPath } = parseRemote(storagePath);
      await supabase.storage.from(bucket).remove([objectPath]);
      return;
    }
    const resolved = path.resolve(storagePath);
    if (!resolved.startsWith(path.resolve(LOCAL_DIR) + path.sep)) return;
    if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
  } catch (err) {
    console.error("Backup file delete error:", err.message);
  }
};

module.exports = { saveBackupFile, readBackupFile, deleteBackupFile, XLSX_TYPE };