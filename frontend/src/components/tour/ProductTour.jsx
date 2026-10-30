// // src/components/tour/ProductTour.jsx
// // Animated onboarding tour: spotlight + bouncing arrow + glide-in tooltip.
// // No extra npm packages needed.
// import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
// import { createPortal } from "react-dom";
// import { useLocation, useNavigate } from "react-router-dom";
// import { ArrowRight, ArrowLeft, X } from "lucide-react";
// import { FaWhatsapp, FaFacebook, FaInstagram } from "react-icons/fa";
// import { useAuthStore } from "../../store/authStore";
// import { useTourStore, isTourDone, markTourDone } from "../../store/tourStore";
// import { tourSteps } from "../../config/tourSteps";

// const PAD = 8; // space around the highlighted element
// const GAP = 70; // room between element and tooltip (the arrow lives here)
// const MARGIN = 12; // minimum distance from screen edges
// const ARROW = 46;
// const NEW_USER_WINDOW_DAYS = 30; // only auto-start for accounts newer than this

// const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

// /* ---------------------------------------------------------------- layout */
// function computeLayout(rect, size, vw, vh) {
//   const hole = {
//     top: rect.top - PAD,
//     left: rect.left - PAD,
//     width: rect.width + PAD * 2,
//     height: rect.height + PAD * 2,
//   };
//   hole.right = hole.left + hole.width;
//   hole.bottom = hole.top + hole.height;

//   const { w: tw, h: th } = size;
//   const narrow = vw < 700;
//   const fits = {
//     right: !narrow && hole.right + GAP + tw <= vw - MARGIN,
//     bottom: hole.bottom + GAP + th <= vh - MARGIN,
//     top: hole.top - GAP - th >= MARGIN,
//     left: !narrow && hole.left - GAP - tw >= MARGIN,
//   };
//   let side = ["right", "bottom", "top", "left"].find((s) => fits[s]);
//   const hasRoom = !!side;
//   if (!side) side = vh - hole.bottom >= hole.top ? "bottom" : "top";

//   const cx = hole.left + hole.width / 2;
//   const cy = hole.top + hole.height / 2;
//   let left, top, arrow;

//   if (side === "right") {
//     left = hole.right + GAP;
//     top = clamp(cy - th / 2, MARGIN, vh - th - MARGIN);
//     arrow = { left: hole.right + 8, top: cy - ARROW / 2, rot: 0, bx: -10, by: 0 };
//   } else if (side === "left") {
//     left = hole.left - GAP - tw;
//     top = clamp(cy - th / 2, MARGIN, vh - th - MARGIN);
//     arrow = { left: hole.left - ARROW - 8, top: cy - ARROW / 2, rot: 180, bx: 10, by: 0 };
//   } else if (side === "bottom") {
//     left = clamp(cx - tw / 2, MARGIN, vw - tw - MARGIN);
//     top = hasRoom ? hole.bottom + GAP : clamp(vh - th - MARGIN, MARGIN, vh);
//     arrow = { left: cx - ARROW / 2, top: hole.bottom + 8, rot: 90, bx: 0, by: -10 };
//   } else {
//     left = clamp(cx - tw / 2, MARGIN, vw - tw - MARGIN);
//     top = hasRoom ? hole.top - GAP - th : MARGIN;
//     arrow = { left: cx - ARROW / 2, top: hole.top - ARROW - 8, rot: 270, bx: 0, by: 10 };
//   }
//   arrow.left = clamp(arrow.left, 4, vw - ARROW - 4);
//   arrow.top = clamp(arrow.top, 4, vh - ARROW - 4);

//   return { hole, left, top, side, arrow, showArrow: hasRoom };
// }

