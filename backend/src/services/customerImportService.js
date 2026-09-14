const XLSX = require("xlsx");
const prisma = require("../config/prisma");
const { normalizeIndianPhone } = require("../utils/phoneUtils");

/**
 * Normalize Excel column names
 */
const normalizeKey = (key) => {
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
};

/**
 * Map Excel columns to Customer fields
 */
const mapRow = (row) => {
  const mapped = {};

  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = normalizeKey(key);
    const stringValue = String(value ?? "").trim();

    if (
      ["name", "customername", "fullname"].includes(
        normalizedKey
      )
    ) {
      mapped.name = stringValue;
    }

    if (
      [
        "phone",
        "mobile",
        "mobilenumber",
        "phonenumber",
        "contactnumber",
      ].includes(normalizedKey)
    ) {
      mapped.phone = stringValue;
    }

    if (
      ["email", "emailaddress"].includes(
        normalizedKey
      )
    ) {
      mapped.email = stringValue;
    }

    if (
      [
        "company",
        "companyname",
        "business",
        "businessname",
      ].includes(normalizedKey)
    ) {
      mapped.company = stringValue;
    }

    if (normalizedKey === "source") {
      mapped.source = stringValue;
    }

    if (
      [
        "requirements",
        "requirement",
        "notes",
        "note",
      ].includes(normalizedKey)
    ) {
      mapped.requirements = stringValue;
    }

    if (normalizedKey === "status") {
      mapped.status = stringValue || "ACTIVE";
    }
  });

  return mapped;
};

/**
 * Read Excel / CSV file
 */
const readImportFile = (file) => {
  if (!file || !file.buffer) {
    const error = new Error(
      "Please upload an Excel or CSV file."
    );

    error.statusCode = 400;

    throw error;
  }

  const workbook = XLSX.read(file.buffer, {
    type: "buffer",
  });

  if (!workbook.SheetNames.length) {
    const error = new Error(
      "The uploaded file does not contain any worksheet."
    );

    error.statusCode = 400;

    throw error;
  }

  const sheetName = workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (!rows.length) {
    const error = new Error(
      "The uploaded file is empty."
    );

    error.statusCode = 400;

    throw error;
  }

  return rows;
};

/**
 * Preview customer import
 */
