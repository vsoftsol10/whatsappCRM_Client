import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { loadFacebookSDK } from "../../utils/facebookSdk";

const ConnectWhatsApp = () => {
    const [loading, setLoading] = useState(false);
    const [sdkReady, setSdkReady] = useState(false);

    // Meta sends WABA ID / phone number ID via a separate
    // window "message" event, not through FB.login's callback.
    // We stash it here and only call the backend once we also
    // have the auth code from FB.login.
    const signupDataRef = useRef({ wabaId: null, phoneNumberId: null });

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

            try {
                const data = JSON.parse(event.data);

                if (data.type === "WA_EMBEDDED_SIGNUP" && data.event === "FINISH") {
                    signupDataRef.current = {
                        wabaId: data.data?.waba_id || null,
                        phoneNumberId: data.data?.phone_number_id || null,
                    };
                    console.log("Embedded signup session data:", signupDataRef.current);
                }
            } catch {
                // Not a JSON message from Meta — ignore.
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    const sendCodeToBackend = async (code) => {
        try {
            const token = localStorage.getItem("token");
            const { wabaId, phoneNumberId } = signupDataRef.current;

            if (!wabaId || !phoneNumberId) {
                console.error("Missing WABA ID / Phone Number ID — signup incomplete");
                alert("WhatsApp connection incomplete. Please try again.");
                return;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/whatsapp/embedded-signup`,
                { code, wabaId, phoneNumberId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Backend response:", response.data);
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
            return;
        }

        setLoading(true);

        window.FB.login(
            (response) => {
                setLoading(false);

                if (response.authResponse) {
                    sendCodeToBackend(response.authResponse.code);
                } else {
                    console.log("WhatsApp signup was cancelled");
                }
            },
            {
                config_id: import.meta.env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID,
                response_type: "code",
                override_default_response_type: true,
                extras: { feature: "whatsapp_embedded_signup", setup: {} },
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