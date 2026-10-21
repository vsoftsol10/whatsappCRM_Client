// ============================================================
// voiceNoteMiddleware
//
// Browsers record voice messages in their own format:
//   Chrome / Edge  -> audio/webm (Opus)   <- WhatsApp does NOT accept this
//   Firefox        -> audio/ogg  (Opus)   <- accepted
//   Safari         -> audio/mp4  (AAC)    <- accepted, but shows as a file
//
// WhatsApp shows a real "voice note" (round play button + waveform)
// only for OGG files with the OPUS codec. So this middleware converts
// recorded voice messages to  audio/ogg (Opus, mono)  before they are
// uploaded to WhatsApp.
//
// It ONLY touches:
//   - audio/webm uploads, or
//   - files whose name starts with "voice-note" (created by the CRM
//     voice recorder button).
// Every other upload (images, documents, MP3 files picked by hand...)
// passes through completely unchanged.
// ============================================================

const { spawn } = require("child_process");

let ffmpegPath = null;
try {
  ffmpegPath = require("ffmpeg-static");
} catch (error) {
  ffmpegPath = null;
}

const isVoiceRecording = (file) => {
  if (!file || !file.buffer) return false;

  const mime = String(file.mimetype || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  const name = String(file.originalname || "").toLowerCase();

  if (mime === "audio/webm") return true;
  if (name.startsWith("voice-note") && mime.startsWith("audio/")) return true;

  return false;
};

const convertToOggOpus = (inputBuffer) =>
  new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      return reject(new Error("ffmpeg is not installed on the server"));
    }

    const ffmpeg = spawn(
      ffmpegPath,
      [
        "-hide_banner",
        "-loglevel", "error",
        "-i", "pipe:0",       // recorded audio comes in on stdin
        "-vn",                // audio only
        "-ac", "1",           // mono (WhatsApp voice notes are mono)
        "-ar", "48000",
        "-c:a", "libopus",
        "-b:a", "32k",
        "-application", "voip",
        "-f", "ogg",
        "pipe:1",             // converted audio goes out on stdout
      ],
      { stdio: ["pipe", "pipe", "pipe"] }
    );

    const chunks = [];
    let errorText = "";

    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on("data", (chunk) => {
      errorText += chunk.toString();
    });

    ffmpeg.on("error", reject);

    ffmpeg.on("close", (code) => {
      const output = Buffer.concat(chunks);

      if (code !== 0 || output.length === 0) {
        return reject(new Error(errorText.trim() || `ffmpeg exited with ${code}`));
      }

      resolve(output);
    });

    // Ignore EPIPE if ffmpeg exits early; the "close" handler reports it.
    ffmpeg.stdin.on("error", () => {});
    ffmpeg.stdin.end(inputBuffer);
  });

const convertVoiceNote = async (req, res, next) => {
  try {
    if (!isVoiceRecording(req.file)) return next();

    const converted = await convertToOggOpus(req.file.buffer);

    req.file.buffer = converted;
    req.file.size = converted.length;
    req.file.mimetype = "audio/ogg";
    req.file.originalname = `voice-note-${Date.now()}.ogg`;

    return next();
  } catch (error) {
    console.error("Voice note conversion failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not process the voice message. Please try again.",
    });
  }
};

module.exports = { convertVoiceNote, convertToOggOpus, isVoiceRecording };