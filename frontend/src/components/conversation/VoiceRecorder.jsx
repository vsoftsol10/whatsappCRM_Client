// // ============================================================
// // VoiceRecorder
// // Record a voice message in the browser (like WhatsApp) and send it.
// //
// //   Idle      -> green microphone button
// //   Click it  -> recording bar: trash (cancel) | timer | live waveform | send
// //   Send      -> the recording is uploaded through the normal "send media"
// //                flow (onSend). The server converts it to OGG/Opus so
// //                WhatsApp shows it as a real voice note.
// //
// // Props
// //   onSend(file)  async function that sends the file; return true on success
// //   disabled      disables the microphone button
// //   resetKey      when this value changes (for example the selected
// //                 conversation), a running recording is cancelled so a
// //                 voice message can never go to the wrong chat
// // ============================================================
// import { useCallback, useEffect, useRef, useState } from "react";
// import { toast } from "react-hot-toast";
// import { FaMicrophone, FaPaperPlane, FaTrash, FaSpinner } from "react-icons/fa";

// const MAX_SECONDS = 5 * 60; // auto-send after 5 minutes
// const MIN_SECONDS = 1; // anything shorter is treated as an accidental click

// // Best format the current browser can record, in order of preference.
// const MIME_CANDIDATES = [
//   "audio/ogg;codecs=opus", // Firefox  (sent to WhatsApp as it is)
//   "audio/webm;codecs=opus", // Chrome / Edge (converted by the server)
//   "audio/webm",
//   "audio/mp4", // Safari (converted by the server)
// ];

// const pickMimeType = () => {
//   if (typeof MediaRecorder === "undefined") return "";
//   return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) || "";
// };

// const extensionFor = (mime) => {
//   if (mime.includes("ogg")) return "ogg";
//   if (mime.includes("mp4")) return "m4a";
//   return "webm";
// };

// const formatTime = (total) => {
//   const m = Math.floor(total / 60);
//   const s = total % 60;
//   return `${m}:${String(s).padStart(2, "0")}`;
// };

// function VoiceRecorder({ onSend, disabled = false, resetKey }) {
//   const [recording, setRecording] = useState(false);
//   const [sending, setSending] = useState(false);
//   const [seconds, setSeconds] = useState(0);

//   const recorderRef = useRef(null);
//   const streamRef = useRef(null);
//   const chunksRef = useRef([]);
//   const mimeRef = useRef("");
//   const cancelledRef = useRef(false);
//   const startedAtRef = useRef(0);
//   const timerRef = useRef(null);

//   const audioCtxRef = useRef(null);
//   const analyserRef = useRef(null);
//   const rafRef = useRef(null);
//   const canvasRef = useRef(null);
//   const levelsRef = useRef([]);
//   const lastLevelAtRef = useRef(0);

//   // Always call the newest onSend (it depends on the selected conversation)
//   const onSendRef = useRef(onSend);
//   useEffect(() => {
//     onSendRef.current = onSend;
//   }, [onSend]);

//   const releaseResources = useCallback(() => {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
//     if (rafRef.current) {
//       cancelAnimationFrame(rafRef.current);
//       rafRef.current = null;
//     }
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((t) => t.stop());
//       streamRef.current = null;
//     }
//     if (audioCtxRef.current) {
//       audioCtxRef.current.close().catch(() => {});
//       audioCtxRef.current = null;
//     }
//     analyserRef.current = null;
//     levelsRef.current = [];
//   }, []);

//   // ---------- live waveform ----------
//   const drawWaveform = useCallback(() => {
//     const canvas = canvasRef.current;
//     const analyser = analyserRef.current;
//     if (!canvas || !analyser) return;

//     const dpr = window.devicePixelRatio || 1;
//     const width = canvas.clientWidth;
//     const height = canvas.clientHeight;
//     if (canvas.width !== width * dpr) canvas.width = width * dpr;
//     if (canvas.height !== height * dpr) canvas.height = height * dpr;

