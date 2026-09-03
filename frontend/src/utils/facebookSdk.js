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
      window.FB.init({
        appId: import.meta.env.VITE_META_APP_ID,
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