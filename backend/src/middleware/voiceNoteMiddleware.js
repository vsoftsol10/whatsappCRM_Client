// // ============================================================
// // voiceNoteMiddleware
// //
// // Browsers record voice messages in their own format:
// //   Chrome / Edge  -> audio/webm (Opus)   <- WhatsApp does NOT accept this
// //   Firefox        -> audio/ogg  (Opus)   <- accepted
// //   Safari         -> audio/mp4  (AAC)    <- accepted, but shows as a file
// //
// // WhatsApp shows a real "voice note" (round play button + waveform)
// // only for OGG files with the OPUS codec. So this middleware converts
// // recorded voice messages to  audio/ogg (Opus, mono)  before they are
// // uploaded to WhatsApp.
// //
// // It ONLY touches:
// //   - audio/webm uploads, or
// //   - files whose name starts with "voice-note" (created by the CRM
// //     voice recorder button).
// // Every other upload (images, documents, MP3 files picked by hand...)
// // passes through completely unchanged.
// // ============================================================

// const { spawn } = require("child_process");

// let ffmpegPath = null;
// try {
//   ffmpegPath = require("ffmpeg-static");
// } catch (error) {
//   ffmpegPath = null;
// }

// const isVoiceRecording = (file) => {
//   if (!file || !file.buffer) return false;

//   const mime = String(file.mimetype || "")
//     .split(";")[0]
//     .trim()
//     .toLowerCase();
//   const name = String(file.originalname || "").toLowerCase();

//   if (mime === "audio/webm") return true;
//   if (name.startsWith("voice-note") && mime.startsWith("audio/")) return true;

//   return false;
// };

// const convertToOggOpus = (inputBuffer) =>
//   new Promise((resolve, reject) => {
//     if (!ffmpegPath) {
//       return reject(new Error("ffmpeg is not installed on the server"));
//     }

//     const ffmpeg = spawn(
//       ffmpegPath,
//       [
//         "-hide_banner",
//         "-loglevel", "error",
//         "-i", "pipe:0",       // recorded audio comes in on stdin
//         "-vn",                // audio only
//         "-ac", "1",           // mono (WhatsApp voice notes are mono)
//         "-ar", "48000",
//         "-c:a", "libopus",
//         "-b:a", "32k",
//         "-application", "voip",
//         "-f", "ogg",
//         "pipe:1",             // converted audio goes out on stdout
//       ],
//       { stdio: ["pipe", "pipe", "pipe"] }
//     );

//     const chunks = [];
//     let errorText = "";

//     ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
//     ffmpeg.stderr.on("data", (chunk) => {
//       errorText += chunk.toString();
//     });

//     ffmpeg.on("error", reject);

//     ffmpeg.on("close", (code) => {
//       const output = Buffer.concat(chunks);

//       if (code !== 0 || output.length === 0) {
//         return reject(new Error(errorText.trim() || `ffmpeg exited with ${code}`));
//       }

//       resolve(output);
//     });

//     // Ignore EPIPE if ffmpeg exits early; the "close" handler reports it.
//     ffmpeg.stdin.on("error", () => {});
//     ffmpeg.stdin.end(inputBuffer);
//   });

// const convertVoiceNote = async (req, res, next) => {
//   try {
//     if (!isVoiceRecording(req.file)) return next();

//     const converted = await convertToOggOpus(req.file.buffer);

//     req.file.buffer = converted;
//     req.file.size = converted.length;
//     req.file.mimetype = "audio/ogg";
//     req.file.originalname = `voice-note-${Date.now()}.ogg`;

//     return next();
//   } catch (error) {
//     console.error("Voice note conversion failed:", error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Could not process the voice message. Please try again.",
//     });
//   }
// };

// module.exports = { convertVoiceNote, convertToOggOpus, isVoiceRecording };




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
// Facebook Messenger and Instagram do NOT accept OGG. They accept
// AAC / M4A / WAV / MP4 audio. So recordings made in a Facebook or
// Instagram chat (file name starts with "voice-note-social") are
// converted to M4A (AAC) instead.
//
// It ONLY touches:
//   - audio/webm uploads, or
//   - files whose name starts with "voice-note" (created by the CRM
//     voice recorder button).
// Every other upload (images, documents, MP3 files picked by hand...)
// passes through completely unchanged.
// ============================================================

const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

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

// Facebook / Instagram: convert to M4A (AAC in an MP4 container).
// The MP4 container needs a seekable output, so ffmpeg writes to a
// temporary file which is read back and then deleted.
const convertToM4a = (inputBuffer) =>
  new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      return reject(new Error("ffmpeg is not installed on the server"));
    }

    const outPath = path.join(
      os.tmpdir(),
      `voice-${Date.now()}-${Math.random().toString(36).slice(2)}.m4a`
    );

    const ffmpeg = spawn(
      ffmpegPath,
      [
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-i", "pipe:0",
        "-vn",
        "-ac", "1",
        "-ar", "44100",
        "-c:a", "aac",
        "-b:a", "64k",
        "-movflags", "+faststart",
        "-f", "ipod",         // .m4a
        outPath,
      ],
      { stdio: ["pipe", "ignore", "pipe"] }
    );

    let errorText = "";
    ffmpeg.stderr.on("data", (chunk) => {
      errorText += chunk.toString();
    });

    ffmpeg.on("error", reject);

    ffmpeg.on("close", async (code) => {
      try {
        if (code !== 0) {
          return reject(
            new Error(errorText.trim() || `ffmpeg exited with ${code}`)
          );
        }
        const output = await fs.promises.readFile(outPath);
        if (!output.length) return reject(new Error("ffmpeg produced no audio"));
        resolve(output);
      } catch (error) {
        reject(error);
      } finally {
        fs.promises.unlink(outPath).catch(() => {});
      }
    });

    ffmpeg.stdin.on("error", () => {});
    ffmpeg.stdin.end(inputBuffer);
  });

const convertVoiceNote = async (req, res, next) => {
  try {
    if (!isVoiceRecording(req.file)) return next();

    const forSocial = String(req.file.originalname || "")
      .toLowerCase()
      .startsWith("voice-note-social");

    if (forSocial) {
      // Facebook Messenger / Instagram
      const converted = await convertToM4a(req.file.buffer);

      req.file.buffer = converted;
      req.file.size = converted.length;
      req.file.mimetype = "audio/mp4";
      req.file.originalname = `voice-note-${Date.now()}.m4a`;

      return next();
    }

    // WhatsApp
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

module.exports = {
  convertVoiceNote,
  convertToOggOpus,
  convertToM4a,
  isVoiceRecording,
};