const previewImport = async (file, user) => {
  const { companyId } = user;

  if (!companyId) {
    const error = new Error(
      "Company information not found in authentication."
    );

    error.statusCode = 401;

    throw error;
  }

  const rows = readImportFile(file);

  const normalizedRows = rows.map((row, index) => ({
    rowNumber: index + 2,
    ...mapRow(row),
  }));

  const validRows = [];
  const invalidRows = [];

  /**
   * Validate rows
   */
  for (const row of normalizedRows) {
    if (!row.name) {
      invalidRows.push({
        rowNumber: row.rowNumber,
        reason: "Name is required.",
      });

      continue;
    }

    if (!row.phone) {
      invalidRows.push({
        rowNumber: row.rowNumber,
        reason: "Phone number is required.",
      });

      continue;
    }

    let normalizedPhone = null;

    try {
      normalizedPhone = normalizeIndianPhone(
        row.phone
      );
    } catch (error) {
      normalizedPhone = null;
    }

    if (!normalizedPhone) {
      invalidRows.push({
        rowNumber: row.rowNumber,
        reason: "Invalid Indian mobile number.",
      });

      continue;
    }

    validRows.push({
      ...row,
      phone: normalizedPhone,
      status: row.status || "ACTIVE",
    });
  }

  /**
   * Detect duplicate phone numbers
   * inside uploaded file
   */
  const seenPhones = new Set();

  const duplicateRows = [];
  const uniqueRows = [];

  for (const row of validRows) {
    if (seenPhones.has(row.phone)) {
      duplicateRows.push({
        rowNumber: row.rowNumber,
        phone: row.phone,
        name: row.name,
        reason:
          "Duplicate phone number in uploaded file.",
      });

      continue;
    }

    seenPhones.add(row.phone);

    uniqueRows.push(row);
  }

  /**
   * Check existing customers
   * in the same company
   */
  const phones = uniqueRows.map(
    (row) => row.phone
  );

  const existingCustomers =
    phones.length > 0
      ? await prisma.customer.findMany({
          where: {
            companyId,
            phone: {
              in: phones,
            },
          },
          select: {
            phone: true,
          },
        })
      : [];

  const existingPhones = new Set(
    existingCustomers.map(
      (customer) => customer.phone
    )
  );

  const newRows = [];
  const existingRows = [];

  for (const row of uniqueRows) {
    if (existingPhones.has(row.phone)) {
      existingRows.push({
        rowNumber: row.rowNumber,
        phone: row.phone,
        name: row.name,
        reason: "Customer already exists.",
      });
    } else {
      newRows.push(row);
    }
  }

  /**
   * Get company subscription
   */
  const company = await prisma.company.findUnique({
    where: {
      id: companyId,
    },
    include: {
      subscriptions: {
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          plan: true,
        },
      },
    },
  });

  if (!company) {
    const error = new Error(
      "Company not found."
    );

    error.statusCode = 404;

    throw error;
  }

  /**
   * Check company status
   */
  if (company.status !== "ACTIVE") {
    const error = new Error(
      `Your company is ${company.status.toLowerCase()}. You cannot import customers.`
    );

    error.statusCode = 403;

    throw error;
  }

  /**
   * Get active subscription
   */
  const subscription = company.subscriptions[0];

  if (
    !subscription ||
    !subscription.plan
  ) {
    const error = new Error(
      "No active subscription plan found."
    );

    error.statusCode = 403;

    throw error;
  }

  const plan = subscription.plan;

  /**
   * Current customer count
   */
  const currentCustomers =
    await prisma.customer.count({
      where: {
        companyId,
      },
    });

  const maxCustomers =
    plan.maxCustomers;

  /**
   * Check plan limit
   *
   * Only NEW customers are counted.
   * Duplicate and existing customers
   * should not consume slots.
   */
  const limitExceeded =
    maxCustomers !== null &&
    maxCustomers !== undefined &&
    currentCustomers +
      newRows.length >
      maxCustomers;

  return {
    success: true,

    message:
      "Customer import preview generated successfully.",

    summary: {
      totalRows: rows.length,

      validRows:
        validRows.length,

      newCustomers:
        newRows.length,

      existingCustomers:
        existingRows.length,

      duplicateRows:
        duplicateRows.length,

      invalidRows:
        invalidRows.length,

      currentCustomers,

      maxCustomers,

      availableSlots:
        maxCustomers !== null &&
        maxCustomers !== undefined
          ? Math.max(
              maxCustomers -
                currentCustomers,
              0
            )
          : null,

      limitExceeded,

      planName:
        plan.planName,
    },

    rows: newRows,

    existingRows,

    duplicateRows,

    invalidRows,
  };
};

/**
 * Import customers after preview confirmation
 */
