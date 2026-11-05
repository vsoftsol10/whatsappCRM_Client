// ======================================================
// backend/src/services/proposalPdfService.js   (NEW FILE)
// Builds the proposal PDF and returns it as a Buffer.
// Needs:  npm install pdfkit
// ======================================================
const PDFDocument = require("pdfkit");
const axios = require("axios");

// The built-in PDF fonts cannot draw the rupee sign, so INR is written
// as "Rs." inside the PDF. (The CRM screen still shows the rupee sign.)
const CURRENCY_LABEL = {
  INR: "Rs. ",
  USD: "$",
  EUR: "EUR ",
  GBP: "GBP ",
  AED: "AED ",
};

const money = (value, currency) => {
  const label = CURRENCY_LABEL[currency] ?? `${currency} `;
  const n = Number(value) || 0;

  return `${label}${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

// The company logo is a Cloudinary URL. PDFKit only reads PNG / JPG, so
// ask Cloudinary for a PNG. Any failure simply means "no logo in the PDF".
const loadLogo = async (url) => {
  if (!url) return null;

  try {
    const pngUrl = url.includes("/upload/")
      ? url.replace("/upload/", "/upload/f_png,w_300/")
      : url;

    const res = await axios.get(pngUrl, {
      responseType: "arraybuffer",
      timeout: 8000,
    });

    return Buffer.from(res.data);
  } catch (e) {
    return null;
  }
};

const BRAND = "#1f2937";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";
const ACCENT = "#0f766e";

const buildProposalPdf = async (proposal, company, customer) => {
  const logo = await loadLogo(company.logo);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      const left = doc.page.margins.left;
      const right = doc.page.width - doc.page.margins.right;
      const width = right - left;

      const bottomLimit = () =>
        doc.page.height - doc.page.margins.bottom - 20;

      const ensureSpace = (needed) => {
        if (doc.y + needed > bottomLimit()) doc.addPage();
      };

      // ---------- HEADER ----------
      let textX = left;

      if (logo) {
        try {
          doc.image(logo, left, 48, { fit: [70, 50] });
          textX = left + 82;
        } catch (e) {
          // unreadable image - continue without a logo
        }
      }

      doc
        .fillColor(BRAND)
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(company.companyName || "", textX, 48, { width: 280 });

      doc.font("Helvetica").fontSize(9).fillColor(MUTED);

      if (company.address) {
        doc.text(company.address, textX, doc.y, { width: 280 });
      }

      const contactLine = [company.phone, company.email]
        .filter(Boolean)
        .join("  |  ");

      if (contactLine) {
        doc.text(contactLine, textX, doc.y, { width: 280 });
      }

      const leftBottom = Math.max(doc.y, 100);

      // Right side: PROPOSAL + number + dates
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(ACCENT)
        .text("PROPOSAL", left, 48, { width, align: "right" });

      doc.font("Helvetica").fontSize(9).fillColor(MUTED);
      doc.text(`No: ${proposal.proposalNumber}`, left, doc.y + 2, {
        width,
        align: "right",
      });
      doc.text(`Date: ${formatDate(proposal.issueDate)}`, left, doc.y, {
        width,
        align: "right",
      });

      if (proposal.validUntil) {
        doc.text(`Valid until: ${formatDate(proposal.validUntil)}`, left, doc.y, {
          width,
          align: "right",
        });
      }

      doc.y = Math.max(leftBottom, doc.y) + 14;
      doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor(LINE).stroke();
      doc.y += 14;

      // ---------- PREPARED FOR ----------
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(MUTED)
        .text("PREPARED FOR", left, doc.y);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(BRAND)
        .text(customer.name || "", left, doc.y + 2);

      doc.font("Helvetica").fontSize(9).fillColor(MUTED);
      if (customer.companyName) doc.text(customer.companyName, left, doc.y);
      if (customer.email) doc.text(customer.email, left, doc.y);
      if (customer.phone) doc.text(customer.phone, left, doc.y);
      doc.y += 14;

      // ---------- TITLE + INTRO ----------
      doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(BRAND)
        .text(proposal.title, left, doc.y, { width });
      doc.y += 6;

      if (proposal.introMessage) {
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(BRAND)
          .text(proposal.introMessage, left, doc.y, { width, lineGap: 2 });
        doc.y += 10;
      }

      const section = (heading, body) => {
        if (!body) return;

        ensureSpace(60);
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(ACCENT)
          .text(heading, left, doc.y);
        doc.y += 3;
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor(BRAND)
          .text(body, left, doc.y, { width, lineGap: 2 });
        doc.y += 12;
      };

      section("Scope of Work", proposal.scope);

      // ---------- ITEMS TABLE ----------
      ensureSpace(80);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(ACCENT)
        .text("Pricing", left, doc.y);
      doc.y += 6;

      const col = {
        item: left,
        qty: left + 235,
        price: left + 275,
        disc: left + 350,
        tax: left + 395,
        total: left + 435,
      };
      const colW = {
        item: 230,
        qty: 35,
        price: 70,
        disc: 40,
        tax: 40,
        total: right - (left + 435),
      };

      const drawHeaderRow = () => {
        const y = doc.y;
        doc.rect(left, y, width, 20).fill("#f3f4f6");
        doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(8);
        doc.text("ITEM", col.item + 6, y + 6, { width: colW.item });
        doc.text("QTY", col.qty, y + 6, { width: colW.qty, align: "right" });
        doc.text("PRICE", col.price, y + 6, { width: colW.price, align: "right" });
        doc.text("DISC", col.disc, y + 6, { width: colW.disc, align: "right" });
        doc.text("TAX", col.tax, y + 6, { width: colW.tax, align: "right" });
        doc.text("TOTAL", col.total, y + 6, {
          width: colW.total - 4,
          align: "right",
        });
        doc.y = y + 26;
      };

      drawHeaderRow();

      for (const it of proposal.items) {
        doc.font("Helvetica-Bold").fontSize(9);
        const nameH = doc.heightOfString(it.name || "", {
          width: colW.item - 6,
        });

        let descH = 0;
        if (it.description) {
          doc.font("Helvetica").fontSize(8);
          descH = doc.heightOfString(it.description, { width: colW.item - 6 });
        }

        const rowH = nameH + descH + 12;

        if (doc.y + rowH > bottomLimit()) {
          doc.addPage();
          drawHeaderRow();
        }

        const y = doc.y;

        doc
          .fillColor(BRAND)
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(it.name || "", col.item + 6, y, { width: colW.item - 6 });

        if (it.description) {
          doc
            .fillColor(MUTED)
            .font("Helvetica")
            .fontSize(8)
            .text(it.description, col.item + 6, doc.y, {
              width: colW.item - 6,
            });
        }

        doc.fillColor(BRAND).font("Helvetica").fontSize(9);
        doc.text(String(it.quantity), col.qty, y, {
          width: colW.qty,
          align: "right",
        });
        doc.text(money(it.unitPrice, proposal.currency), col.price, y, {
          width: colW.price,
          align: "right",
        });
        doc.text(`${it.discountPercent || 0}%`, col.disc, y, {
          width: colW.disc,
          align: "right",
        });
        doc.text(`${it.taxPercent || 0}%`, col.tax, y, {
          width: colW.tax,
          align: "right",
        });
        doc.text(money(it.lineTotal, proposal.currency), col.total, y, {
          width: colW.total - 4,
          align: "right",
        });

        doc.y = y + rowH;
        doc
          .moveTo(left, doc.y - 4)
          .lineTo(right, doc.y - 4)
          .strokeColor(LINE)
          .stroke();
      }

      // ---------- TOTALS ----------
      ensureSpace(90);
      doc.y += 6;

      const labelX = left + 290;
      const labelW = 100;
      const valX = left + 395;
      const valW = right - valX - 4;

      const totalRow = (label, value, bold = false) => {
        const y = doc.y;
        doc
          .font(bold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(bold ? 11 : 9)
          .fillColor(bold ? ACCENT : BRAND);
        doc.text(label, labelX, y, { width: labelW, align: "right" });
        doc.text(value, valX, y, { width: valW, align: "right" });
        doc.y = y + (bold ? 18 : 14);
      };

      totalRow("Subtotal", money(proposal.subtotal, proposal.currency));

      if (proposal.discountTotal > 0) {
        totalRow(
          "Discount",
          `- ${money(proposal.discountTotal, proposal.currency)}`
        );
      }

      totalRow("Tax", money(proposal.taxTotal, proposal.currency));

      doc.moveTo(labelX, doc.y).lineTo(right, doc.y).strokeColor(LINE).stroke();
      doc.y += 4;

      totalRow("Total", money(proposal.total, proposal.currency), true);
      doc.y += 10;

      // ---------- PAYMENT + TERMS ----------
      section("Payment Details", proposal.paymentDetails);
      section("Terms & Conditions", proposal.terms);

      // ---------- FOOTER ----------
      ensureSpace(30);
      doc.y += 6;
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(MUTED)
        .text(
          `Thank you for the opportunity - ${company.companyName || ""}`,
          left,
          doc.y,
          { width, align: "center" }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { buildProposalPdf };