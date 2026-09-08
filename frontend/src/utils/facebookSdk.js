let sdkLoadingPromise = null;

export const loadFacebookSDK = () => {
  if (window.FB) {
    return Promise.resolve(window.FB);
  }

  if (sdkLoadingPromise) {
    return sdkLoadingPromise;
  }

  sdkLoadingPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = function () {
      const appId = import.meta.env.VITE_META_APP_ID;

      // 🔍 DEBUG — confirm this prints your real App ID, not blank/undefined
      console.log("Initializing FB SDK with App ID:", appId);

      if (!appId) {
        console.error(
          "VITE_META_APP_ID is missing! Check your .env file and restart the dev server."
        );
      }

      window.FB.init({
        appId: appId,
        cookie: true,
        xfbml: true,
        version: "v23.0",
      });

      resolve(window.FB);
    };

    const existingScript = document.getElementById("facebook-jssdk");

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");

    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";

    script.onerror = () => {
      reject(new Error("Failed to load Facebook SDK"));
    };

    document.body.appendChild(script);
  });

  return sdkLoadingPromise;
};