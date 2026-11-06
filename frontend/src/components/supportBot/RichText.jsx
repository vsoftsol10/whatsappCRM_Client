// Tiny, safe formatter for chatbot answers: **bold**, `code`, numbered and
// bullet lists. Builds React elements (no dangerouslySetInnerHTML), so
// nothing the AI returns can inject HTML or scripts.

const renderInline = (text, keyPrefix) =>
  text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={`${keyPrefix}-${i}`}
          className="rounded bg-black/10 px-1 py-0.5 text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });

export default function RichText({ text }) {
  const lines = String(text || "").replace(/\r/g, "").split("\n");
  const blocks = [];
  let list = null;

  const closeList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  lines.forEach((raw, index) => {
    const line = raw.trim();
    const ordered = line.match(/^(\d+)[.)]\s+(.*)$/);
    const bullet = line.match(/^[-*•]\s+(.*)$/);

    if (ordered || bullet) {
      const type = ordered ? "ol" : "ul";

      if (!list || list.type !== type) {
        closeList();
        list = { type, items: [], key: `l${index}` };
      }

      list.items.push((ordered ? ordered[2] : bullet[1]).trim());
      return;
    }

    closeList();

    if (line) blocks.push({ type: "p", text: line, key: `p${index}` });
  });

  closeList();

  return (
    <div className="space-y-2 break-words">
      {blocks.map((b) => {
        if (b.type === "p") {
          return <p key={b.key}>{renderInline(b.text, b.key)}</p>;
        }

        const Tag = b.type;

        return (
          <Tag
            key={b.key}
            className={`ml-5 space-y-1 ${b.type === "ol" ? "list-decimal" : "list-disc"}`}
          >
            {b.items.map((item, i) => (
              <li key={`${b.key}-${i}`}>{renderInline(item, `${b.key}-${i}`)}</li>
            ))}
          </Tag>
        );
      })}
    </div>
  );
}