//     const data = new Uint8Array(analyser.fftSize);
//     analyser.getByteTimeDomainData(data);

//     // Add a new bar about 15 times a second
//     const now = performance.now();
//     if (now - lastLevelAtRef.current > 65) {
//       let sum = 0;
//       for (let i = 0; i < data.length; i += 1) {
//         const v = (data[i] - 128) / 128;
//         sum += v * v;
//       }
//       const rms = Math.sqrt(sum / data.length);
//       levelsRef.current.push(Math.min(1, rms * 4));
//       lastLevelAtRef.current = now;
//     }

//     const barWidth = 3 * dpr;
//     const gap = 3 * dpr;
//     const maxBars = Math.floor(canvas.width / (barWidth + gap));
//     if (levelsRef.current.length > maxBars) {
//       levelsRef.current = levelsRef.current.slice(-maxBars);
//     }

//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.fillStyle = "#128C7E";

//     const levels = levelsRef.current;
//     const startX = canvas.width - levels.length * (barWidth + gap);
//     levels.forEach((level, i) => {
//       const barHeight = Math.max(3 * dpr, level * canvas.height);
//       const x = startX + i * (barWidth + gap);
//       const y = (canvas.height - barHeight) / 2;
//       ctx.fillRect(x, y, barWidth, barHeight);
//     });

//     rafRef.current = requestAnimationFrame(drawWaveform);
//   }, []);

//   // ---------- what happens when the recorder stops ----------
//   const handleStop = useCallback(async () => {
//     const mime = mimeRef.current || "audio/webm";
//     const elapsed = (Date.now() - startedAtRef.current) / 1000;
//     const wasCancelled = cancelledRef.current;
//     const chunks = chunksRef.current;

//     chunksRef.current = [];
//     releaseResources();
//     setRecording(false);
//     setSeconds(0);

//     if (wasCancelled) return;

//     if (elapsed < MIN_SECONDS || chunks.length === 0) {
//       toast.error("Voice message is too short.");
//       return;
//     }

//     // "voice-note-..." tells the server this is a recorded voice message
//     const baseMime = mime.split(";")[0];
//     const blob = new Blob(chunks, { type: baseMime });
//     const file = new File(
//       [blob],
//       `voice-note-${Date.now()}.${extensionFor(baseMime)}`,
//       { type: baseMime }
//     );

//     setSending(true);
//     try {
//       await onSendRef.current?.(file);
//     } catch (error) {
//       console.error("Voice message send failed:", error);
//       toast.error("Failed to send voice message.");
//     } finally {
//       setSending(false);
//     }
//   }, [releaseResources]);

//   // ---------- start ----------
//   const startRecording = async () => {
//     if (disabled || recording || sending) return;

//     if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
//       toast.error(
//         "Voice recording is not supported here. Use Chrome, Edge, Firefox or Safari over HTTPS."
//       );
//       return;
//     }

//     let stream;
//     try {
//       stream = await navigator.mediaDevices.getUserMedia({
//         audio: { echoCancellation: true, noiseSuppression: true },
//       });
//     } catch (error) {
//       if (error?.name === "NotFoundError") {
//         toast.error("No microphone found on this device.");
//       } else {
//         toast.error(
//           "Microphone access is blocked. Allow the microphone in your browser's address bar and try again."
//         );
//       }
//       return;
//     }

//     try {
//       const mimeType = pickMimeType();
//       const recorder = new MediaRecorder(
//         stream,
//         mimeType ? { mimeType } : undefined
//       );

//       streamRef.current = stream;
//       recorderRef.current = recorder;
//       mimeRef.current = recorder.mimeType || mimeType || "audio/webm";
//       chunksRef.current = [];
//       cancelledRef.current = false;

//       recorder.ondataavailable = (e) => {
//         if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
//       };
//       recorder.onstop = handleStop;

