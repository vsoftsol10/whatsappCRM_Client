const XLSX = require("xlsx");

/**
 * Builds a human-readable Excel workbook from the same data
 * that goes into the JSON backup.
 *
 * - IDs are replaced by names (customer, employee, lead...)
 * - Enum values are shown as "In Progress" instead of "IN_PROGRESS"
 * - Dates are real Excel dates in Indian time (IST)
 * - Phone numbers stay text so Excel does not turn them into 9.19E+11
 *
 * The JSON zip is still created for technical restore.
 * This file is for normal customers / business users.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DATE_FORMAT = "dd-mmm-yyyy hh:mm AM/PM";
const ONLY_DATE_FORMAT = "dd-mmm-yyyy";

// Excel limits
const MAX_ROWS_PER_SHEET = 1000000; // real limit is 1,048,576 incl. header
const MAX_CELL_CHARS = 32000; // real limit is 32,767

//////////////////////////////////////////////////////
// HELPERS
//////////////////////////////////////////////////////

// Remove characters that make Excel say "file is corrupt"
const cleanText = (value) => {
  if (value === null || value === undefined) return "";

  let text =
    typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

  // eslint-disable-next-line no-control-regex
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

  if (text.length > MAX_CELL_CHARS) {
    text = text.slice(0, MAX_CELL_CHARS) + " ...(truncated)";
  }

  return text;
};

// "IN_PROGRESS" -> "In Progress"
const pretty = (value) => {
  if (!value) return "";

  return String(value)
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

// Real Excel date cell, shown in IST
const dateCell = (value, format = DATE_FORMAT) => {
  if (!value) return "";

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "";

  // Excel serial number (days since 1899-12-30)
  const serial = (time + IST_OFFSET_MS) / 86400000 + 25569;

  return { t: "n", v: serial, z: format };
};

const yesNo = (value) => (value ? "Yes" : "No");

// {"before":{"status":"NEW"},"after":{"status":"CONTACTED"}}
//   -> "Status: New -> Contacted"
const prettyKey = (key) =>
  String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const describeChanges = (changes, resolveValue) => {
  if (!changes || typeof changes !== "object") return "";

  const before = changes.before || {};
  const after = changes.after || {};
  const keys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)])
  );

  const show = (key, value) => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }
    const resolved = resolveValue(value);
    if (typeof resolved === "boolean") return yesNo(resolved);
    if (typeof resolved === "string" && /^[A-Z_]+$/.test(resolved)) {
      return pretty(resolved);
    }
    return typeof resolved === "object"
      ? JSON.stringify(resolved)
      : String(resolved);
  };

  return keys
    .map((key) => {
      const hasBefore = key in before;
      return hasBefore
        ? `${prettyKey(key)}: ${show(key, before[key])} -> ${show(key, after[key])}`
        : `${prettyKey(key)}: ${show(key, after[key])}`;
    })
    .join(" | ");
};

const senderLabel = (sender) => {
  if (sender === "CUSTOMER") return "Customer";
  if (sender === "AGENT") return "Team Member";
  if (sender === "BOT") return "AI Bot";
  return pretty(sender);
};

// Keep phone as TEXT
const phoneCell = (value) =>
  value ? { t: "s", v: cleanText(value) } : "";

const toCell = (value) => {
  if (value && typeof value === "object" && "t" in value) {
    return value; // already a cell (date / phone)
  }
  if (typeof value === "number") return value;
  return cleanText(value);
};

const sheetNameSafe = (name) =>
  name.replace(/[\[\]\*\?\/\\:]/g, " ").slice(0, 31);

// headers: ["Name", "Phone"], widths: [20, 16], rows: [[..], [..]]
const addSheet = (workbook, name, headers, widths, rows) => {
  const chunks = [];

  if (rows.length === 0) {
    chunks.push([]);
  } else {
    for (let i = 0; i < rows.length; i += MAX_ROWS_PER_SHEET) {
      chunks.push(rows.slice(i, i + MAX_ROWS_PER_SHEET));
    }
  }

  chunks.forEach((chunk, index) => {
    const aoa = [headers, ...chunk.map((row) => row.map(toCell))];

    if (chunk.length === 0) {
      aoa.push(["No records"]);
    }

    const sheet = XLSX.utils.aoa_to_sheet(aoa);

    sheet["!cols"] = widths.map((wch) => ({ wch }));

    sheet["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: 0, c: headers.length - 1 },
      }),
    };

    const sheetName =
      chunks.length > 1
        ? sheetNameSafe(`${name} ${index + 1}`)
        : sheetNameSafe(name);

    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  });
};

//////////////////////////////////////////////////////
// MAIN
//////////////////////////////////////////////////////

const buildBackupWorkbook = (data) => {
  const {
    company,
    users,
    whatsappAccounts,
    customers,
    conversations,
    messages,
    campaigns,
    campaignRecipients,
    templates,
    templateRecipients,
    leads,
    leadWorkNotes,
    deals,
    dealActivities,
    tasks,
    taskWorkNotes,
    tickets,
    ticketWorkNotes,
    userNotifications,
    crmAuditLogs,
    backupCreatedAt,
  } = data;

  // ---------- lookup maps (ID -> readable name) ----------

  const userMap = new Map(users.map((u) => [u.id, u]));
  const customerMap = new Map(customers.map((c) => [c.id, c]));
  const leadMap = new Map(leads.map((l) => [l.id, l]));
  const dealMap = new Map(deals.map((d) => [d.id, d]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const ticketMap = new Map(tickets.map((t) => [t.id, t]));
  const templateMap = new Map(templates.map((t) => [t.id, t]));
  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));
  const conversationMap = new Map(conversations.map((c) => [c.id, c]));
  const accountMap = new Map(
    whatsappAccounts.map((a) => [a.id, a])
  );

  const userName = (id) => (id && userMap.get(id)?.name) || "";
  const customerName = (id) =>
    (id && customerMap.get(id)?.name) || "";
  const customerPhone = (id) => customerMap.get(id)?.phone || "";

  const chatName = (conversation) => {
    if (!conversation) return "";
    const customer = customerMap.get(conversation.customerId);
    return (
      customer?.name ||
      conversation.contactName ||
      conversation.phone ||
      "Unknown"
    );
  };

  const chatPhone = (conversation) => {
    if (!conversation) return "";
    const customer = customerMap.get(conversation.customerId);
    return customer?.phone || conversation.phone || "";
  };

  const accountName = (id) => {
    const a = id && accountMap.get(id);
    if (!a) return "";
    return a.whatsappBusinessName || a.displayPhoneNumber || "";
  };

  const workbook = XLSX.utils.book_new();

  // ---------- 1. SUMMARY ----------

  const summaryRows = [
    ["CRM DATA BACKUP"],
    [],
    ["Company", company.companyName],
    ["Company ID", company.companyId],
    ["Backup created on", dateCell(backupCreatedAt)],
    ["Time zone", "Indian Standard Time (IST)"],
    [],
    ["What is inside this file", "Records"],
    ["Customers", customers.length],
    ["Leads", leads.length],
    ["Deals", deals.length],
    ["Tasks", tasks.length],
    ["Support Tickets", tickets.length],
    ["Chats (conversations)", conversations.length],
    ["Chat Messages", messages.length],
    ["Campaigns", campaigns.length],
    ["Message Templates", templates.length],
    ["Team Members", users.length],
    ["Activity Log entries", crmAuditLogs.length],
    [],
    [
      "Note",
      "Passwords, login tokens and WhatsApp access tokens are never included in a backup.",
    ],
    [
      "Note",
      "Each sheet (tab) at the bottom of this file is one section. Use the filter arrows in the first row to search or sort.",
    ],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(
    summaryRows.map((row) => row.map(toCell))
  );
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // ---------- 2. CUSTOMERS ----------

  addSheet(
    workbook,
    "Customers",
    [
      "Name",
      "Phone",
      "Email",
      "Company",
      "Status",
      "Source",
      "Requirements",
      "Owner (Team Member)",
      "Created On",
      "Last Updated",
    ],
    [24, 16, 28, 24, 12, 16, 40, 22, 20, 20],
    customers.map((c) => [
      c.name,
      phoneCell(c.phone),
      c.email,
      c.companyName,
      pretty(c.status),
      c.source,
      c.requirements,
      userName(c.userId),
      dateCell(c.createdAt),
      dateCell(c.updatedAt),
    ])
  );

  // ---------- 3. LEADS ----------

  addSheet(
    workbook,
    "Leads",
    [
      "Name",
      "Phone",
      "Email",
      "Company",
      "Status",
      "Converted to Customer",
      "Source",
      "Requirements",
      "Assigned To",
      "Created On",
      "Last Updated",
    ],
    [24, 16, 28, 24, 12, 12, 16, 40, 22, 20, 20],
    leads.map((l) => [
      l.name,
      phoneCell(l.phone),
      l.email,
      l.companyName,
      pretty(l.status),
      yesNo(l.isConverted),
      l.source,
      l.requirements,
      userName(l.assignedToId),
      dateCell(l.createdAt),
      dateCell(l.updatedAt),
    ])
  );

  addSheet(
    workbook,
    "Lead Notes",
    ["Lead", "Lead Phone", "Note", "Written By", "Date"],
    [24, 16, 70, 22, 20],
    leadWorkNotes.map((n) => {
      const lead = leadMap.get(n.leadId);
      return [
        lead?.name,
        phoneCell(lead?.phone),
        n.note,
        userName(n.employeeId),
        dateCell(n.createdAt),
      ];
    })
  );

  // ---------- 4. DEALS ----------

  addSheet(
    workbook,
    "Deals",
    [
      "Deal",
      "Customer",
      "Customer Phone",
      "Stage",
      "Value",
      "Description",
      "Assigned To",
      "Created By",
      "Created On",
      "Last Updated",
    ],
    [28, 24, 16, 14, 14, 40, 22, 22, 20, 20],
    deals.map((d) => [
      d.title,
      customerName(d.customerId),
      phoneCell(customerPhone(d.customerId)),
      pretty(d.stage),
      Number(d.value) || 0,
      d.description,
      userName(d.assignedToId),
      userName(d.createdById),
      dateCell(d.createdAt),
      dateCell(d.updatedAt),
    ])
  );

  addSheet(
    workbook,
    "Deal Activities",
    ["Deal", "Customer", "Activity Type", "Note", "By", "Date"],
    [28, 24, 16, 60, 22, 20],
    dealActivities.map((a) => {
      const deal = dealMap.get(a.dealId);
      return [
        deal?.title,
        customerName(deal?.customerId),
        pretty(a.type),
        a.note,
        userName(a.createdById),
        dateCell(a.createdAt),
      ];
    })
  );

  // ---------- 5. TASKS ----------

  addSheet(
    workbook,
    "Tasks",
    [
      "Task",
      "Description",
      "Status",
      "Priority",
      "Due Date",
      "Assigned To",
      "Created By",
      "Created On",
      "Last Updated",
    ],
    [30, 44, 14, 12, 16, 22, 22, 20, 20],
    tasks.map((t) => [
      t.title,
      t.description,
      pretty(t.status),
      pretty(t.priority),
      dateCell(t.dueDate, ONLY_DATE_FORMAT),
      userName(t.assignedToId),
      userName(t.createdById),
      dateCell(t.createdAt),
      dateCell(t.updatedAt),
    ])
  );

  addSheet(
    workbook,
    "Task Notes",
    ["Task", "Note", "Written By", "Date"],
    [30, 70, 22, 20],
    taskWorkNotes.map((n) => [
      taskMap.get(n.taskId)?.title,
      n.note,
      userName(n.employeeId),
      dateCell(n.createdAt),
    ])
  );

  // ---------- 6. TICKETS ----------

  addSheet(
    workbook,
    "Tickets",
    [
      "Ticket",
      "Description",
      "Customer",
      "Customer Phone",
      "Status",
      "Priority",
      "Assigned To",
      "Created By",
      "Created On",
      "Last Updated",
    ],
    [30, 44, 24, 16, 14, 12, 22, 22, 20, 20],
    tickets.map((t) => [
      t.title,
      t.description,
      customerName(t.customerId),
      phoneCell(customerPhone(t.customerId)),
      pretty(t.status),
      pretty(t.priority),
      userName(t.assignedToId),
      userName(t.createdById),
      dateCell(t.createdAt),
      dateCell(t.updatedAt),
    ])
  );

  addSheet(
    workbook,
    "Ticket Notes",
    ["Ticket", "Note", "Written By", "Date"],
    [30, 70, 22, 20],
    ticketWorkNotes.map((n) => [
      ticketMap.get(n.ticketId)?.title,
      n.note,
      userName(n.employeeId),
      dateCell(n.createdAt),
    ])
  );

  // ---------- 7. CHATS ----------

  addSheet(
    workbook,
    "Chats",
    [
      "Customer / Contact",
      "Phone",
      "Channel",
      "WhatsApp Number Used",
      "Status",
      "Last Message",
      "Unread",
      "AI Bot On",
      "Started On",
      "Last Updated",
    ],
    [24, 16, 12, 22, 10, 50, 8, 10, 20, 20],
    conversations.map((c) => [
      chatName(c),
      phoneCell(chatPhone(c)),
      pretty(c.channel),
      accountName(c.whatsappAccountId),
      pretty(c.status),
      c.lastMessage,
      c.unreadCount,
      yesNo(c.botEnabled),
      dateCell(c.createdAt),
      dateCell(c.updatedAt),
    ])
  );

  // Messages grouped by customer, oldest first inside each chat
  const sortedMessages = [...messages].sort((a, b) => {
    const nameA = chatName(conversationMap.get(a.conversationId));
    const nameB = chatName(conversationMap.get(b.conversationId));
    if (nameA !== nameB) return nameA.localeCompare(nameB);
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  addSheet(
    workbook,
    "Messages",
    [
      "Customer / Contact",
      "Phone",
      "Date & Time",
      "From",
      "Type",
      "Message",
      "Media Link",
      "Delivery Status",
      "Failure Reason",
    ],
    [24, 16, 20, 14, 10, 70, 40, 14, 30],
    sortedMessages.map((m) => {
      const conversation = conversationMap.get(m.conversationId);
      return [
        chatName(conversation),
        phoneCell(chatPhone(conversation)),
        dateCell(m.createdAt),
        senderLabel(m.sender),
        pretty(m.messageType),
        m.content,
        m.imageUrl,
        pretty(m.status),
        m.failureReason,
      ];
    })
  );

  // ---------- 8. CAMPAIGNS ----------

  addSheet(
    workbook,
    "Campaigns",
    [
      "Campaign",
      "Type",
      "Status",
      "Template Used",
      "WhatsApp Number",
      "Total Recipients",
      "Sent",
      "Delivered",
      "Read",
      "Failed",
      "Scheduled For",
      "Started",
      "Completed",
      "Created By",
      "Created On",
    ],
    [26, 14, 12, 24, 22, 12, 8, 10, 8, 8, 20, 20, 20, 22, 20],
    campaigns.map((c) => [
      c.name,
      pretty(c.type),
      pretty(c.status),
      templateMap.get(c.templateId)?.name,
      accountName(c.whatsappAccountId),
      c.totalRecipients,
      c.sentCount,
      c.deliveredCount,
      c.readCount,
      c.failedCount,
      dateCell(c.scheduledAt),
      dateCell(c.startedAt),
      dateCell(c.completedAt),
      userName(c.createdById),
      dateCell(c.createdAt),
    ])
  );

  addSheet(
    workbook,
    "Campaign Recipients",
    [
      "Campaign",
      "Customer",
      "Phone",
      "Status",
      "Sent At",
      "Delivered At",
      "Read At",
      "Failed At",
      "Failure Reason",
    ],
    [26, 24, 16, 12, 20, 20, 20, 20, 36],
    campaignRecipients.map((r) => [
      campaignMap.get(r.campaignId)?.name,
      customerName(r.customerId),
      phoneCell(customerPhone(r.customerId)),
      pretty(r.status),
      dateCell(r.sentAt),
      dateCell(r.deliveredAt),
      dateCell(r.readAt),
      dateCell(r.failedAt),
      r.failureReason,
    ])
  );

  // ---------- 9. TEMPLATES ----------

  addSheet(
    workbook,
    "Templates",
    [
      "Template Name",
      "Language",
      "Category",
      "Type",
      "Status",
      "Purpose",
      "Auto Send",
      "Header",
      "Message",
      "Footer",
      "Rejection Reason",
      "Created On",
    ],
    [26, 10, 14, 12, 12, 16, 10, 24, 60, 24, 30, 20],
    templates.map((t) => [
      t.name,
      t.language,
      pretty(t.category),
      pretty(t.messageType),
      pretty(t.status),
      pretty(t.purpose),
      yesNo(t.autoSend),
      t.headerContent,
      t.content,
      t.footerContent,
      t.rejectionReason,
      dateCell(t.createdAt),
    ])
  );

  addSheet(
    workbook,
    "Template Sends",
    [
      "Template",
      "Customer",
      "Phone",
      "Status",
      "Sent At",
      "Delivered At",
      "Read At",
    ],
    [26, 24, 16, 12, 20, 20, 20],
    templateRecipients.map((r) => [
      templateMap.get(r.templateId)?.name,
      customerName(r.customerId),
      phoneCell(customerPhone(r.customerId)),
      pretty(r.status),
      dateCell(r.sentAt),
      dateCell(r.deliveredAt),
      dateCell(r.readAt),
    ])
  );

  // ---------- 10. TEAM & SETTINGS ----------

  addSheet(
    workbook,
    "Team Members",
    [
      "Name",
      "Email",
      "Phone",
      "Role",
      "Department",
      "Designation",
      "Status",
      "Address",
      "Joined On",
    ],
    [22, 30, 16, 10, 18, 18, 10, 36, 20],
    users.map((u) => [
      u.name,
      u.email,
      phoneCell(u.phone),
      pretty(u.role),
      u.department,
      u.designation,
      pretty(u.status),
      u.address,
      dateCell(u.createdAt),
    ])
  );

  addSheet(
    workbook,
    "WhatsApp Numbers",
    [
      "Business Name",
      "Phone Number",
      "Status",
      "Connected On",
      "Disconnected On",
    ],
    [28, 18, 16, 20, 20],
    whatsappAccounts.map((a) => [
      a.whatsappBusinessName,
      phoneCell(a.displayPhoneNumber),
      pretty(a.status),
      dateCell(a.connectedAt),
      dateCell(a.disconnectedAt),
    ])
  );

  // ---------- 11. LOGS ----------

  addSheet(
    workbook,
    "Notifications",
    ["User", "Title", "Message", "Type", "Read", "Date"],
    [22, 30, 60, 16, 8, 20],
    userNotifications.map((n) => [
      userName(n.userId),
      n.title,
      n.message,
      pretty(n.type),
      yesNo(n.isRead),
      dateCell(n.createdAt),
    ])
  );

  addSheet(
    workbook,
    "Activity Log",
    [
      "Date",
      "User",
      "Role",
      "Action",
      "Section",
      "Item",
      "Details",
      "IP Address",
    ],
    [20, 22, 10, 14, 16, 28, 60, 16],
    crmAuditLogs.map((l) => [
      dateCell(l.createdAt),
      l.userName,
      pretty(l.userRole),
      pretty(l.action),
      pretty(l.module),
      l.entityName,
      describeChanges(l.changes, (v) =>
        typeof v === "string" && userMap.has(v)
          ? userMap.get(v).name
          : v
      ),
      l.ipAddress,
    ])
  );

  return workbook;
};

// Returns a Buffer ready to save / send
const buildBackupExcelBuffer = (data) => {
  const workbook = buildBackupWorkbook(data);

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  });
};

module.exports = {
  buildBackupExcelBuffer,
};
