import { useRef, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  FaPaperPlane,
  FaSmile,
  FaPlusCircle,
  FaImage,
  FaFileAlt,
  FaVideo,
  FaMicrophone,
} from "react-icons/fa";

const MB = 1024 * 1024;
const MAX_SIZE_MB = { image: 5, audio: 16, video: 16, document: 25 };

const getFileKind = (file) => {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("video/")) return "video";
  return "document";
};

const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😉",
  "😎", "🤔", "😢", "😭", "😡", "👍", "👎", "🙏",
  "👏", "💪", "❤️", "🔥", "🎉", "✅", "❌", "⭐",
  "😴", "🥳", "😅", "🙄", "😇", "🤝", "👋", "💯",
];

function SocialMessageInput({
  theme,
  onSendMessage,
  onSendMedia,
  disabled = false,
}) {
  const [message, setMessage] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [pendingFile, setPendingFile] = useState(null);
  const [pendingKind, setPendingKind] = useState("document");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [sendingMedia, setSendingMedia] = useState(false);

  const documentInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const attachRef = useRef(null);

  const isFacebook = theme.variant === "facebook";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
      if (attachRef.current && !attachRef.current.contains(e.target)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSend = () => {
    if (disabled) return;
    const trimmed = message.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter") handleSend();
  };

  const clearPendingFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setCaption("");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setShowAttachmentMenu(false);
    if (!file) return;

    const kind = getFileKind(file);

    if (file.size > MAX_SIZE_MB[kind] * MB) {
      toast.error(
        `${kind.charAt(0).toUpperCase() + kind.slice(1)} files can be at most ${MAX_SIZE_MB[kind]} MB.`
      );
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPendingFile(file);
    setPendingKind(kind);
    setCaption("");
    setPreviewUrl(kind === "document" ? null : URL.createObjectURL(file));
  };

  const handleSendPendingFile = async () => {
    if (!pendingFile || sendingMedia || !onSendMedia) return;

    setSendingMedia(true);

    const ok = await onSendMedia(
      pendingFile,
      pendingKind === "image" || pendingKind === "video" ? caption.trim() : ""
    );

    setSendingMedia(false);
    if (ok) clearPendingFile();
  };

  const hasText = message.trim().length > 0;

  const attachButton = (
    <div ref={attachRef} className="relative">
      <button
        onClick={() => !disabled && setShowAttachmentMenu((prev) => !prev)}
        disabled={disabled}
        title="Attach"
        className={`transition disabled:cursor-not-allowed disabled:opacity-40 ${theme.accentText}`}
      >
        {isFacebook ? <FaPlusCircle size={22} /> : <FaImage size={22} />}
      </button>

      {showAttachmentMenu && (
        <div className="absolute bottom-12 left-0 z-50 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
          {[
            { label: "Document", Icon: FaFileAlt, ref: documentInputRef },
            { label: "Image", Icon: FaImage, ref: imageInputRef },
            { label: "Audio", Icon: FaMicrophone, ref: audioInputRef },
            { label: "Video", Icon: FaVideo, ref: videoInputRef },
          ].map(({ label, Icon, ref }) => (
            <button
              key={label}
              onClick={() => ref.current?.click()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100"
            >
              <Icon className={theme.accentText} />
              <span className="text-sm text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const emojiButton = (
    <div ref={emojiPickerRef} className="relative">
      <button
        onClick={() => !disabled && setShowEmojiPicker((prev) => !prev)}
        disabled={disabled}
        title="Emoji"
        className={`transition disabled:cursor-not-allowed disabled:opacity-40 ${
          isFacebook ? theme.accentText : "text-[#262626]"
        }`}
      >
        <FaSmile size={20} />
      </button>

      {showEmojiPicker && (
        <div
          className={`absolute bottom-10 z-50 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl ${
            isFacebook ? "right-0" : "left-0"
          }`}
        >
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setMessage((prev) => prev + emoji)}
                className="rounded-md p-1 text-lg transition hover:bg-gray-100"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const textField = (
    <input
      type="text"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      placeholder={
        disabled ? "Select a conversation to start typing" : theme.inputPlaceholder
      }
      className="min-w-0 flex-1 bg-transparent text-[15px] text-[#050505] outline-none placeholder:text-[#65676B] disabled:cursor-not-allowed disabled:opacity-60"
    />
  );

  return (
    <div className="relative bg-white px-3 py-3 sm:px-4">
      {isFacebook ? (
        /* ---------- Messenger style ---------- */
        <div className="flex items-center gap-3">
          {attachButton}

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[#F0F2F5] px-4 py-2">
            {textField}
            {emojiButton}
          </div>

          <button
            onClick={handleSend}
            disabled={disabled || !hasText}
            title="Send"
            className={`transition disabled:cursor-not-allowed disabled:opacity-40 ${theme.accentText}`}
          >
            <FaPaperPlane size={20} />
          </button>
        </div>
      ) : (
        /* ---------- Instagram style ---------- */
        <div className="flex items-center gap-3 rounded-full border border-[#DBDBDB] px-4 py-2">
          {emojiButton}
          {textField}

          {hasText ? (
            <button
              onClick={handleSend}
              disabled={disabled}
              className={`text-sm font-semibold transition hover:opacity-80 disabled:opacity-40 ${theme.accentText}`}
            >
              Send
            </button>
          ) : (
            attachButton
          )}
        </div>
      )}

      {/* Hidden file inputs (same types as the WhatsApp chat) */}
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.amr,.ogg,.opus"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/3gpp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Attachment preview / confirm */}
      {pendingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Send {pendingKind === "audio" ? "voice / audio" : pendingKind}
            </h3>

            {pendingKind === "image" && previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                className="mb-3 max-h-64 w-full rounded-lg object-contain"
              />
            )}
            {pendingKind === "video" && previewUrl && (
              <video
                src={previewUrl}
                controls
                className="mb-3 max-h-64 w-full rounded-lg"
              />
            )}
            {pendingKind === "audio" && previewUrl && (
              <audio src={previewUrl} controls className="mb-3 w-full" />
            )}
            {pendingKind === "document" && (
              <div className="mb-3 flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-3">
                <FaFileAlt className={`shrink-0 text-xl ${theme.accentText}`} />
                <span className="min-w-0 break-all text-sm text-gray-700">
                  {pendingFile.name}
                </span>
              </div>
            )}

            {(pendingKind === "image" || pendingKind === "video") && (
              <input
                type="text"
                placeholder="Add a caption (optional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                disabled={sendingMedia}
                className="mb-3 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none"
              />
            )}

            <div className="flex justify-end gap-3 text-sm">
              <button
                onClick={clearPendingFile}
                disabled={sendingMedia}
                className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendPendingFile}
                disabled={sendingMedia}
                className={`rounded-lg px-4 py-2 font-medium text-white disabled:opacity-60 ${theme.accentBg} ${theme.accentHover}`}
              >
                {sendingMedia ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SocialMessageInput;
