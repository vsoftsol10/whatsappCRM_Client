
// import { useRef, useState, useEffect } from "react";
// import { toast } from "react-hot-toast";
// import {
//   FaPaperPlane,
//   FaSmile,
//   FaPaperclip,
//   FaFileAlt,
//   FaImage,
//   FaVideo,
//   FaMicrophone,
// } from "react-icons/fa";

// // WhatsApp Cloud API file size limits (document capped at 25 MB here).
// const MB = 1024 * 1024;
// const MAX_SIZE_MB = { image: 5, audio: 16, video: 16, document: 25 };

// const getFileKind = (file) => {
//   if (file.type.startsWith("image/")) return "image";
//   if (file.type.startsWith("audio/")) return "audio";
//   if (file.type.startsWith("video/")) return "video";
//   return "document";
// };

// const EMOJIS = [
//   "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😉",
//   "😎", "🤔", "😢", "😭", "😡", "👍", "👎", "🙏",
//   "👏", "💪", "❤️", "🔥", "🎉", "✅", "❌", "⭐",
//   "😴", "🥳", "😅", "🙄", "😇", "🤝", "👋", "💯",
// ];

// function MessageInput({ onSendMessage, onSendMedia, disabled = false }) {
//   const [message, setMessage] = useState("");
//   const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);

//   // Attachment waiting for the agent to confirm before it is sent
//   const [pendingFile, setPendingFile] = useState(null);
//   const [pendingKind, setPendingKind] = useState("document");
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [caption, setCaption] = useState("");
//   const [sendingMedia, setSendingMedia] = useState(false);

//   const documentInputRef = useRef(null);
//   const imageInputRef = useRef(null);
//   const videoInputRef = useRef(null);
//   const audioInputRef = useRef(null);
//   const emojiPickerRef = useRef(null);

//   // Close emoji picker on outside click
//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (
//         emojiPickerRef.current &&
//         !emojiPickerRef.current.contains(e.target)
//       ) {
//         setShowEmojiPicker(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () =>
//       document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleSend = () => {
//     if (disabled) return;

//     const trimmedMessage = message.trim();

//     if (!trimmedMessage) return;

//     onSendMessage(trimmedMessage);
//     setMessage("");
//   };

//   const handleKeyDown = (e) => {
//     if (disabled) return;

//     if (e.key === "Enter") {
//       handleSend();
//     }
//   };

//   const clearPendingFile = () => {
//     if (previewUrl) URL.revokeObjectURL(previewUrl);

//     setPendingFile(null);
//     setPreviewUrl(null);
//     setCaption("");
//   };

//   // Release the preview URL if the component unmounts mid-preview
//   useEffect(() => {
//     return () => {
//       if (previewUrl) URL.revokeObjectURL(previewUrl);
//     };
//   }, [previewUrl]);

//   const handleFileSelect = (e) => {
//     const file = e.target.files?.[0];

//     // Always reset so picking the same file again still fires onChange
//     e.target.value = "";
//     setShowAttachmentMenu(false);

//     if (!file) return;

//     const kind = getFileKind(file);

//     if (file.size > MAX_SIZE_MB[kind] * MB) {
//       toast.error(
//         `${kind.charAt(0).toUpperCase() + kind.slice(1)} files can be at most ${MAX_SIZE_MB[kind]} MB on WhatsApp.`
//       );
//       return;
//     }

//     if (previewUrl) URL.revokeObjectURL(previewUrl);

//     setPendingFile(file);
//     setPendingKind(kind);
//     setCaption("");
//     setPreviewUrl(
//       kind === "document" ? null : URL.createObjectURL(file)
//     );
//   };

//   const handleSendPendingFile = async () => {
//     if (!pendingFile || sendingMedia || !onSendMedia) return;

//     setSendingMedia(true);

//     const ok = await onSendMedia(
//       pendingFile,
//       pendingKind === "image" || pendingKind === "video"
//         ? caption.trim()
//         : ""
//     );

//     setSendingMedia(false);

//     // On failure keep the preview open so the agent can retry
//     if (ok) clearPendingFile();
//   };

//   const handleEmojiClick = (emoji) => {
//     setMessage((prev) => prev + emoji);
//   };

//   return (
//     <div className="relative flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-3 sm:gap-3 sm:px-4">

//       {/* Emoji */}
//       <div ref={emojiPickerRef} className="relative">
//         <button
//           onClick={() => !disabled && setShowEmojiPicker((prev) => !prev)}
//           disabled={disabled}
//           className="text-gray-500 transition hover:text-[#128C7E] disabled:cursor-not-allowed disabled:opacity-40"
//         >
//           <FaSmile size={20} />
//         </button>

//         {showEmojiPicker && (
//           <div className="absolute bottom-12 left-0 z-50 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
//             <div className="grid grid-cols-8 gap-1">
//               {EMOJIS.map((emoji) => (
//                 <button
//                   key={emoji}
//                   onClick={() => handleEmojiClick(emoji)}
//                   className="rounded-md p-1 text-lg transition hover:bg-gray-100"
//                 >
//                   {emoji}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Attachment */}
//       <button
//         onClick={() => !disabled && setShowAttachmentMenu((prev) => !prev)}
//         disabled={disabled}
//         className="text-gray-500 transition hover:text-[#128C7E] disabled:cursor-not-allowed disabled:opacity-40"
//       >
//         <FaPaperclip size={20} />
//       </button>

