
// import { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { loadFacebookSDK } from "../../utils/facebookSdk";

// const ConnectWhatsApp = () => {
//     const [loading, setLoading] = useState(false);
//     const [sdkReady, setSdkReady] = useState(false);

//     // code and waba/phone data can arrive in EITHER order (FB.login's
//     // callback and the window "message" event are independent async
//     // channels), so we store both here and only fire the backend call
//     // once both pieces exist — whichever arrives second triggers it.
//     const signupDataRef = useRef({ wabaId: null, phoneNumberId: null, code: null, sent: false });

//     useEffect(() => {
//         loadFacebookSDK()
//             .then(() => setSdkReady(true))
//             .catch((error) => console.error("Facebook SDK error:", error));

//         const handleMessage = (event) => {
//             if (
//                 !event.origin.endsWith("facebook.com") &&
//                 !event.origin.endsWith("fb.com")
//             ) {
//                 return;
//             }

//             console.log("[DEBUG] RAW postMessage:", event.origin, event.data);

//             try {
//                 const data = JSON.parse(event.data);
//                 console.log("[DEBUG] PARSED postMessage:", data);

//                 if (data.type === "WA_EMBEDDED_SIGNUP") {
//                     console.log("[DEBUG] WA_EMBEDDED_SIGNUP event name:", data.event, "payload:", data.data);

//                     if (data.event === "FINISH" || data.event === "FINISH_ONLY_WABA" || data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
//                         signupDataRef.current.wabaId = data.data?.waba_id || null;
//                         signupDataRef.current.phoneNumberId = data.data?.phone_number_id || null;
//                         console.log("Embedded signup session data:", signupDataRef.current);
//                         tryFinishSignup();
//                     }
//                 }
//             } catch (e) {
//                 console.log("[DEBUG] postMessage was not JSON:", event.data);
//             }
//         };

//         window.addEventListener("message", handleMessage);
//         return () => window.removeEventListener("message", handleMessage);
//     }, []);

//     const tryFinishSignup = () => {
//         const { code, wabaId, phoneNumberId, sent } = signupDataRef.current;

//         if (sent) return; // already sent, avoid double-calling backend
//         if (!code || !wabaId || !phoneNumberId) return; // still waiting on one piece

//         signupDataRef.current.sent = true;
//         sendCodeToBackend(code, wabaId, phoneNumberId);
//     };

//     const sendCodeToBackend = async (code, wabaId, phoneNumberId) => {
//         try {
//             const token = localStorage.getItem("token");

//             const response = await axios.post(
//                 `${import.meta.env.VITE_API_URL}/api/whatsapp/embedded-signup`,
//                 { code, wabaId, phoneNumberId },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );

//             console.log("Backend response:", response.data);
//         } catch (error) {
//             console.error(
//                 "Failed to send WhatsApp signup code:",
//                 error.response?.data || error.message
//             );
//         }
//     };

//     const handleConnectWhatsApp = () => {
//         if (!window.FB) {
//             console.error("Facebook SDK is not loaded");
//             alert("Facebook SDK failed to load. Please refresh the page and try again.");
//             return;
//         }

//         const configId = import.meta.env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID;

//         if (!configId) {
//             console.error("Missing VITE_META_EMBEDDED_SIGNUP_CONFIG_ID");
//             alert("WhatsApp signup is not configured correctly. Please contact support.");
//             return;
//         }

//         setLoading(true);

//         window.FB.login(
//             (response) => {
//                 setLoading(false);

//                 if (response.authResponse) {
//                     signupDataRef.current.code = response.authResponse.code;
//                     tryFinishSignup();

//                     // Safety net: the "message" event carrying waba_id/
//                     // phone_number_id usually arrives within a second or two.
//                     // If it hasn't shown up after 5s, something went wrong
//                     // (e.g. signup was closed early) — tell the user instead
//                     // of silently doing nothing.
//                     setTimeout(() => {
//                         if (!signupDataRef.current.sent) {
//                             console.error(
//                                 "Timed out waiting for WABA ID / Phone Number ID"
//                             );
//                             alert("WhatsApp connection incomplete. Please try again.");
//                         }
//                     }, 5000);
//                 } else {
//                     console.log("WhatsApp signup was cancelled");
//                 }
//             },
//             {
//                 config_id: configId,
//                 response_type: "code",
//                 override_default_response_type: true,
//                 use_fedcm_for_login: false,   // ⬅️ forces classic popup, not broken FedCM flow
//                 extras: { feature: "whatsapp_embedded_signup", setup: {} },
//             }
//         );
//     };

