// const cloudinary = require("../config/cloudinary");
// const streamifier = require("streamifier");

// // 👈 CHANGED: folder is now an optional second argument, defaulting to
// // "campaign-images" so every existing call site (campaignController)
// // behaves exactly as before with no changes needed there.
// const uploadCampaignImage = (file, folder = "campaign-images") => {
//   return new Promise((resolve, reject) => {
//     if (!file || !file.buffer) {
//       return resolve(null);
//     }

//     const stream = cloudinary.uploader.upload_stream(
//       {
//         folder,
//         resource_type: "image",
//         // Cap dimensions and let Cloudinary auto-optimize quality/format.
//         // This keeps large Canva exports well under WhatsApp's 5MB
//         // per-image send limit while preserving visual quality.
//         transformation: [
//           { width: 1600, crop: "limit" },
//           { quality: "auto:good" },
//           { fetch_format: "auto" },
//         ],
//       },
//       (error, result) => {
//         if (error) return reject(error);

//         resolve({
//           imageUrl: result.secure_url,
//           publicId: result.public_id,
//         });
//       }
//     );

//     streamifier.createReadStream(file.buffer).pipe(stream);
//   });
// };

// module.exports = {
//   uploadCampaignImage,
// };


const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// 👈 CHANGED: folder is now an optional second argument, defaulting to
// "campaign-images" so every existing call site (campaignController)
// behaves exactly as before with no changes needed there.
const uploadCampaignImage = (file, folder = "campaign-images") => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return resolve(null);
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        // Cap dimensions and let Cloudinary auto-optimize quality/format.
        // This keeps large Canva exports well under WhatsApp's 5MB
        // per-image send limit while preserving visual quality.
        transformation: [
          { width: 1600, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          imageUrl: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// ============================================
// GENERIC BUFFER UPLOAD
// ============================================
// Used for incoming WhatsApp media (Coexistence history sync, message
// echoes, and — if wired up the same way — live inbound messages) where
// we already have the file bytes in memory rather than a multer `file`
// object from a form upload. Unlike uploadCampaignImage, resourceType
// is caller-supplied since incoming media can be image, video, audio,
// or a raw document — not just images.
const uploadBufferToCloudinary = (
  buffer,
  { folder = "whatsapp-media", resourceType = "auto" } = {}
) => {
  return new Promise((resolve, reject) => {
    if (!buffer) {
      return resolve(null);
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType, // "image" | "video" | "raw" | "auto"
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          imageUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

module.exports = {
  uploadCampaignImage,
  uploadBufferToCloudinary,
};