// /* ----------------------------------------------------------------- styles */
// const CSS = `
// @keyframes vt-pop { from { opacity:0; transform: translateY(10px) scale(.96);} to { opacity:1; transform:none;} }
// @keyframes vt-ring { 0%{ transform:scale(1); opacity:.9;} 100%{ transform:scale(1.18); opacity:0;} }
// @keyframes vt-bounce { 0%,100%{ transform:translate(0,0);} 50%{ transform:translate(var(--bx),var(--by));} }
// @keyframes vt-arrow-in { from{ opacity:0; transform:scale(.4);} to{ opacity:1; transform:scale(1);} }
// @keyframes vt-float { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-8px);} }
// @keyframes vt-orbit { from{ transform:rotate(0deg) translateX(58px) rotate(0deg);} to{ transform:rotate(360deg) translateX(58px) rotate(-360deg);} }
// @keyframes vt-confetti { 0%{ transform:translate(0,0) rotate(0); opacity:1;} 100%{ transform:translate(var(--cx),var(--cy)) rotate(var(--cr)); opacity:0;} }
// @keyframes vt-shine { 0%{ background-position:-200% 0;} 100%{ background-position:200% 0;} }
// .vt-spot{ position:fixed; z-index:9998; pointer-events:none; border-radius:14px;
//   box-shadow:0 0 0 9999px rgba(2,9,11,.74);
//   transition:top .45s cubic-bezier(.22,1,.36,1),left .45s cubic-bezier(.22,1,.36,1),width .45s cubic-bezier(.22,1,.36,1),height .45s cubic-bezier(.22,1,.36,1),opacity .3s; }
// .vt-spot::before{ content:""; position:absolute; inset:-3px; border-radius:16px; border:2px solid #25D366; animation:vt-ring 1.7s ease-out infinite; }
// .vt-spot::after{ content:""; position:absolute; inset:0; border-radius:14px; border:2px solid #25D366; box-shadow:0 0 22px rgba(37,211,102,.55) inset,0 0 22px rgba(37,211,102,.45); }
// .vt-card{ position:fixed; z-index:10000; transition:top .5s cubic-bezier(.22,1,.36,1),left .5s cubic-bezier(.22,1,.36,1),opacity .3s; }
// .vt-inner{ animation:vt-pop .45s cubic-bezier(.22,1,.36,1) both; }
// .vt-arrow{ position:fixed; z-index:10001; pointer-events:none; animation:vt-arrow-in .4s .15s cubic-bezier(.22,1,.36,1) both; transition:top .45s cubic-bezier(.22,1,.36,1),left .45s cubic-bezier(.22,1,.36,1); }
// .vt-arrow > div{ animation:vt-bounce .9s ease-in-out infinite; filter:drop-shadow(0 4px 8px rgba(0,0,0,.45)); }
// .vt-float{ animation:vt-float 3s ease-in-out infinite; }
// .vt-btn-shine{ background-image:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%); background-size:200% 100%; animation:vt-shine 2.4s linear infinite; }
// @media (prefers-reduced-motion: reduce){
//   .vt-spot,.vt-spot::before,.vt-card,.vt-inner,.vt-arrow,.vt-arrow>div,.vt-float,.vt-btn-shine,.vt-orbit,.vt-confetti{ animation:none !important; transition:none !important; }
// }
// `;

// /* ------------------------------------------------------------- sub-views */
// function ArrowPointer({ arrow }) {
//   return (
//     <div
//       className="vt-arrow"
//       style={{ left: arrow.left, top: arrow.top, width: ARROW, height: ARROW, "--bx": `${arrow.bx}px`, "--by": `${arrow.by}px` }}
//     >
//       <div style={{ width: ARROW, height: ARROW, transform: `rotate(${arrow.rot}deg)` }}>
//         <svg viewBox="0 0 48 48" width={ARROW} height={ARROW} fill="none">
//           <path d="M6 24 22 8v10h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H22v10L6 24Z" fill="#25D366" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
//         </svg>
//       </div>
//     </div>
//   );
// }

// function WelcomeHero() {
//   return (
//     <div className="relative mx-auto mb-4 flex h-32 w-32 items-center justify-center">
//       <span className="vt-orbit absolute left-1/2 top-1/2 -ml-4 -mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md" style={{ animation: "vt-orbit 6s linear infinite" }}>
//         <FaFacebook className="text-[#1877F2]" size={18} />
//       </span>
//       <span className="vt-orbit absolute left-1/2 top-1/2 -ml-4 -mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md" style={{ animation: "vt-orbit 6s linear infinite", animationDelay: "-3s" }}>
//         <FaInstagram className="text-[#E1306C]" size={18} />
//       </span>
//       <div className="vt-float flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-lg shadow-[#25D366]/40">
//         <FaWhatsapp className="text-white" size={44} />
//       </div>
//     </div>
//   );
// }

// const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
//   cx: `${Math.round(Math.cos((i / 22) * Math.PI * 2) * (90 + (i % 5) * 18))}px`,
//   cy: `${Math.round(Math.sin((i / 22) * Math.PI * 2) * (70 + (i % 4) * 16)) - 20}px`,
//   cr: `${(i * 67) % 360}deg`,
//   color: ["#25D366", "#128C7E", "#F59E0B", "#1877F2", "#E1306C", "#8B5CF6"][i % 6],
//   delay: `${(i % 6) * 0.04}s`,
// }));

// function Confetti() {
//   return (
//     <div className="pointer-events-none absolute left-1/2 top-12 h-0 w-0">
//       {CONFETTI.map((c, i) => (
//         <span
//           key={i}
//           className="vt-confetti absolute block h-2 w-2 rounded-sm"
//           style={{ background: c.color, "--cx": c.cx, "--cy": c.cy, "--cr": c.cr, animation: `vt-confetti 1.2s ${c.delay} ease-out both` }}
//         />
//       ))}
//     </div>
//   );
// }

