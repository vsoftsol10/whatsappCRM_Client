// import { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { loadFacebookSDK } from "../../utils/facebookSdk";

// const ConnectWhatsApp = ({ onConnected }) => {
//     const [loading, setLoading] = useState(false);
//     const [sdkReady, setSdkReady] = useState(false);

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

//         if (sent) return;
//         if (!code || !wabaId || !phoneNumberId) return;

//         signupDataRef.current.sent = true;
//         sendCodeToBackend(code, wabaId, phoneNumberId);
//     };

//     const sendCodeToBackend = async (code, wabaId, phoneNumberId) => {
//         try {
//             const token = localStorage.getItem("token");

//             const response = await axios.post(
//                 `${import.meta.env.VITE_API_URL}/api/whatsapp/accounts/embedded-signup`,
//                 { code, wabaId, phoneNumberId },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );

//             console.log("Backend response:", response.data);

//             if (response.data?.success && onConnected) {
//                 onConnected();
//             }
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

//                     setTimeout(() => {
//                         if (!signupDataRef.current.sent) {
//                             console.error("Timed out waiting for WABA ID / Phone Number ID");
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
//                 use_fedcm_for_login: false,
//                 extras: {
//                     setup: {},
//                     featureType: '',
//                     sessionInfoVersion: '3',
//                 },
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

const POLL_INTERVAL_MS = 4000;
const MAX_POLL_MS = 6 * 60 * 1000; // stop polling after 6 minutes regardless

