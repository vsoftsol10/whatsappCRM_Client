// ============================================================
// LinkifiedText
// Shows message text and turns every web address in it into a
// clickable link that opens in a new tab.
//
// Works for:  https://example.com/abc   http://example.com
//             www.example.com/page      (opened as https://)
//
// Safe by design: it only ever builds React elements (no
// dangerouslySetInnerHTML) and only http / https links are made
// clickable, so a message cannot inject a "javascript:" link.
// ============================================================

// A link starts with http(s):// or www. and runs until whitespace.
const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<>]+)/gi;

// Punctuation that usually belongs to the sentence, not to the link,
// e.g. "check https://site.com/a, then reply."
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;

const splitTrailingPunctuation = (raw) => {
  const match = raw.match(TRAILING_PUNCTUATION);
  if (!match) return { link: raw, trailing: "" };

  let trailing = match[0];
  let link = raw.slice(0, raw.length - trailing.length);

  // Keep a closing ")" that belongs to the link, e.g. wikipedia.org/wiki/A_(b)
  if (trailing.startsWith(")") && link.includes("(") && !link.includes(")")) {
    link += ")";
    trailing = trailing.slice(1);
  }

  return { link, trailing };
};

const toHref = (link) =>
  /^https?:\/\//i.test(link) ? link : `https://${link}`;

function LinkifiedText({ text, linkClassName = "" }) {
  if (!text) return null;

  const value = String(text);
  const parts = value.split(URL_REGEX);

  // No link inside the text -> render it exactly as before
  if (parts.length === 1) return <>{value}</>;

  return (
    <>
      {parts.map((part, index) => {
        // split() with a capture group puts the links at the odd positions
        if (index % 2 === 0) return part;

        const { link, trailing } = splitTrailingPunctuation(part);
        if (!link) return part;

        return (
          <span key={index}>
            <a
              href={toHref(link)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`break-all font-medium underline underline-offset-2 hover:opacity-80 ${linkClassName}`}
            >
              {link}
            </a>
            {trailing}
          </span>
        );
      })}
    </>
  );
}

export default LinkifiedText;