// /* ------------------------------------------------------------- component */
// export default function ProductTour() {
//   const user = useAuthStore((s) => s.user);
//   const { active, index, start, goTo, stop } = useTourStore();
//   const navigate = useNavigate();
//   const { pathname } = useLocation();
//   const pathRef = useRef(pathname);
//   useEffect(() => {
//     pathRef.current = pathname;
//   }, [pathname]);

//   const userId = user?.id ?? user?._id ?? user?.email;
//   const role = user?.role;

//   const steps = useMemo(
//     () => tourSteps.filter((s) => !s.roles || s.roles.includes(role)),
//     [role]
//   );
//   const step = active ? steps[index] : null;
//   const isFirst = index === 0;
//   const isLast = index === steps.length - 1;

//   const [rect, setRect] = useState(null);
//   const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
//   const [size, setSize] = useState({ w: 380, h: 240 });
//   const cardRef = useRef(null);

//   const closeSidebar = () =>
//     window.dispatchEvent(new CustomEvent("vatup-tour:sidebar", { detail: { open: false } }));

//   /* ---- finish / skip ---- */
//   const finish = useCallback(
//     (goToRoute) => {
//       if (userId) markTourDone(userId);
//       stop();
//       closeSidebar();
//       if (goToRoute) navigate(goToRoute);
//     },
//     [userId, stop, navigate]
//   );

//   /* ---- auto-start for new users ---- */
//   useEffect(() => {
//     if (!userId || active) return;
//     if (pathname === "/change-password") return; // wait until password is changed
//     if (isTourDone(userId)) return;

//     if (user?.createdAt) {
//       const ageDays = (Date.now() - new Date(user.createdAt).getTime()) / 86400000;
//       if (ageDays > NEW_USER_WINDOW_DAYS) {
//         markTourDone(userId); // existing user – don't bother them
//         return;
//       }
//     }
//     const t = setTimeout(() => start(0), 900);
//     return () => clearTimeout(t);
//   }, [userId, user?.createdAt, pathname, active, start]);

//   /* ---- manual restart ("Take a tour") ---- */
//   useEffect(() => {
//     const onStart = () => start(0);
//     window.addEventListener("vatup-tour:start", onStart);
//     return () => window.removeEventListener("vatup-tour:start", onStart);
//   }, [start]);

//   /* ---- navigate + open sidebar when step changes ---- */
//   useEffect(() => {
//     if (!step) return;
//     if (step.route && pathRef.current !== step.route) navigate(step.route);
//     const needSidebar = !!step.sidebar && window.innerWidth < 1024;
//     window.dispatchEvent(new CustomEvent("vatup-tour:sidebar", { detail: { open: needSidebar } }));
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [step?.id]);

//   /* ---- find & follow the target element ---- */
//   useEffect(() => {
//     if (!step?.target) return;
//     const stepId = step.id;
//     let raf;
//     let cancelled = false;
//     let scrolled = false;
//     let last = "";
//     const selector = `[data-tour="${step.target}"]`;

//     const tick = () => {
//       if (cancelled) return;
//       const el = document.querySelector(selector);
//       if (el) {
//         const r = el.getBoundingClientRect();
//         const ready = r.width > 0 && r.height > 0 && r.right > 8 && r.left < window.innerWidth;
//         if (ready) {
//           if (!scrolled) {
//             scrolled = true;
//             el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
//           }
//           // clip to the viewport so very tall elements still get a sensible spotlight
//           const top = Math.max(r.top, 0);
//           const bottom = Math.min(r.bottom, window.innerHeight);
//           const left = Math.max(r.left, 0);
//           const right = Math.min(r.right, window.innerWidth);
//           const next = { id: stepId, top, left, width: right - left, height: Math.max(bottom - top, 24) };
//           const key = `${next.top}|${next.left}|${next.width}|${next.height}`;
//           if (key !== last) {
//             last = key;
//             setRect(next);
//           }
//         }
//       }
//       raf = requestAnimationFrame(tick);
//     };
//     raf = requestAnimationFrame(tick);
//     return () => {
//       cancelled = true;
//       cancelAnimationFrame(raf);
//     };
//   }, [step?.id, step?.target]);

//   /* ---- viewport size ---- */
//   useEffect(() => {
//     if (!active) return;
//     const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, [active]);

//   /* ---- measure tooltip ---- */
//   const cardWidth = Math.min(380, vp.w - MARGIN * 2);
//   useLayoutEffect(() => {
//     if (!cardRef.current) return;
//     const h = cardRef.current.offsetHeight;
//     setSize((prev) => (prev.w === cardWidth && prev.h === h ? prev : { w: cardWidth, h }));
//   }, [step?.id, cardWidth, active]);

//   /* ---- navigation helpers ---- */
//   const next = useCallback(() => {
//     if (isLast) return finish();
//     goTo(index + 1);
//   }, [isLast, finish, goTo, index]);
//   const prev = useCallback(() => {
//     if (!isFirst) goTo(index - 1);
//   }, [isFirst, goTo, index]);