//       // Waveform analyser
//       const AudioCtx = window.AudioContext || window.webkitAudioContext;
//       if (AudioCtx) {
//         const ctx = new AudioCtx();
//         const source = ctx.createMediaStreamSource(stream);
//         const analyser = ctx.createAnalyser();
//         analyser.fftSize = 512;
//         source.connect(analyser);
//         audioCtxRef.current = ctx;
//         analyserRef.current = analyser;
//       }

//       recorder.start(250);
//       startedAtRef.current = Date.now();
//       levelsRef.current = [];
//       lastLevelAtRef.current = 0;
//       setSeconds(0);
//       setRecording(true);

//       timerRef.current = setInterval(() => {
//         const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
//         setSeconds(elapsed);
//         if (elapsed >= MAX_SECONDS) stopRecording(false);
//       }, 250);

//       rafRef.current = requestAnimationFrame(drawWaveform);
//     } catch (error) {
//       console.error("Could not start recording:", error);
//       stream.getTracks().forEach((t) => t.stop());
//       releaseResources();
//       toast.error("Could not start voice recording.");
//     }
//   };

//   // ---------- stop (send) or cancel ----------
//   function stopRecording(cancel) {
//     cancelledRef.current = cancel;
//     const recorder = recorderRef.current;
//     if (recorder && recorder.state !== "inactive") {
//       recorder.stop(); // triggers handleStop
//     } else {
//       releaseResources();
//       setRecording(false);
//       setSeconds(0);
//     }
//   }

//   // Cancel if the chat changes (resetKey) or the component goes away
//   useEffect(() => {
//     return () => {
//       if (recorderRef.current && recorderRef.current.state !== "inactive") {
//         cancelledRef.current = true;
//         recorderRef.current.stop();
//       } else {
//         releaseResources();
//       }
//     };
//   }, [resetKey, releaseResources]);

//   // ---------- UI ----------
//   if (recording) {
//     return (
//       // Covers the whole input row while recording (the input row is "relative")
//       <div className="absolute inset-0 z-20 flex items-center gap-3 border-t border-gray-200 bg-white px-3 sm:px-4">
//         <button
//           type="button"
//           onClick={() => stopRecording(true)}
//           title="Cancel"
//           className="rounded-full p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
//         >
//           <FaTrash size={16} />
//         </button>

//         <div className="flex shrink-0 items-center gap-2">
//           <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
//           <span className="w-12 text-sm font-medium tabular-nums text-gray-700">
//             {formatTime(seconds)}
//           </span>
//         </div>

//         <canvas ref={canvasRef} className="h-8 min-w-0 flex-1" />

//         <button
//           type="button"
//           onClick={() => stopRecording(false)}
//           title="Send voice message"
//           className="rounded-full bg-[#25D366] p-3 text-white transition hover:bg-[#128C7E]"
//         >
//           <FaPaperPlane size={16} />
//         </button>
//       </div>
//     );
//   }

//   return (
//     <button
//       type="button"
//       onClick={startRecording}
//       disabled={disabled || sending}
//       title={sending ? "Sending voice message..." : "Record a voice message"}
//       className="rounded-full bg-[#25D366] p-3 text-white transition hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#25D366]"
//     >
//       {sending ? (
//         <FaSpinner size={16} className="animate-spin" />
//       ) : (
//         <FaMicrophone size={16} />
//       )}
//     </button>
//   );
// }

// export default VoiceRecorder;


