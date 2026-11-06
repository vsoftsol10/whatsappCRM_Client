// ============================================
// SUPPORT CHATBOT - KNOWLEDGE SEARCH
// ============================================
// Finds the most relevant documentation chunks for a question using
// PostgreSQL full-text search (no extra service needed). Only PUBLISHED
// documents are ever used.

const prisma = require("../../config/prisma");

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "was", "were", "how", "what", "when", "where",
  "why", "who", "can", "could", "would", "should", "does", "did", "do",
  "you", "your", "with", "this", "that", "from", "have", "has", "had",
  "not", "but", "any", "our", "about", "into", "than", "then", "there",
  "please", "help", "need", "want", "tell", "show", "make", "get", "use",
]);

const extractWords = (text) =>
  [
    ...new Set(
      String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
    ),
  ].slice(0, 12);

// returns [{ chunkId, docId, title, category, content }]
const searchKnowledge = async (query, limit = 5) => {
  const words = extractWords(query);

  if (words.length === 0) return [];

  const k = Math.min(Math.max(Number(limit) || 5, 1), 10);
  const tsQuery = words.join(" | ");

  let rows = [];

  try {
    rows = await prisma.$queryRaw`
      SELECT c.id AS "chunkId", c."docId" AS "docId", c.content AS content,
             d.title AS title, d.category AS category,
             ts_rank(
               to_tsvector('english', d.title || ' ' || c.content),
               to_tsquery('english', ${tsQuery})
             ) AS rank
      FROM "KnowledgeChunk" c
      JOIN "KnowledgeDoc" d ON d.id = c."docId"
      WHERE d."isPublished" = true
        AND to_tsvector('english', d.title || ' ' || c.content)
            @@ to_tsquery('english', ${tsQuery})
      ORDER BY rank DESC
      LIMIT ${k}
    `;
  } catch (error) {
    console.error("Knowledge full-text search failed:", error.message);
  }

  if (rows.length > 0) return rows;

  // Fallback: simple "contains" match (helps with partial words / typos)
  const fallback = await prisma.knowledgeChunk.findMany({
    where: {
      doc: { isPublished: true },
      OR: words.slice(0, 6).flatMap((w) => [
        { content: { contains: w, mode: "insensitive" } },
        { doc: { title: { contains: w, mode: "insensitive" } } },
      ]),
    },
    include: { doc: { select: { id: true, title: true, category: true } } },
    take: k,
  });

  return fallback.map((c) => ({
    chunkId: c.id,
    docId: c.doc.id,
    title: c.doc.title,
    category: c.doc.category,
    content: c.content,
  }));
};

// Titles of all published docs (so the AI can point users to topics it knows)
const listTopics = (limit = 40) =>
  prisma.knowledgeDoc.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, category: true },
    orderBy: { title: "asc" },
    take: limit,
  });

module.exports = { searchKnowledge, listTopics };