const importCustomers = async (
  rows,
  user
) => {
  const {
    companyId,
    userId,
  } = user;

  /**
   * Validate company ID
   */
  if (!companyId) {
    const error = new Error(
      "Company information not found in authentication."
    );

    error.statusCode = 401;

    throw error;
  }

  /**
   * Validate rows
   */
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    const error = new Error(
      "No customers available for import."
    );

    error.statusCode = 400;

    throw error;
  }

  /**
   * Check company and subscription
   */
  const company =
    await prisma.company.findUnique({
      where: {
        id: companyId,
      },
      include: {
        subscriptions: {
          where: {
            status: "ACTIVE",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          include: {
            plan: true,
          },
        },
      },
    });

  if (!company) {
    const error = new Error(
      "Company not found."
    );

    error.statusCode = 404;

    throw error;
  }

  /**
   * Check company status
   */
  if (company.status !== "ACTIVE") {
    const error = new Error(
      `Your company is ${company.status.toLowerCase()}. You cannot import customers.`
    );

    error.statusCode = 403;

    throw error;
  }

  /**
   * Get subscription
   */
  const subscription =
    company.subscriptions[0];

  if (
    !subscription ||
    !subscription.plan
  ) {
    const error = new Error(
      "No active subscription plan found."
    );

    error.statusCode = 403;

    throw error;
  }

  const plan = subscription.plan;

  /**
   * Normalize and validate rows
   */
  const customersToCreate = [];

  for (const row of rows) {
    if (!row.name || !row.phone) {
      continue;
    }

    let normalizedPhone = null;

    try {
      normalizedPhone =
        normalizeIndianPhone(
          row.phone
        );
    } catch (error) {
      normalizedPhone = null;
    }

    if (!normalizedPhone) {
      continue;
    }

    customersToCreate.push({
      name: row.name,
      phone: normalizedPhone,
      email:
        row.email || null,
      companyName:
        row.company || null,
      source:
        row.source || null,
      requirements:
        row.requirements || null,
      status:
        row.status || "ACTIVE",
      userId,
      companyId,
    });
  }

  /**
   * No valid customers
   */
  if (
    customersToCreate.length === 0
  ) {
    const error = new Error(
      "No valid customers available for import."
    );

    error.statusCode = 400;

    throw error;
  }

  /**
   * Remove duplicate phone numbers
   * inside the same import request.
   *
   * First occurrence is kept.
   */
  const uniqueCustomersMap =
    new Map();

  for (const customer of customersToCreate) {
    if (
      !uniqueCustomersMap.has(
        customer.phone
      )
    ) {
      uniqueCustomersMap.set(
        customer.phone,
        customer
      );
    }
  }

  const uniqueCustomers =
    Array.from(
      uniqueCustomersMap.values()
    );

  /**
   * Check duplicates against database
   */
  const phones =
    uniqueCustomers.map(
      (customer) =>
        customer.phone
    );

  const existingCustomers =
    await prisma.customer.findMany({
      where: {
        companyId,
        phone: {
          in: phones,
        },
      },
      select: {
        phone: true,
      },
    });

  const existingPhones =
    new Set(
      existingCustomers.map(
        (customer) =>
          customer.phone
      )
    );

  /**
   * Remove customers that already
   * exist in database
   */
  const finalCustomers =
    uniqueCustomers.filter(
      (customer) =>
        !existingPhones.has(
          customer.phone
        )
    );

  /**
   * If everything already exists
   */
  if (
    finalCustomers.length === 0
  ) {
    const error = new Error(
      "All selected customers already exist."
    );

    error.statusCode = 409;

    throw error;
  }

  /**
   * Current customer count
   */
  const currentCustomers =
    await prisma.customer.count({
      where: {
        companyId,
      },
    });

  const maxCustomers =
    plan.maxCustomers;

  /**
   * Check plan limit using
   * ACTUAL new customers.
   *
   * Duplicate rows and existing
   * customers do not consume slots.
   */
  if (
    maxCustomers !== null &&
    maxCustomers !== undefined &&
    currentCustomers +
      finalCustomers.length >
      maxCustomers
  ) {
    const availableSlots =
      Math.max(
        maxCustomers -
          currentCustomers,
        0
      );

    const error = new Error(
      `Customer limit exceeded. You can add only ${availableSlots} more customer(s).`
    );

    error.statusCode = 403;

    throw error;
  }

  /**
   * Create customers
   */
  const result =
    await prisma.customer.createMany({
      data: finalCustomers,
    });

  /**
   * Calculate skipped rows
   *
   * Includes:
   * - duplicate rows in request
   * - existing customers
   */
  const skippedCount =
    rows.length -
    finalCustomers.length;

  return {
    success: true,

    message:
      "Customers imported successfully.",

    importedCount:
      result.count,

    skippedCount,
  };
};

module.exports = {
  previewImport,
  importCustomers,
};