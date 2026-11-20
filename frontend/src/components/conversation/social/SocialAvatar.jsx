import { getInitial } from "./socialTheme";

// Round avatar with the contact's first letter.
// Instagram shows a colourful ring when there is an unread message.
function SocialAvatar({ conversation, theme, size = 56, ring = false }) {
  // Instagram: white circle with a dark letter, always wrapped in the
  // Instagram gradient ring (same total size as before, so layouts don't move).
  if (theme.variant === "instagram") {
    const pad = Math.max(2, Math.round(size * 0.04));
    const innerSize = size - pad * 4;

    return (
      <div
        style={{ width: size, height: size, padding: pad }}
        className="shrink-0 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]"
      >
        <div
          style={{ padding: pad }}
          className="h-full w-full rounded-full bg-white"
        >
          <div
            style={{ width: innerSize, height: innerSize, fontSize: innerSize * 0.45 }}
            className="flex items-center justify-center rounded-full bg-white font-semibold text-[#262626]"
          >
            {getInitial(conversation)}
          </div>
        </div>
      </div>
    );
  }

  const inner = (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${theme.avatarBg}`}
    >
      {getInitial(conversation)}
    </div>
  );

  if (!ring) return inner;

  return (
    <div className="rounded-full bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5] p-[2px]">
      <div className="rounded-full bg-white p-[2px]">{inner}</div>
    </div>
  );
}

export default SocialAvatar;