// ============================================================
// META MEDIA UPLOAD SERVICE
// ============================================================
// A template with an IMAGE / VIDEO / DOCUMENT header cannot be submitted
// to Meta with just a URL string. Meta requires a sample file to be
// uploaded through its Resumable Upload API first, which returns a
// short-lived "handle" — that handle is what goes into the template's
// HEADER component as `example.header_handle` at submission time.
//
// Docs: https://developers.facebook.com/docs/graph-api/guides/upload
//
// Flow:
//   1. Download the source image (the URL the user entered as the
//      header content) so we have raw bytes + content type + size.
//   2. POST /{app-id}/uploads  -> returns an upload session id
//      ("upload:xxxxxxxx").
//   3. POST /{upload-session-id} with the raw bytes and
//      "file_offset: 0" -> returns { h: "<handle>" }.
//   4. Return that handle to the caller so it can be placed in
//      example.header_handle when creating the template.

const axios = require("axios");

const GRAPH_API_VERSION = "v23.0";

/**
 * Downloads a publicly accessible file and uploads it to Meta's
 * Resumable Upload API, returning a media handle usable in
 * `example.header_handle` for template submission.
 *
 * @param {string} fileUrl - Public URL of the sample image/video/document.
 * @returns {Promise<{ success: boolean, handle?: string, error?: string }>}
 */
const uploadHeaderMediaToMeta = async (fileUrl) => {
  try {
    if (!fileUrl || typeof fileUrl !== "string" || !fileUrl.trim()) {
      return {
        success: false,
        error: "No header media URL was provided.",
      };
    }

    if (!process.env.META_APP_ID) {
      return {
        success: false,
        error: "META_APP_ID is not configured on the server.",
      };
    }

    if (!process.env.META_SYSTEM_USER_TOKEN) {
      return {
        success: false,
        error: "META_SYSTEM_USER_TOKEN is not configured on the server.",
      };
    }

    // --------------------------------------------------------
    // STEP 1: DOWNLOAD THE SOURCE FILE
    // --------------------------------------------------------

    let fileResponse;

    try {
      fileResponse = await axios.get(fileUrl.trim(), {
        responseType: "arraybuffer",
      });
    } catch (downloadError) {
      return {
        success: false,
        error: `Could not download the header media from the URL provided: ${
          downloadError.message
        }`,
      };
    }

    const fileBuffer = Buffer.from(fileResponse.data);

    const contentType =
      fileResponse.headers?.["content-type"] || "image/jpeg";

    if (fileBuffer.length === 0) {
      return {
        success: false,
        error: "The downloaded header media file is empty.",
      };
    }

    // --------------------------------------------------------
    // STEP 2: START THE UPLOAD SESSION
    // --------------------------------------------------------

    let sessionResponse;

    try {
      sessionResponse = await axios.post(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.META_APP_ID}/uploads`,
        null,
        {
          params: {
            file_length: fileBuffer.length,
            file_type: contentType,
            access_token: process.env.META_SYSTEM_USER_TOKEN,
          },
        }
      );
    } catch (sessionError) {
      return {
        success: false,
        error:
          sessionError.response?.data?.error?.message ||
          sessionError.message ||
          "Failed to start Meta upload session.",
      };
    }

    const uploadSessionId = sessionResponse.data?.id;

    if (!uploadSessionId) {
      return {
        success: false,
        error: "Meta did not return an upload session id.",
      };
    }

    // --------------------------------------------------------
    // STEP 3: UPLOAD THE FILE BYTES
    // --------------------------------------------------------

    let uploadResponse;

    try {
      uploadResponse = await axios.post(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${uploadSessionId}`,
        fileBuffer,
        {
          headers: {
            Authorization: `OAuth ${process.env.META_SYSTEM_USER_TOKEN}`,
            file_offset: 0,
            "Content-Type": "application/octet-stream",
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );
    } catch (uploadError) {
      return {
        success: false,
        error:
          uploadError.response?.data?.error?.message ||
          uploadError.message ||
          "Failed to upload header media bytes to Meta.",
      };
    }

    const handle = uploadResponse.data?.h;

    if (!handle) {
      return {
        success: false,
        error: "Meta did not return a media handle for the uploaded file.",
      };
    }

    return { success: true, handle };
  } catch (error) {
    console.error(
      "META MEDIA UPLOAD ERROR:",
      error.response?.data || error.message
    );

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
    };
  }
};

module.exports = { uploadHeaderMediaToMeta };