const ConnectWhatsApp = ({ onConnected }) => {
    const [loading, setLoading] = useState(false);
    const [sdkReady, setSdkReady] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncStatusMessage, setSyncStatusMessage] = useState("");
    const [mismatchMessage, setMismatchMessage] = useState("");

    // code and waba/phone data can arrive in EITHER order (FB.login's
    // callback and the window "message" event are independent async
    // channels), so we store both here and only fire the backend call
    // once we have everything the chosen path needs.
    //
    // intendedFlow: which button the user actually clicked — 'standard'
    // or 'coexistence'. This is OUR intent, separate from isCoexistence
    // below (what Meta's event actually returned). Comparing the two lets
    // us detect Meta silently falling back to standard onboarding (most
    // commonly because the number hasn't had enough WhatsApp Business App
    // activity yet to be Coexistence-eligible).
    //
    // isCoexistence: true when Meta's FINISH event says the business was
    // actually onboarded via "Connect a WhatsApp Business App". That
    // event only ever returns a waba_id — never a phone_number_id — so we
    // must NOT wait on phoneNumberId in that case, or the flow hangs and
    // times out. Our backend looks the phone number up on its own.
    const signupDataRef = useRef({
        wabaId: null,
        phoneNumberId: null,
        code: null,
        intendedFlow: null,
        isCoexistence: false,
        sent: false,
    });

    const pollingRef = useRef({ intervalId: null, timeoutId: null });

    const stopPolling = () => {
        if (pollingRef.current.intervalId) {
            clearInterval(pollingRef.current.intervalId);
            pollingRef.current.intervalId = null;
        }
        if (pollingRef.current.timeoutId) {
            clearTimeout(pollingRef.current.timeoutId);
            pollingRef.current.timeoutId = null;
        }
    };

    // Coexistence's contacts + chat history sync runs in the background
    // on the server (can take several minutes), so once embedded-signup
    // returns we poll GET /coexistence-status until it settles instead
    // of just guessing the sync finished when the initial request did.
    const pollCoexistenceStatus = (accountId) => {
        stopPolling();
        setSyncing(true);
        setSyncStatusMessage("Syncing contacts and chat history…");

        const token = localStorage.getItem("token");

        const checkStatus = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/whatsapp/accounts/${accountId}/coexistence-status`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const account = response.data?.account;
                if (!account) return;

                if (account.historySyncStatus === "DECLINED") {
                    setSyncStatusMessage(
                        "Connected — the business declined to share chat history, so only new messages will appear."
                    );
                } else if (account.historySyncStatus === "FAILED") {
                    setSyncStatusMessage(
                        "Connected — chat history sync failed, but new messages will still come through."
                    );
                } else if (account.deadlinePassed && !account.syncFinished) {
                    setSyncStatusMessage(
                        "Connected — sync window closed before it fully finished. New messages will still come through."
                    );
                } else if (account.syncFinished) {
                    setSyncStatusMessage("Contacts and chat history sync complete.");
                } else {
                    setSyncStatusMessage("Syncing contacts and chat history…");
                }

                if (account.syncFinished) {
                    stopPolling();
                    setSyncing(false);
                }
            } catch (error) {
                console.error(
                    "Failed to fetch coexistence status:",
                    error.response?.data || error.message
                );
                // Don't stop polling on a transient network error — just
                // try again on the next tick.
            }
        };

        checkStatus();
        pollingRef.current.intervalId = setInterval(checkStatus, POLL_INTERVAL_MS);
        pollingRef.current.timeoutId = setTimeout(() => {
            stopPolling();
            setSyncing(false);
            setSyncStatusMessage((current) =>
                current || "Sync is taking longer than expected — check back shortly."
            );
        }, MAX_POLL_MS);
    };

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

                    // Standard path — brand-new or migrated Cloud API number.
                    // Comes with both waba_id and phone_number_id.
                    if (data.event === "FINISH" || data.event === "FINISH_ONLY_WABA") {
                        signupDataRef.current.wabaId = data.data?.waba_id || null;
                        signupDataRef.current.phoneNumberId = data.data?.phone_number_id || null;
                        signupDataRef.current.isCoexistence = false;
                        console.log("Embedded signup session data:", signupDataRef.current);
                        checkForIntentMismatch(data.event);
                        tryFinishSignup();
                    }

                    // Coexistence path — business chose "Connect a WhatsApp
                    // Business App". Only waba_id is provided here; do NOT
                    // wait for phone_number_id, it never arrives.
                    if (data.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
                        signupDataRef.current.wabaId = data.data?.waba_id || null;
                        signupDataRef.current.phoneNumberId = null;
                        signupDataRef.current.isCoexistence = true;
                        console.log("Embedded signup session data (Coexistence):", signupDataRef.current);
                        checkForIntentMismatch(data.event);
                        tryFinishSignup();
                    }
                }
            } catch (e) {
                console.log("[DEBUG] postMessage was not JSON:", event.data);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
            stopPolling();
        };
    }, []);

    // Compares which button the user clicked (intendedFlow) against what
    // Meta's completion event actually says happened. A mismatch here is
    // the clearest possible signal of *why* Coexistence didn't trigger —
    // no need to dig through DevTools or wait on webhooks to find out.
    const checkForIntentMismatch = (actualEvent) => {
        const { intendedFlow, isCoexistence } = signupDataRef.current;

        if (intendedFlow === "coexistence" && !isCoexistence) {
            console.warn(
                `[WhatsApp Signup] Clicked "Connect Existing WhatsApp Business App" but Meta returned "${actualEvent}" ` +
                `(standard onboarding). This usually means the number isn't Coexistence-eligible yet — ` +
                `Meta generally wants at least 7+ days of real activity in the WhatsApp Business App first.`
            );
            setMismatchMessage(
                "This number wasn't eligible for Coexistence yet, so it was connected as a new standard number instead. " +
                "It usually needs more active history in the WhatsApp Business App before Meta allows Coexistence."
            );
        } else if (intendedFlow === "standard" && isCoexistence) {
            console.warn(
                `[WhatsApp Signup] Clicked "Connect with New Number" but Meta returned "${actualEvent}" (Coexistence). ` +
                `Meta recognized this number as already active in the WhatsApp Business App.`
            );
            setMismatchMessage(
                "Meta recognized this number as already active in the WhatsApp Business App, so it was connected via Coexistence instead of as a new number."
            );
        } else {
            setMismatchMessage("");
        }
    };

    const tryFinishSignup = () => {
        const { code, wabaId, phoneNumberId, isCoexistence, sent } = signupDataRef.current;

        if (sent) return; // already sent, avoid double-calling backend
        if (!code || !wabaId) return; // still waiting on one piece

        // Standard path needs a phoneNumberId before calling the backend.
        // Coexistence never provides one here, so it's ready as soon as
        // code + wabaId exist.
        if (!isCoexistence && !phoneNumberId) return;

        signupDataRef.current.sent = true;
        sendCodeToBackend(code, wabaId, phoneNumberId, isCoexistence);
    };

    const sendCodeToBackend = async (code, wabaId, phoneNumberId, isCoexistence) => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/whatsapp/accounts/embedded-signup`,
                {
                    code,
                    wabaId,
                    phoneNumberId,
                    isCoexistence,
                    // Sent for server-side logging only — the backend still
                    // branches purely on isCoexistence above, this never
                    // changes behavior, just gives you an audit trail.
                    intendedFlow: signupDataRef.current.intendedFlow,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log("Backend response:", response.data);

            if (response.data?.success && onConnected) {
                onConnected(response.data.account);
            }

            // Kick off status polling for Coexistence — the actual
            // contacts/history sync was fired off async on the backend
            // and can still be running well after this response returns.
            if (isCoexistence && response.data?.account?.id) {
                pollCoexistenceStatus(response.data.account.id);
            }
        } catch (error) {
            console.error(
                "Failed to send WhatsApp signup code:",
                error.response?.data || error.message
            );
            alert(
                error.response?.data?.message ||
                "Failed to connect WhatsApp. Please try again."
            );
        }
    };

    // flow: 'standard' | 'coexistence' — set by which button was clicked.
    const launchSignup = (flow) => {
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

        // Reset session state for a fresh attempt
        signupDataRef.current = {
            wabaId: null,
            phoneNumberId: null,
            code: null,
            intendedFlow: flow,
            isCoexistence: false,
            sent: false,
        };
        stopPolling();
        setSyncStatusMessage("");
        setMismatchMessage("");

        setLoading(true);

        window.FB.login(
            (response) => {
                setLoading(false);

                if (response.authResponse) {
                    signupDataRef.current.code = response.authResponse.code;
                    tryFinishSignup();

                    // Safety net: the "message" event carrying waba_id (and
                    // phone_number_id, for the standard path) usually arrives
                    // within a second or two. If it hasn't shown up after 8s,
                    // something went wrong (e.g. signup was closed early) —
                    // tell the user instead of silently doing nothing.
                    setTimeout(() => {
                        if (!signupDataRef.current.sent) {
                            console.error(
                                "Timed out waiting for WABA ID / Phone Number ID"
                            );
                            alert("WhatsApp connection incomplete. Please try again.");
                        }
                    }, 8000);
                } else {
                    console.log("WhatsApp signup was cancelled");
                }
            },
            {
                config_id: configId,
                response_type: "code",
                override_default_response_type: true,
                use_fedcm_for_login: false,   // forces classic popup, not broken FedCM flow
                extras: {
                    setup: {},
                    // Only requested when the user explicitly chose the
                    // Coexistence button. Sending this on every attempt
                    // (the old behavior) is what made it impossible to
                    // tell whether a customer even wanted Coexistence, or
                    // whether Meta was just deciding on its own.
                    featureType: flow === "coexistence" ? "whatsapp_business_app_onboarding" : "",
                    sessionInfoVersion: "3",
                },
            }
        );
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
                <button
                    type="button"
                    onClick={() => launchSignup("standard")}
                    disabled={!sdkReady || loading || syncing}
                    className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-semibold text-black transition hover:bg-[#20bd5a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Connecting..." : syncing ? "Syncing WhatsApp data..." : "Connect with New Number"}
                </button>

                <button
                    type="button"
                    onClick={() => launchSignup("coexistence")}
                    disabled={!sdkReady || loading || syncing}
                    className="flex items-center gap-2 rounded-xl border border-[#25D366] bg-white px-6 py-3 font-semibold text-[#25D366] transition hover:bg-[#25D366]/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Connecting..." : syncing ? "Syncing WhatsApp data..." : "Connect Existing WhatsApp Business App"}
                </button>
            </div>

            {syncStatusMessage && (
                <p className="text-sm text-gray-500">{syncStatusMessage}</p>
            )}

            {mismatchMessage && (
                <p className="text-sm text-amber-600">{mismatchMessage}</p>
            )}
        </div>
    );
};

export default ConnectWhatsApp;
