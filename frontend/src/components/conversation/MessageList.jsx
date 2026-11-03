import { Fragment, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

const DAY_MS = 24 * 60 * 60 * 1000;

// Midnight (local time) of the day a date falls on
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// WhatsApp style label: Today / Yesterday / Sunday / 12 Sep 2026
const getDayLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const daysAgo = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / DAY_MS
  );

  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function DateSeparator({ label }) {
  return (
    <div className="my-2 flex justify-center">
      <span className="rounded-lg bg-white/90 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
        {label}
      </span>
    </div>
  );
}

function MessageList({ messages }) {
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-[#efeae2] px-4">
        <div className="rounded-xl bg-white px-5 py-3 shadow-sm">
          <p className="text-center text-sm text-gray-500">
            No messages yet
          </p>
        </div>
      </div>
    );
  }

  let lastDayKey = null;

  return (
    <div
      className="
        flex
        h-full
        flex-col
        gap-2
        overflow-y-auto
        bg-[#efeae2]
        px-2
        py-3
        sm:px-4
        sm:py-6
      "
    >
      {messages.map((message) => {
        const dayKey = startOfDay(message.createdAt);
        const showSeparator = dayKey !== lastDayKey && !Number.isNaN(dayKey);
        lastDayKey = dayKey;

        return (
          <Fragment key={message.id}>
            {showSeparator && (
              <DateSeparator label={getDayLabel(message.createdAt)} />
            )}
            <MessageBubble message={message} />
          </Fragment>
        );
      })}

      {/* Auto-scroll target */}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;