//       {/* Attachment Popup */}
//       {showAttachmentMenu && (
//         <div className="absolute bottom-16 left-12 z-50 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">

//           <button
//             onClick={() => documentInputRef.current?.click()}
//             className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100"
//           >
//             <FaFileAlt className="text-[#128C7E]" />
//             <span>Document</span>
//           </button>

//           <button
//             onClick={() => imageInputRef.current?.click()}
//             className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100"
//           >
//             <FaImage className="text-[#128C7E]" />
//             <span>Image</span>
//           </button>

//           <button
//             onClick={() => audioInputRef.current?.click()}
//             className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100"
//           >
//             <FaMicrophone className="text-[#128C7E]" />
//             <span>Voice / Audio</span>
//           </button>

//           <button
//             onClick={() => videoInputRef.current?.click()}
//             className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100"
//           >
//             <FaVideo className="text-[#128C7E]" />
//             <span>Video</span>
//           </button>
//         </div>
//       )}

//       {/* Hidden Inputs */}
//       <input
//         ref={documentInputRef}
//         type="file"
//         accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
//         className="hidden"
//         onChange={(e) => handleFileSelect(e, "Document")}
//       />

//       <input
//         ref={imageInputRef}
//         type="file"
//         accept="image/jpeg,image/png"
//         className="hidden"
//         onChange={(e) => handleFileSelect(e, "Image")}
//       />

//       <input
//         ref={audioInputRef}
//         type="file"
//         accept="audio/*,.mp3,.m4a,.aac,.amr,.ogg,.opus"
//         className="hidden"
//         onChange={(e) => handleFileSelect(e, "Audio")}
//       />

//       <input
//         ref={videoInputRef}
//         type="file"
//         accept="video/mp4,video/3gpp"
//         className="hidden"
//         onChange={(e) => handleFileSelect(e, "Video")}
//       />

//       {/* Message Input */}
//       <input
//         type="text"
//         placeholder={disabled ? "Select a conversation to start typing" : "Type a message"}
//         value={message}
//         onChange={(e) => setMessage(e.target.value)}
//         onKeyDown={handleKeyDown}
//         disabled={disabled}
//         className="min-w-0 flex-1 rounded-full bg-gray-100 px-4 py-2 outline-none transition focus:ring-2 focus:ring-[#DCF8C6] disabled:cursor-not-allowed disabled:opacity-60"
//       />

//       {/* Send */}
//       <button
//         onClick={handleSend}
//         disabled={disabled}
//         className="rounded-full bg-[#25D366] p-3 text-white transition hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#25D366]"
//       >
//         <FaPaperPlane size={16} />
//       </button>

//       {/* Attachment preview / confirm */}
//       {pendingFile && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
//           <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
//             <h3 className="mb-3 text-sm font-semibold text-gray-800">
//               Send {pendingKind === "audio" ? "voice / audio" : pendingKind}
//             </h3>

//             {pendingKind === "image" && previewUrl && (
//               <img
//                 src={previewUrl}
//                 alt="Preview"
//                 className="mb-3 max-h-64 w-full rounded-lg object-contain"
//               />
//             )}

//             {pendingKind === "video" && previewUrl && (
//               <video
//                 src={previewUrl}
//                 controls
//                 className="mb-3 max-h-64 w-full rounded-lg"
//               />
//             )}

//             {pendingKind === "audio" && previewUrl && (
//               <audio src={previewUrl} controls className="mb-3 w-full" />
//             )}

//             {pendingKind === "document" && (
//               <div className="mb-3 flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-3">
//                 <FaFileAlt className="shrink-0 text-xl text-[#128C7E]" />
//                 <span className="min-w-0 break-all text-sm text-gray-700">
//                   {pendingFile.name}
//                 </span>
//               </div>
//             )}

//             {(pendingKind === "image" || pendingKind === "video") && (
//               <input
//                 type="text"
//                 placeholder="Add a caption (optional)"
//                 value={caption}
//                 onChange={(e) => setCaption(e.target.value)}
//                 disabled={sendingMedia}
//                 className="mb-3 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DCF8C6]"
//               />
//             )}

//             <div className="flex justify-end gap-3 text-sm">
//               <button
//                 onClick={clearPendingFile}
//                 disabled={sendingMedia}
//                 className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
//               >
//                 Cancel
//               </button>

//               <button
//                 onClick={handleSendPendingFile}
//                 disabled={sendingMedia}
//                 className="rounded-lg bg-[#25D366] px-4 py-2 font-medium text-white hover:bg-[#128C7E] disabled:opacity-60"
//               >
//                 {sendingMedia ? "Sending..." : "Send"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// }

// export default MessageInput;


import { useRef, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  FaPaperPlane,
  FaSmile,
  FaPaperclip,
  FaFileAlt,
  FaImage,
  FaVideo,
  FaMicrophone,
} from "react-icons/fa";
import VoiceRecorder from "./VoiceRecorder";