// ============================================================
// VoiceRecorder
// Record a voice message in the browser (like WhatsApp) and send it.
//
//   Idle      -> green microphone button
//   Click it  -> recording bar: trash (cancel) | timer | live waveform | send
//   Send      -> the recording is uploaded through the normal "send media"
//                flow (onSend). The server converts it to OGG/Opus so
//                WhatsApp shows it as a real voice note.
//
// Props
//   onSend(file)  async function that sends the file; return true on success
//   disabled      disables the microphone button
//   resetKey      when this value changes (for example the selected
//                 conversation), a running recording is cancelled so a
//                 voice message can never go to the wrong chat
//   format        "whatsapp" (default) -> server converts to OGG/Opus
//                 "social"             -> Facebook / Instagram, server
//                                         converts to M4A (AAC)
//   variant       "solid" (default green round button) or "plain"
//                 (icon only, for the Facebook / Instagram message box)
//   accentClass   text colour class for the "plain" mic icon
//   sendButtonClass  background classes of the send button shown while
//                 recording
//   waveColor     colour of the live waveform bars
// ============================================================
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { FaMicrophone, FaPaperPlane, FaTrash, FaSpinner } from "react-icons/fa";

const MAX_SECONDS = 5 * 60; // auto-send after 5 minutes
const MIN_SECONDS = 1; // anything shorter is treated as an accidental click

// Best format the current browser can record, in order of preference.
const MIME_CANDIDATES = [
  "audio/ogg;codecs=opus", // Firefox  (sent to WhatsApp as it is)
  "audio/webm;codecs=opus", // Chrome / Edge (converted by the server)
  "audio/webm",
  "audio/mp4", // Safari (converted by the server)
];

const pickMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) || "";
};

const extensionFor = (mime) => {
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "m4a";
  return "webm";
};