//     return (
//         <button
//             type="button"
//             onClick={handleConnectWhatsApp}
//             disabled={!sdkReady || loading}
//             className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-semibold text-black transition hover:bg-[#20bd5a] disabled:cursor-not-allowed disabled:opacity-50"
//         >
//             {loading ? "Connecting..." : "Connect WhatsApp"}
//         </button>
//     );
// };

// export default ConnectWhatsApp;


import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { loadFacebookSDK } from "../../utils/facebookSdk";

const ConnectWhatsApp = ({ onConnected }) => {
    const [loading, setLoading] = useState(false);
    const [sdkReady, setSdkReady] = useState(false);

    const signupDataRef = useRef({ wabaId: null, phoneNumberId: null, code: null, sent: false });

    useEffect(() => {
        loadFacebookSDK()
            .then(() => setSdkReady(true))
            .catch((error) => console.error("Facebook SDK error:", error));

        const handleMessage = (event) => {
            if (
                !event.origin.endsWith("facebook.com") &&
                !event.origin.endsWith("fb.com")
            ) {
                return;
            }

            console.log("[DEBUG] RAW postMessage:", event.origin, event.data);

            try {
                const data = JSON.parse(event.data);
                console.log("[DEBUG] PARSED postMessage:", data);

                if (data.type === "WA_EMBEDDED_SIGNUP") {
                    console.log("[DEBUG] WA_EMBEDDED_SIGNUP event name:", data.event, "payload:", data.data);

                    if (data.event === "FINISH" || data.event === "FINISH_ONLY_WABA" || data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
                        signupDataRef.current.wabaId = data.data?.waba_id || null;
                        signupDataRef.current.phoneNumberId = data.data?.phone_number_id || null;
                        console.log("Embedded signup session data:", signupDataRef.current);
                        tryFinishSignup();
                    }
                }
            } catch (e) {
                console.log("[DEBUG] postMessage was not JSON:", event.data);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const tryFinishSignup = () => {
        const { code, wabaId, phoneNumberId, sent } = signupDataRef.current;

        if (sent) return;
        if (!code || !wabaId || !phoneNumberId) return;

        signupDataRef.current.sent = true;
        sendCodeToBackend(code, wabaId, phoneNumberId);
    };

    const sendCodeToBackend = async (code, wabaId, phoneNumberId) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/whatsapp/accounts/embedded-signup`,
                { code, wabaId, phoneNumberId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Backend response:", response.data);

            if (response.data?.success && onConnected) {
                onConnected();
            }
        } catch (error) {
            console.error(
                "Failed to send WhatsApp signup code:",
                error.response?.data || error.message
            );
        }
    };

    const handleConnectWhatsApp = () => {
        if (!window.FB) {
            console.error("Facebook SDK is not loaded");
            alert("Facebook SDK failed to load. Please refresh the page and try again.");
            return;
        }

        const configId = import.meta.env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID;

        if (!configId) {
            console.error("Missing VITE_META_EMBEDDED_SIGNUP_CONFIG_ID");
            alert("WhatsApp signup is not configured correctly. Please contact support.");
            return;
        }

        setLoading(true);

        window.FB.login(
            (response) => {
                setLoading(false);

                if (response.authResponse) {
                    signupDataRef.current.code = response.authResponse.code;
                    tryFinishSignup();

                    setTimeout(() => {
                        if (!signupDataRef.current.sent) {
                            console.error("Timed out waiting for WABA ID / Phone Number ID");
                            alert("WhatsApp connection incomplete. Please try again.");
                        }
                    }, 5000);
                } else {
                    console.log("WhatsApp signup was cancelled");
                }
            },
            {
                config_id: configId,
                response_type: "code",
                override_default_response_type: true,
                use_fedcm_for_login: false,
                extras: {
                    setup: {},
                    featureType: '',
                    sessionInfoVersion: '3',
                },
            }
        );
    };

    return (
        <button
            type="button"
            onClick={handleConnectWhatsApp}
            disabled={!sdkReady || loading}
            className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-semibold text-black transition hover:bg-[#20bd5a] disabled:cursor-not-allowed disabled:opacity-50"
        >
            {loading ? "Connecting..." : "Connect WhatsApp"}
        </button>
    );
};

export default ConnectWhatsApp;