// WhatsApp Cloud API file size limits (document capped at 25 MB here).
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

function MessageInput({
  onSendMessage,
  onSendMedia,
  disabled = false,
  conversationKey,
}) {
  const [message, setMessage] = useState("");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Attachment waiting for the agent to confirm before it is sent
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

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (disabled) return;

    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    onSendMessage(trimmedMessage);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === "Enter") {
      handleSend();
    }
  };

  const clearPendingFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPendingFile(null);
    setPreviewUrl(null);
    setCaption("");
  };

  // Release the preview URL if the component unmounts mid-preview
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    // Always reset so picking the same file again still fires onChange
    e.target.value = "";
    setShowAttachmentMenu(false);

    if (!file) return;

    const kind = getFileKind(file);

    if (file.size > MAX_SIZE_MB[kind] * MB) {
      toast.error(
        `${kind.charAt(0).toUpperCase() + kind.slice(1)} files can be at most ${MAX_SIZE_MB[kind]} MB on WhatsApp.`
      );
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setPendingFile(file);
    setPendingKind(kind);
    setCaption("");
    setPreviewUrl(
      kind === "document" ? null : URL.createObjectURL(file)
    );
  };

  const handleSendPendingFile = async () => {
    if (!pendingFile || sendingMedia || !onSendMedia) return;

    setSendingMedia(true);

    const ok = await onSendMedia(
      pendingFile,
      pendingKind === "image" || pendingKind === "video"
        ? caption.trim()
        : ""
    );

    setSendingMedia(false);

    // On failure keep the preview open so the agent can retry
    if (ok) clearPendingFile();
  };

  const handleEmojiClick = (emoji) => {
    setMessage((prev) => prev + emoji);
  };

  return (
    <div className="relative flex items-center gap-2 border-t border-gray-200 bg-white px-3 py-3 sm:gap-3 sm:px-4">

      {/* Emoji */}
      <div ref={emojiPickerRef} className="relative">
        <button
          onClick={() => !disabled && setShowEmojiPicker((prev) => !prev)}
          disabled={disabled}
          className="text-gray-500 transition hover:text-[#128C7E] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FaSmile size={20} />
        </button>

        {showEmojiPicker && (
          <div className="absolute bottom-12 left-0 z-50 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className="rounded-md p-1 text-lg transition hover:bg-gray-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attachment */}
      <button
        onClick={() => !disabled && setShowAttachmentMenu((prev) => !prev)}
        disabled={disabled}
        className="text-gray-500 transition hover:text-[#128C7E] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FaPaperclip size={20} />
      </button>

      {/* Attachment Popup */}
      {showAttachmentMenu && (
        <div className="absolute bottom-16 left-12 z-50 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">

          <button
            onClick={() => documentInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100"
          >
            <FaFileAlt className="text-[#128C7E]" />
            <span>Document</span>
          </button>

          <button
            onClick={() => imageInputRef.current?.click()}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100"
          >
            <FaImage className="text-[#128C7E]" />
            <span>Image</span>
          </button>

          <button
            onClick={() => audioInputRef.current?.click()}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100"
          >
            <FaMicrophone className="text-[#128C7E]" />
            <span>Voice / Audio</span>
          </button>

          <button
            onClick={() => videoInputRef.current?.click()}
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-gray-100"
          >
            <FaVideo className="text-[#128C7E]" />
            <span>Video</span>
          </button>
        </div>
      )}

      {/* Hidden Inputs */}
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        className="hidden"
        onChange={(e) => handleFileSelect(e, "Document")}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => handleFileSelect(e, "Image")}
      />

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.amr,.ogg,.opus"
        className="hidden"
        onChange={(e) => handleFileSelect(e, "Audio")}
      />

      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/3gpp"
        className="hidden"
        onChange={(e) => handleFileSelect(e, "Video")}
      />

      {/* Message Input */}
      <input
        type="text"
        placeholder={disabled ? "Select a conversation to start typing" : "Type a message"}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="min-w-0 flex-1 rounded-full bg-gray-100 px-4 py-2 outline-none transition focus:ring-2 focus:ring-[#DCF8C6] disabled:cursor-not-allowed disabled:opacity-60"
      />

      {/* Send (when typing) / Voice message (when the box is empty) */}
      {message.trim() ? (
        <button
          onClick={handleSend}
          disabled={disabled}
          className="rounded-full bg-[#25D366] p-3 text-white transition hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#25D366]"
        >
          <FaPaperPlane size={16} />
        </button>
      ) : (
        <VoiceRecorder
          disabled={disabled || !onSendMedia}
          resetKey={conversationKey}
          onSend={(file) => onSendMedia(file, "")}
        />
      )}

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
                <FaFileAlt className="shrink-0 text-xl text-[#128C7E]" />
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
                className="mb-3 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#DCF8C6]"
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
                className="rounded-lg bg-[#25D366] px-4 py-2 font-medium text-white hover:bg-[#128C7E] disabled:opacity-60"
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

export default MessageInput;