//   /* ---- keyboard ---- */
//   useEffect(() => {
//     if (!active) return;
//     const onKey = (e) => {
//       if (e.key === "Escape") finish();
//       else if (e.key === "ArrowRight" || e.key === "Enter") next();
//       else if (e.key === "ArrowLeft") prev();
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [active, finish, next, prev]);

//   if (!active || !step) return null;

//   const hasTarget = !!step.target;
//   const spot = hasTarget && rect?.id === step.id ? rect : null;
//   const layout = spot ? computeLayout(spot, { w: cardWidth, h: size.h }, vp.w, vp.h) : null;

//   const cardStyle = layout
//     ? { left: layout.left, top: layout.top, width: cardWidth }
//     : {
//         left: Math.max(MARGIN, (vp.w - cardWidth) / 2),
//         top: Math.max(MARGIN, (vp.h - size.h) / 2),
//         width: cardWidth,
//       };

//   const Icon = step.icon;
//   const progress = ((index + 1) / steps.length) * 100;
//   const cta = isLast && step.cta && (!step.cta.roles || step.cta.roles.includes(role)) ? step.cta : null;

//   return createPortal(
//     <>
//       <style>{CSS}</style>

//       {/* click blocker + dim layer (used for centered steps / while loading) */}
//       <div
//         className="fixed inset-0 z-[9997]"
//         style={{
//           background: spot ? "transparent" : "rgba(2,9,11,.74)",
//           backdropFilter: spot ? "none" : "blur(3px)",
//           transition: "background .3s",
//         }}
//         onClick={(e) => e.stopPropagation()}
//         aria-hidden="true"
//       />

//       {/* spotlight */}
//       {spot && (
//         <div
//           className="vt-spot"
//           style={{
//             top: layout.hole.top,
//             left: layout.hole.left,
//             width: layout.hole.width,
//             height: layout.hole.height,
//           }}
//         />
//       )}

//       {/* bouncing arrow */}
//       {layout?.showArrow && <ArrowPointer key={step.id} arrow={layout.arrow} />}

//       {/* tooltip card */}
//       <div ref={cardRef} className="vt-card" style={cardStyle} role="dialog" aria-modal="true" aria-label={step.title}>
//         <div className="vt-inner relative overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-black/40">
//           {/* progress bar */}
//           <div className="h-1.5 w-full bg-gray-100">
//             <div
//               className="h-full rounded-r-full bg-gradient-to-r from-[#25D366] to-[#128C7E]"
//               style={{ width: `${progress}%`, transition: "width .5s cubic-bezier(.22,1,.36,1)" }}
//             />
//           </div>

//           {step.finish && <Confetti />}

//           <div className="p-5">
//             {step.welcome && <WelcomeHero />}

//             <div className="flex items-start gap-3">
//               {!step.welcome && (
//                 <span
//                   className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
//                   style={{ background: step.color }}
//                 >
//                   <Icon size={22} />
//                 </span>
//               )}
//               <div className={`min-w-0 flex-1 ${step.welcome ? "text-center" : ""}`}>
//                 <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
//                   Step {index + 1} of {steps.length}
//                 </p>
//                 <h3 className="mt-0.5 text-lg font-bold leading-snug text-gray-900">{step.title}</h3>
//               </div>
//               {!step.welcome && (
//                 <button
//                   type="button"
//                   onClick={() => finish()}
//                   aria-label="Close tour"
//                   className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
//                 >
//                   <X size={18} />
//                 </button>
//               )}
//             </div>

//             <p className={`mt-3 text-sm leading-relaxed text-gray-600 ${step.welcome ? "text-center" : ""}`}>
//               {step.body}
//             </p>

//             {step.chips && (
//               <div className="mt-3 flex flex-wrap gap-2">
//                 {step.chips.map((c) => {
//                   const ChipIcon = c.icon;
//                   return (
//                     <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
//                       <ChipIcon size={13} style={{ color: c.color }} />
//                       {c.label}
//                     </span>
//                   );
//                 })}
//               </div>
//             )}

//             {/* dots */}
//             <div className="mt-4 flex items-center justify-center gap-1.5">
//               {steps.map((s, i) => (
//                 <button
//                   key={s.id}
//                   type="button"
//                   onClick={() => goTo(i)}
//                   aria-label={`Go to step ${i + 1}`}
//                   className="h-1.5 rounded-full transition-all duration-300"
//                   style={{ width: i === index ? 22 : 6, background: i === index ? "#25D366" : "#D1D5DB" }}
//                 />
//               ))}
//             </div>

//             {/* actions */}
//             <div className="mt-4 flex items-center justify-between gap-2">
//               {!isLast ? (
//                 <button type="button" onClick={() => finish()} className="text-sm font-medium text-gray-400 transition hover:text-gray-700">
//                   Skip tour
//                 </button>
//               ) : (
//                 <span />
//               )}

