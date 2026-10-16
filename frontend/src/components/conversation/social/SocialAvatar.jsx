import { getInitial } from "./socialTheme";

// Round avatar with the contact's first letter.
// Instagram shows a colourful ring when there is an unread message.
function SocialAvatar({ conversation, theme, size = 56, ring = false }) {
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
