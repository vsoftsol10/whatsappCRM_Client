import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Bot,
  X,
  Send,
  Ticket,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import {
  getSupportBotStatus,
  getLatestSupportChat,
  sendSupportBotMessage,
  sendSupportBotFeedback,
} from "../../api/supportBotApi";
import { createSupportTicket } from "../../api/supportTicketApi";
import RichText from "./RichText";

const TICKET_TAG = "[Created from AI Support Chat]";

const clip = (text, max) => {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max)}...` : t;
};

// Pre-fills the ticket so the support team sees what the user already tried.
const buildTicketDraft = (messages) => {
  const real = messages.filter((m) => m.role === "user" || m.role === "assistant");
  const lastQuestion = [...real].reverse().find((m) => m.role === "user");

  const transcript = real
    .slice(-6)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${clip(m.content, 350)}`)
    .join("\n");

  return {
    title: lastQuestion ? clip(lastQuestion.content, 80) : "I need help",
    description: `${TICKET_TAG}\n\n${
      lastQuestion ? `Question: ${clip(lastQuestion.content, 500)}\n\n` : ""
    }${transcript ? `Chat so far:\n${transcript}` : ""}`.trim(),
    priority: "MEDIUM",
  };
};

export default function SupportChatWidget() {
  const location = useLocation();

  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("chat"); // "chat" | "ticket"
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadedHistory, setLoadedHistory] = useState(false);
  const [ticket, setTicket] = useState({ title: "", description: "", priority: "MEDIUM" });
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const bottomRef = useRef(null);
  const localId = useRef(0);

  // ---- is the chatbot on for my company? ----
  useEffect(() => {
    let cancelled = false;

    getSupportBotStatus()
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus({ enabled: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- bring back my last chat the first time the window opens ----
  useEffect(() => {
    if (!open || loadedHistory || !status?.enabled) return;

    setLoadedHistory(true);

    getLatestSupportChat()
      .then((data) => {
        if (data.conversationId && data.messages?.length) {
          setConversationId(data.conversationId);
          setMessages(data.messages);
        }
      })
      .catch(() => {});
  }, [open, loadedHistory, status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending, open, view]);

  const addLocal = useCallback((message) => {
    localId.current += 1;
    setMessages((prev) => [...prev, { localId: `l${localId.current}`, ...message }]);
  }, []);

  const openTicketForm = () => {
    setTicket(buildTicketDraft(messages));
    setView("ticket");
    setOpen(true);
  };

  const send = async (text) => {
    const message = String(text ?? input).trim();

    if (!message || sending) return;

    setInput("");
    addLocal({ role: "user", content: message });
    setSending(true);

    try {
      const data = await sendSupportBotMessage({
        message,
        conversationId,
        page: location.pathname,
      });

      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, data.message]);
    } catch (error) {
      const body = error.response?.data;
      const code = body?.code;

      addLocal({
        role: "notice",
        content: body?.message || "Something went wrong. Please try again.",
        offerTicket: ["LIMIT_REACHED", "DAILY_LIMIT", "AI_UNAVAILABLE"].includes(code),
      });

      if (code === "LIMIT_REACHED") {
        setStatus((s) => ({ ...s, limited: true }));
      }
    } finally {
      setSending(false);
    }
  };

  const rate = async (message, value) => {
    if (!message.id || message.feedback === value) return;

    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, feedback: value } : m))
    );

    try {
      await sendSupportBotFeedback(message.id, value);
    } catch {
      toast.error("Could not save your feedback.");
    }
  };

  const newChat = () => {
    setMessages([]);
    setConversationId(null);
    setView("chat");
  };

  const submitTicket = async (e) => {
    e.preventDefault();

    if (!ticket.title.trim() || !ticket.description.trim()) {
      toast.error("Please fill in the title and description.");
      return;
    }

    const description = ticket.description.includes(TICKET_TAG)
      ? ticket.description.trim()
      : `${TICKET_TAG}\n\n${ticket.description.trim()}`;

    try {
      setSubmittingTicket(true);

      const res = await createSupportTicket({
        title: ticket.title.trim(),
        description,
        priority: ticket.priority,
      });

      toast.success(res.message || "Support ticket created.");

      addLocal({
        role: "notice",
        content: "Your support ticket was created. Our team will get back to you soon.",
      });

      setView("chat");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create the ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Not enabled for this company (or still loading) -> show nothing at all
  if (!status?.enabled) return null;

  const limited = !!status.limited;
  const maxLength = status.maxMessageLength || 1000;

  // The conversation pages have a message box in the bottom-right corner;
  // lift the button above it.
  const raised = /conversations/.test(location.pathname);

  return (
    <>
      {open && (
        <div
          className={`fixed right-3 z-40 flex w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:right-5 sm:w-[390px] ${
            raised ? "bottom-40" : "bottom-24"
          } h-[min(560px,calc(100vh-8rem))]`}
          role="dialog"
          aria-label={status.botName}
        >
          {/* ---------- header ---------- */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#25D366] to-[#128C7E] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              {view === "ticket" ? (
                <button
                  type="button"
                  onClick={() => setView("chat")}
                  className="rounded-lg p-1 hover:bg-white/20"
                  aria-label="Back to chat"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : (
                <Bot size={20} />
              )}
              <div>
                <p className="text-sm font-semibold leading-tight">
                  {view === "ticket" ? "Contact support" : status.botName}
                </p>
                <p className="text-[11px] leading-tight text-white/80">
                  {view === "ticket" ? "We'll reply on your ticket" : "Ask me about the CRM"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {view === "chat" && (
                <>
                  <button
                    type="button"
                    onClick={openTicketForm}
                    className="rounded-lg p-2 hover:bg-white/20"
                    title="Contact support / raise a ticket"
                    aria-label="Contact support"
                  >
                    <Ticket size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={newChat}
                    className="rounded-lg p-2 hover:bg-white/20"
                    title="Start a new chat"
                    aria-label="New chat"
                  >
                    <RotateCcw size={17} />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-white/20"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ---------- ticket form ---------- */}
          {view === "ticket" ? (
            <form onSubmit={submitTicket} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <p className="text-xs text-gray-500">
                Check the details below, then send. Our support team will see your chat summary.
              </p>

              <label className="block text-sm font-medium text-gray-700">
                Title
                <input
                  value={ticket.title}
                  maxLength={150}
                  onChange={(e) => setTicket({ ...ticket, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Priority
                <select
                  value={ticket.priority}
                  onChange={(e) => setTicket({ ...ticket, priority: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#25D366]"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </label>

              <label className="flex flex-1 flex-col text-sm font-medium text-gray-700">
                Description
                <textarea
                  value={ticket.description}
                  onChange={(e) => setTicket({ ...ticket, description: e.target.value })}
                  className="mt-1 min-h-[140px] w-full flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20"
                />
              </label>

              <button
                type="submit"
                disabled={submittingTicket}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1fb857] disabled:opacity-60"
              >
                {submittingTicket ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />}
                Raise ticket
              </button>
            </form>
          ) : (
            <>
              {/* ---------- messages ---------- */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-3">
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white p-3 text-sm text-gray-800 shadow-sm">
                  {status.welcomeMessage}
                </div>

                {messages.length === 0 && status.suggestedQuestions?.length > 0 && !limited && (
                  <div className="flex flex-wrap gap-2">
                    {status.suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="rounded-full border border-[#25D366]/40 bg-white px-3 py-1.5 text-left text-xs text-[#0e7a3f] hover:bg-[#25D366]/10"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {messages.map((m) => {
                  const key = m.id ?? m.localId;

                  if (m.role === "user") {
                    return (
                      <div key={key} className="flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-[#25D366] px-3 py-2 text-sm text-white">
                          {m.content}
                        </div>
                      </div>
                    );
                  }

                  if (m.role === "notice") {
                    return (
                      <div key={key} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                        {m.content}
                        {m.offerTicket && (
                          <button
                            type="button"
                            onClick={openTicketForm}
                            className="mt-2 flex items-center gap-1 font-semibold text-[#0e7a3f] underline"
                          >
                            <Ticket size={13} /> Raise a support ticket
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="max-w-[92%]">
                      <div className="rounded-2xl rounded-tl-sm bg-white p-3 text-sm text-gray-800 shadow-sm">
                        <RichText text={m.content} />
                      </div>

                      {Array.isArray(m.sources) && m.sources.length > 0 && (
                        <p className="mt-1 px-1 text-[11px] text-gray-500">
                          Source: {m.sources.map((s) => s.title).join(", ")}
                        </p>
                      )}

                      <div className="mt-1 flex items-center gap-1 px-1">
                        {m.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => rate(m, 1)}
                              aria-label="Helpful"
                              className={`rounded p-1 hover:bg-gray-200 ${m.feedback === 1 ? "text-[#25D366]" : "text-gray-400"}`}
                            >
                              <ThumbsUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => rate(m, -1)}
                              aria-label="Not helpful"
                              className={`rounded p-1 hover:bg-gray-200 ${m.feedback === -1 ? "text-red-500" : "text-gray-400"}`}
                            >
                              <ThumbsDown size={14} />
                            </button>
                          </>
                        )}

                        {m.answered === false && (
                          <button
                            type="button"
                            onClick={openTicketForm}
                            className="ml-1 inline-flex items-center gap-1 rounded-full bg-[#25D366] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1fb857]"
                          >
                            <Ticket size={12} /> Raise a ticket
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {sending && (
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs text-gray-500 shadow-sm">
                    <Loader2 size={14} className="animate-spin" /> Thinking...
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* ---------- input ---------- */}
              {limited ? (
                <div className="border-t border-gray-200 bg-white p-3 text-center text-xs text-gray-600">
                  The assistant has reached its monthly limit.{" "}
                  <button type="button" onClick={openTicketForm} className="font-semibold text-[#0e7a3f] underline">
                    Raise a support ticket
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  className="flex items-end gap-2 border-t border-gray-200 bg-white p-3"
                >
                  <textarea
                    rows={1}
                    value={input}
                    maxLength={maxLength}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Ask how to do something..."
                    className="max-h-24 flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="rounded-xl bg-[#25D366] p-2.5 text-white hover:bg-[#1fb857] disabled:opacity-50"
                    aria-label="Send"
                  >
                    <Send size={18} />
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* ---------- floating button ---------- */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white shadow-lg transition hover:scale-105 sm:right-5 ${
          raised ? "bottom-24" : "bottom-5"
        }`}
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? <X size={24} /> : <Bot size={26} />}
      </button>
    </>
  );
}