//               <div className="flex items-center gap-2">
//                 {!isFirst && (
//                   <button
//                     type="button"
//                     onClick={prev}
//                     className="inline-flex h-10 items-center gap-1 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
//                   >
//                     <ArrowLeft size={16} /> Back
//                   </button>
//                 )}

//                 {cta && (
//                   <button
//                     type="button"
//                     onClick={() => finish(cta.route)}
//                     className="relative inline-flex h-10 items-center gap-1.5 overflow-hidden rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-black shadow-md shadow-[#25D366]/30 transition hover:bg-[#1fb757]"
//                   >
//                     <span className="vt-btn-shine absolute inset-0" />
//                     <span className="relative flex items-center gap-1.5">
//                       {cta.label} <ArrowRight size={16} />
//                     </span>
//                   </button>
//                 )}

//                 {!cta && (
//                   <button
//                     type="button"
//                     onClick={next}
//                     className="relative inline-flex h-10 items-center gap-1.5 overflow-hidden rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-black shadow-md shadow-[#25D366]/30 transition hover:bg-[#1fb757]"
//                   >
//                     <span className="vt-btn-shine absolute inset-0" />
//                     <span className="relative flex items-center gap-1.5">
//                       {isLast ? "Finish" : isFirst ? "Start tour" : "Next"} <ArrowRight size={16} />
//                     </span>
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>,
//     document.body
//   );
// }





// src/components/tour/ProductTour.jsx
// Animated onboarding tour: spotlight + bouncing arrow + glide-in tooltip.
// No extra npm packages needed.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaInstagram } from "react-icons/fa";
import { useAuthStore } from "../../store/authStore";
import { useTourStore, isTourDone, markTourDone, markTourSeenOnServer } from "../../store/tourStore";
import { tourSteps } from "../../config/tourSteps";

const PAD = 8; // space around the highlighted element
const GAP = 70; // room between element and tooltip (the arrow lives here)
const MARGIN = 12; // minimum distance from screen edges
const ARROW = 46;
const NEW_USER_WINDOW_DAYS = 30; // only auto-start for accounts newer than this

const clamp = (v, min, max) => Math.max(min, Math.min(v, max));

/* ---------------------------------------------------------------- layout */
function computeLayout(rect, size, vw, vh) {
  const hole = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };
  hole.right = hole.left + hole.width;
  hole.bottom = hole.top + hole.height;

  const { w: tw, h: th } = size;
  const narrow = vw < 700;
  const fits = {
    right: !narrow && hole.right + GAP + tw <= vw - MARGIN,
    bottom: hole.bottom + GAP + th <= vh - MARGIN,
    top: hole.top - GAP - th >= MARGIN,
    left: !narrow && hole.left - GAP - tw >= MARGIN,
  };
  let side = ["right", "bottom", "top", "left"].find((s) => fits[s]);
  const hasRoom = !!side;
  if (!side) side = vh - hole.bottom >= hole.top ? "bottom" : "top";

  const cx = hole.left + hole.width / 2;
  const cy = hole.top + hole.height / 2;
  let left, top, arrow;

  if (side === "right") {
    left = hole.right + GAP;
    top = clamp(cy - th / 2, MARGIN, vh - th - MARGIN);
    arrow = { left: hole.right + 8, top: cy - ARROW / 2, rot: 0, bx: -10, by: 0 };
  } else if (side === "left") {
    left = hole.left - GAP - tw;
    top = clamp(cy - th / 2, MARGIN, vh - th - MARGIN);
    arrow = { left: hole.left - ARROW - 8, top: cy - ARROW / 2, rot: 180, bx: 10, by: 0 };
  } else if (side === "bottom") {
    left = clamp(cx - tw / 2, MARGIN, vw - tw - MARGIN);
    top = hasRoom ? hole.bottom + GAP : clamp(vh - th - MARGIN, MARGIN, vh);
    arrow = { left: cx - ARROW / 2, top: hole.bottom + 8, rot: 90, bx: 0, by: -10 };
  } else {
    left = clamp(cx - tw / 2, MARGIN, vw - tw - MARGIN);
    top = hasRoom ? hole.top - GAP - th : MARGIN;
    arrow = { left: cx - ARROW / 2, top: hole.top - ARROW - 8, rot: 270, bx: 0, by: 10 };
  }
  arrow.left = clamp(arrow.left, 4, vw - ARROW - 4);
  arrow.top = clamp(arrow.top, 4, vh - ARROW - 4);

  return { hole, left, top, side, arrow, showArrow: hasRoom };
}

