// const cloudinary = require("../config/cloudinary");
// const streamifier = require("streamifier");

// const uploadCampaignImage = (file) => {
//   return new Promise((resolve, reject) => {
//     if (!file || !file.buffer) {
//       return resolve(null);
//     }

//     const stream = cloudinary.uploader.upload_stream(
//       {
//         folder: "campaign-images",
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

module.exports = {
  uploadCampaignImage,
};