const formatTime = (total) => {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

function VoiceRecorder({
  onSend,
  disabled = false,
  resetKey,
  format = "whatsapp",
  variant = "solid",
  accentClass = "",
  sendButtonClass = "bg-[#25D366] hover:bg-[#128C7E]",
  waveColor = "#128C7E",
}) {
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeRef = useRef("");
  const cancelledRef = useRef(false);
  const startedAtRef = useRef(0);
  const timerRef = useRef(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const canvasRef = useRef(null);
  const levelsRef = useRef([]);
  const lastLevelAtRef = useRef(0);

  // Always call the newest onSend (it depends on the selected conversation)
  const onSendRef = useRef(onSend);
  useEffect(() => {
    onSendRef.current = onSend;
  }, [onSend]);

  const waveColorRef = useRef(waveColor);
  useEffect(() => {
    waveColorRef.current = waveColor;
  }, [waveColor]);

  const releaseResources = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    levelsRef.current = [];
  }, []);

  // ---------- live waveform ----------
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr) canvas.width = width * dpr;
    if (canvas.height !== height * dpr) canvas.height = height * dpr;

    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);

    // Add a new bar about 15 times a second
    const now = performance.now();
    if (now - lastLevelAtRef.current > 65) {
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      levelsRef.current.push(Math.min(1, rms * 4));
      lastLevelAtRef.current = now;
    }

    const barWidth = 3 * dpr;
    const gap = 3 * dpr;
    const maxBars = Math.floor(canvas.width / (barWidth + gap));
    if (levelsRef.current.length > maxBars) {
      levelsRef.current = levelsRef.current.slice(-maxBars);
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = waveColorRef.current;

    const levels = levelsRef.current;
    const startX = canvas.width - levels.length * (barWidth + gap);
    levels.forEach((level, i) => {
      const barHeight = Math.max(3 * dpr, level * canvas.height);
      const x = startX + i * (barWidth + gap);
      const y = (canvas.height - barHeight) / 2;
      ctx.fillRect(x, y, barWidth, barHeight);
    });

    rafRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  // ---------- what happens when the recorder stops ----------
  const handleStop = useCallback(async () => {
    const mime = mimeRef.current || "audio/webm";
    const elapsed = (Date.now() - startedAtRef.current) / 1000;
    const wasCancelled = cancelledRef.current;
    const chunks = chunksRef.current;

    chunksRef.current = [];
    releaseResources();
    setRecording(false);
    setSeconds(0);

    if (wasCancelled) return;

    if (elapsed < MIN_SECONDS || chunks.length === 0) {
      toast.error("Voice message is too short.");
      return;
    }

    // "voice-note-..." tells the server this is a recorded voice message.
    // "voice-note-social-..." tells it to convert for Facebook / Instagram.
    const baseMime = mime.split(";")[0];
    const blob = new Blob(chunks, { type: baseMime });
    const prefix = format === "social" ? "voice-note-social" : "voice-note";
    const file = new File(
      [blob],
      `${prefix}-${Date.now()}.${extensionFor(baseMime)}`,
      { type: baseMime }
    );

    setSending(true);
    try {
      await onSendRef.current?.(file);
    } catch (error) {
      console.error("Voice message send failed:", error);
      toast.error("Failed to send voice message.");
    } finally {
      setSending(false);
    }
  }, [releaseResources, format]);

  // ---------- start ----------
  const startRecording = async () => {
    if (disabled || recording || sending) return;

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error(
        "Voice recording is not supported here. Use Chrome, Edge, Firefox or Safari over HTTPS."
      );
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (error) {
      if (error?.name === "NotFoundError") {
        toast.error("No microphone found on this device.");
      } else {
        toast.error(
          "Microphone access is blocked. Allow the microphone in your browser's address bar and try again."
        );
      }
      return;
    }

    try {
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      streamRef.current = stream;
      recorderRef.current = recorder;
      mimeRef.current = recorder.mimeType || mimeType || "audio/webm";
      chunksRef.current = [];
      cancelledRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleStop;

      // Waveform analyser
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      }

      recorder.start(250);
      startedAtRef.current = Date.now();
      levelsRef.current = [];
      lastLevelAtRef.current = 0;
      setSeconds(0);
      setRecording(true);

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS) stopRecording(false);
      }, 250);

      rafRef.current = requestAnimationFrame(drawWaveform);
    } catch (error) {
      console.error("Could not start recording:", error);
      stream.getTracks().forEach((t) => t.stop());
      releaseResources();
      toast.error("Could not start voice recording.");
    }
  };

  // ---------- stop (send) or cancel ----------
  function stopRecording(cancel) {
    cancelledRef.current = cancel;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop(); // triggers handleStop
    } else {
      releaseResources();
      setRecording(false);
      setSeconds(0);
    }
  }

  // Cancel if the chat changes (resetKey) or the component goes away
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        cancelledRef.current = true;
        recorderRef.current.stop();
      } else {
        releaseResources();
      }
    };
  }, [resetKey, releaseResources]);

  // ---------- UI ----------
  if (recording) {
    return (
      // Covers the whole input row while recording (the input row is "relative")
      <div className="absolute inset-0 z-20 flex items-center gap-3 border-t border-gray-200 bg-white px-3 sm:px-4">
        <button
          type="button"
          onClick={() => stopRecording(true)}
          title="Cancel"
          className="rounded-full p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <FaTrash size={16} />
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="w-12 text-sm font-medium tabular-nums text-gray-700">
            {formatTime(seconds)}
          </span>
        </div>

        <canvas ref={canvasRef} className="h-8 min-w-0 flex-1" />

        <button
          type="button"
          onClick={() => stopRecording(false)}
          title="Send voice message"
          className={`rounded-full p-3 text-white transition ${sendButtonClass}`}
        >
          <FaPaperPlane size={16} />
        </button>
      </div>
    );
  }

  if (variant === "plain") {
    return (
      <button
        type="button"
        onClick={startRecording}
        disabled={disabled || sending}
        title={sending ? "Sending voice message..." : "Record a voice message"}
        className={`transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 ${accentClass}`}
      >
        {sending ? (
          <FaSpinner size={20} className="animate-spin" />
        ) : (
          <FaMicrophone size={20} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      disabled={disabled || sending}
      title={sending ? "Sending voice message..." : "Record a voice message"}
      className="rounded-full bg-[#25D366] p-3 text-white transition hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#25D366]"
    >
      {sending ? (
        <FaSpinner size={16} className="animate-spin" />
      ) : (
        <FaMicrophone size={16} />
      )}
    </button>
  );
}

export default VoiceRecorder;