/* ----------------------------------------------------------------- styles */
const CSS = `
@keyframes vt-pop { from { opacity:0; transform: translateY(10px) scale(.96);} to { opacity:1; transform:none;} }
@keyframes vt-ring { 0%{ transform:scale(1); opacity:.9;} 100%{ transform:scale(1.18); opacity:0;} }
@keyframes vt-bounce { 0%,100%{ transform:translate(0,0);} 50%{ transform:translate(var(--bx),var(--by));} }
@keyframes vt-arrow-in { from{ opacity:0; transform:scale(.4);} to{ opacity:1; transform:scale(1);} }
@keyframes vt-float { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-8px);} }
@keyframes vt-orbit { from{ transform:rotate(0deg) translateX(58px) rotate(0deg);} to{ transform:rotate(360deg) translateX(58px) rotate(-360deg);} }
@keyframes vt-confetti { 0%{ transform:translate(0,0) rotate(0); opacity:1;} 100%{ transform:translate(var(--cx),var(--cy)) rotate(var(--cr)); opacity:0;} }
@keyframes vt-shine { 0%{ background-position:-200% 0;} 100%{ background-position:200% 0;} }
.vt-spot{ position:fixed; z-index:9998; pointer-events:none; border-radius:14px;
  box-shadow:0 0 0 9999px rgba(2,9,11,.74);
  transition:top .45s cubic-bezier(.22,1,.36,1),left .45s cubic-bezier(.22,1,.36,1),width .45s cubic-bezier(.22,1,.36,1),height .45s cubic-bezier(.22,1,.36,1),opacity .3s; }
.vt-spot::before{ content:""; position:absolute; inset:-3px; border-radius:16px; border:2px solid #25D366; animation:vt-ring 1.7s ease-out infinite; }
.vt-spot::after{ content:""; position:absolute; inset:0; border-radius:14px; border:2px solid #25D366; box-shadow:0 0 22px rgba(37,211,102,.55) inset,0 0 22px rgba(37,211,102,.45); }
.vt-card{ position:fixed; z-index:10000; transition:top .5s cubic-bezier(.22,1,.36,1),left .5s cubic-bezier(.22,1,.36,1),opacity .3s; }
.vt-inner{ animation:vt-pop .45s cubic-bezier(.22,1,.36,1) both; }
.vt-arrow{ position:fixed; z-index:10001; pointer-events:none; animation:vt-arrow-in .4s .15s cubic-bezier(.22,1,.36,1) both; transition:top .45s cubic-bezier(.22,1,.36,1),left .45s cubic-bezier(.22,1,.36,1); }
.vt-arrow > div{ animation:vt-bounce .9s ease-in-out infinite; filter:drop-shadow(0 4px 8px rgba(0,0,0,.45)); }
.vt-float{ animation:vt-float 3s ease-in-out infinite; }
.vt-btn-shine{ background-image:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%); background-size:200% 100%; animation:vt-shine 2.4s linear infinite; }
@media (prefers-reduced-motion: reduce){
  .vt-spot,.vt-spot::before,.vt-card,.vt-inner,.vt-arrow,.vt-arrow>div,.vt-float,.vt-btn-shine,.vt-orbit,.vt-confetti{ animation:none !important; transition:none !important; }
}
`;

/* ------------------------------------------------------------- sub-views */
function ArrowPointer({ arrow }) {
  return (
    <div
      className="vt-arrow"
      style={{ left: arrow.left, top: arrow.top, width: ARROW, height: ARROW, "--bx": `${arrow.bx}px`, "--by": `${arrow.by}px` }}
    >
      <div style={{ width: ARROW, height: ARROW, transform: `rotate(${arrow.rot}deg)` }}>
        <svg viewBox="0 0 48 48" width={ARROW} height={ARROW} fill="none">
          <path d="M6 24 22 8v10h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H22v10L6 24Z" fill="#25D366" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function WelcomeHero() {
  return (
    <div className="relative mx-auto mb-4 flex h-32 w-32 items-center justify-center">
      <span className="vt-orbit absolute left-1/2 top-1/2 -ml-4 -mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md" style={{ animation: "vt-orbit 6s linear infinite" }}>
        <FaFacebook className="text-[#1877F2]" size={18} />
      </span>
      <span className="vt-orbit absolute left-1/2 top-1/2 -ml-4 -mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md" style={{ animation: "vt-orbit 6s linear infinite", animationDelay: "-3s" }}>
        <FaInstagram className="text-[#E1306C]" size={18} />
      </span>
      <div className="vt-float flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-lg shadow-[#25D366]/40">
        <FaWhatsapp className="text-white" size={44} />
      </div>
    </div>
  );
}

const CONFETTI = Array.from({ length: 22 }, (_, i) => ({
  cx: `${Math.round(Math.cos((i / 22) * Math.PI * 2) * (90 + (i % 5) * 18))}px`,
  cy: `${Math.round(Math.sin((i / 22) * Math.PI * 2) * (70 + (i % 4) * 16)) - 20}px`,
  cr: `${(i * 67) % 360}deg`,
  color: ["#25D366", "#128C7E", "#F59E0B", "#1877F2", "#E1306C", "#8B5CF6"][i % 6],
  delay: `${(i % 6) * 0.04}s`,
}));

function Confetti() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-12 h-0 w-0">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className="vt-confetti absolute block h-2 w-2 rounded-sm"
          style={{ background: c.color, "--cx": c.cx, "--cy": c.cy, "--cr": c.cr, animation: `vt-confetti 1.2s ${c.delay} ease-out both` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- component */
export default function ProductTour() {
  const user = useAuthStore((s) => s.user);
  const { active, index, start, goTo, stop } = useTourStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  const userId = user?.id ?? user?._id ?? user?.email;
  const role = user?.role;

  const steps = useMemo(
    () => tourSteps.filter((s) => !s.roles || s.roles.includes(role)),
    [role]
  );
  const step = active ? steps[index] : null;
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const [rect, setRect] = useState(null);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [size, setSize] = useState({ w: 380, h: 240 });
  const cardRef = useRef(null);

  const closeSidebar = () =>
    window.dispatchEvent(new CustomEvent("vatup-tour:sidebar", { detail: { open: false } }));

  /* ---- finish / skip ---- */
  const finish = useCallback(
    (goToRoute) => {
      if (userId) markTourDone(userId);
      markTourSeenOnServer(); // NEW: remember on the account
      stop();
      closeSidebar();
      if (goToRoute) navigate(goToRoute);
    },
    [userId, stop, navigate]
  );

  /* ---- auto-start for new users ---- */
  useEffect(() => {
    if (!userId || active) return;
    if (pathname === "/change-password") return; // wait until password is changed
    // NEW: the account already saw the guide (on any browser)
    if (user?.tourSeenAt) return;

    if (isTourDone(userId)) {
      markTourSeenOnServer(); // NEW: this browser saw it - save it on the account too
      return;
    }

    if (user?.createdAt) {
      const ageDays = (Date.now() - new Date(user.createdAt).getTime()) / 86400000;
      if (ageDays > NEW_USER_WINDOW_DAYS) {
        markTourDone(userId); // existing user – don't bother them
        markTourSeenOnServer(); // NEW
        return;
      }
    }
    const t = setTimeout(() => start(0), 900);
    return () => clearTimeout(t);
  }, [userId, user?.createdAt, user?.tourSeenAt, pathname, active, start]);

  /* ---- manual restart ("Take a tour") ---- */
  useEffect(() => {
    const onStart = () => start(0);
    window.addEventListener("vatup-tour:start", onStart);
    return () => window.removeEventListener("vatup-tour:start", onStart);
  }, [start]);

  /* ---- navigate + open sidebar when step changes ---- */
  useEffect(() => {
    if (!step) return;
    if (step.route && pathRef.current !== step.route) navigate(step.route);
    const needSidebar = !!step.sidebar && window.innerWidth < 1024;
    window.dispatchEvent(new CustomEvent("vatup-tour:sidebar", { detail: { open: needSidebar } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  /* ---- find & follow the target element ---- */
  useEffect(() => {
    if (!step?.target) return;
    const stepId = step.id;
    let raf;
    let cancelled = false;
    let scrolled = false;
    let last = "";
    const selector = `[data-tour="${step.target}"]`;

    const tick = () => {
      if (cancelled) return;
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        const ready = r.width > 0 && r.height > 0 && r.right > 8 && r.left < window.innerWidth;
        if (ready) {
          if (!scrolled) {
            scrolled = true;
            el.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
          }
          // clip to the viewport so very tall elements still get a sensible spotlight
          const top = Math.max(r.top, 0);
          const bottom = Math.min(r.bottom, window.innerHeight);
          const left = Math.max(r.left, 0);
          const right = Math.min(r.right, window.innerWidth);
          const next = { id: stepId, top, left, width: right - left, height: Math.max(bottom - top, 24) };
          const key = `${next.top}|${next.left}|${next.width}|${next.height}`;
          if (key !== last) {
            last = key;
            setRect(next);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [step?.id, step?.target]);

  /* ---- viewport size ---- */
  useEffect(() => {
    if (!active) return;
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  /* ---- measure tooltip ---- */
  const cardWidth = Math.min(380, vp.w - MARGIN * 2);
  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const h = cardRef.current.offsetHeight;
    setSize((prev) => (prev.w === cardWidth && prev.h === h ? prev : { w: cardWidth, h }));
  }, [step?.id, cardWidth, active]);

  /* ---- navigation helpers ---- */
  const next = useCallback(() => {
    if (isLast) return finish();
    goTo(index + 1);
  }, [isLast, finish, goTo, index]);
  const prev = useCallback(() => {
    if (!isFirst) goTo(index - 1);
  }, [isFirst, goTo, index]);

  /* ---- keyboard ---- */
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish, next, prev]);

  if (!active || !step) return null;

  const hasTarget = !!step.target;
  const spot = hasTarget && rect?.id === step.id ? rect : null;
  const layout = spot ? computeLayout(spot, { w: cardWidth, h: size.h }, vp.w, vp.h) : null;

  const cardStyle = layout
    ? { left: layout.left, top: layout.top, width: cardWidth }
    : {
        left: Math.max(MARGIN, (vp.w - cardWidth) / 2),
        top: Math.max(MARGIN, (vp.h - size.h) / 2),
        width: cardWidth,
      };

  const Icon = step.icon;
  const progress = ((index + 1) / steps.length) * 100;
  const cta = isLast && step.cta && (!step.cta.roles || step.cta.roles.includes(role)) ? step.cta : null;

  return createPortal(
    <>
      <style>{CSS}</style>

      {/* click blocker + dim layer (used for centered steps / while loading) */}
      <div
        className="fixed inset-0 z-[9997]"
        style={{
          background: spot ? "transparent" : "rgba(2,9,11,.74)",
          backdropFilter: spot ? "none" : "blur(3px)",
          transition: "background .3s",
        }}
        onClick={(e) => e.stopPropagation()}
        aria-hidden="true"
      />

      {/* spotlight */}
      {spot && (
        <div
          className="vt-spot"
          style={{
            top: layout.hole.top,
            left: layout.hole.left,
            width: layout.hole.width,
            height: layout.hole.height,
          }}
        />
      )}

      {/* bouncing arrow */}
      {layout?.showArrow && <ArrowPointer key={step.id} arrow={layout.arrow} />}

      {/* tooltip card */}
      <div ref={cardRef} className="vt-card" style={cardStyle} role="dialog" aria-modal="true" aria-label={step.title}>
        <div className="vt-inner relative overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-black/40">
          {/* progress bar */}
          <div className="h-1.5 w-full bg-gray-100">
            <div
              className="h-full rounded-r-full bg-gradient-to-r from-[#25D366] to-[#128C7E]"
              style={{ width: `${progress}%`, transition: "width .5s cubic-bezier(.22,1,.36,1)" }}
            />
          </div>

          {step.finish && <Confetti />}

          <div className="p-5">
            {step.welcome && <WelcomeHero />}

            <div className="flex items-start gap-3">
              {!step.welcome && (
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                  style={{ background: step.color }}
                >
                  <Icon size={22} />
                </span>
              )}
              <div className={`min-w-0 flex-1 ${step.welcome ? "text-center" : ""}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Step {index + 1} of {steps.length}
                </p>
                <h3 className="mt-0.5 text-lg font-bold leading-snug text-gray-900">{step.title}</h3>
              </div>
              {!step.welcome && (
                <button
                  type="button"
                  onClick={() => finish()}
                  aria-label="Close tour"
                  className="-mr-1 -mt-1 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <p className={`mt-3 text-sm leading-relaxed text-gray-600 ${step.welcome ? "text-center" : ""}`}>
              {step.body}
            </p>

            {step.chips && (
              <div className="mt-3 flex flex-wrap gap-2">
                {step.chips.map((c) => {
                  const ChipIcon = c.icon;
                  return (
                    <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      <ChipIcon size={13} style={{ color: c.color }} />
                      {c.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* dots */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: i === index ? 22 : 6, background: i === index ? "#25D366" : "#D1D5DB" }}
                />
              ))}
            </div>

            {/* actions */}
            <div className="mt-4 flex items-center justify-between gap-2">
              {!isLast ? (
                <button type="button" onClick={() => finish()} className="text-sm font-medium text-gray-400 transition hover:text-gray-700">
                  Skip tour
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={prev}
                    className="inline-flex h-10 items-center gap-1 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                )}

                {cta && (
                  <button
                    type="button"
                    onClick={() => finish(cta.route)}
                    className="relative inline-flex h-10 items-center gap-1.5 overflow-hidden rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-black shadow-md shadow-[#25D366]/30 transition hover:bg-[#1fb757]"
                  >
                    <span className="vt-btn-shine absolute inset-0" />
                    <span className="relative flex items-center gap-1.5">
                      {cta.label} <ArrowRight size={16} />
                    </span>
                  </button>
                )}

                {!cta && (
                  <button
                    type="button"
                    onClick={next}
                    className="relative inline-flex h-10 items-center gap-1.5 overflow-hidden rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-black shadow-md shadow-[#25D366]/30 transition hover:bg-[#1fb757]"
                  >
                    <span className="vt-btn-shine absolute inset-0" />
                    <span className="relative flex items-center gap-1.5">
                      {isLast ? "Finish" : isFirst ? "Start tour" : "Next"} <ArrowRight size={16} />
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
