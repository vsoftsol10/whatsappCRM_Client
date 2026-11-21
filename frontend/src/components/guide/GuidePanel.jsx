
// // src/components/guide/GuidePanel.jsx
// //
// // The "Your ___ Space Start Here" panel: video + "In this video" checklist.
// //
// //  variant "page"  : shown in place of a module on the first visit.
// //                    Has a Skip button.
// //  variant "modal" : shown when the user clicks the guide icon in the header.
// //                    Has a close (X) button.
// //  embedded        : the compact first-visit screen (see ModuleGuideGate). Exact
// //                    sizes from the design: no Skip / close button, no page wrapper.
// import { useState } from "react";
// import { ArrowRight, CircleCheck, CirclePlay, Play, X } from "lucide-react";

// export default function GuidePanel({
//   module,
//   video,
//   variant = "page",
//   primaryLabel,
//   onPrimary,
//   onSkip,
//   onClose,
//   embedded = false,
// }) {
//   const [playing, setPlaying] = useState(false);
//   const [thumbFailed, setThumbFailed] = useState(false);

//   const isModal = variant === "modal";
//   const Icon = module.icon;
//   const from = module.start || video.start || 0;

//   const embedSrc = `https://www.youtube.com/embed/${video.id}?rel=0&autoplay=1${
//     from ? `&start=${from}` : ""
//   }`;

//   const videoFrame = (
//     <iframe
//       className="h-full w-full"
//       src={embedSrc}
//       title={`${module.name} guide`}
//       frameBorder="0"
//       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
//       referrerPolicy="strict-origin-when-cross-origin"
//       allowFullScreen
//     />
//   );

//   const thumbnail = (playIcon) => (
//     <button
//       type="button"
//       onClick={() => setPlaying(true)}
//       aria-label={`Play the ${module.name} guide video`}
//       className="group relative flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-400"
//     >
//       {!thumbFailed && (
//         <img
//           src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
//           alt=""
//           loading="lazy"
//           onError={() => setThumbFailed(true)}
//           className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
//         />
//       )}

//       {playIcon}
//     </button>
//   );

//   // ------------------------------------------------------------------
//   // COMPACT FIRST-VISIT LAYOUT (exact sizes from the design)
//   // ------------------------------------------------------------------
//   if (embedded) {
//     return (
//       <div className="w-full max-w-[1020px] pl-5">
//         {/* icon + title + summary */}
//         <div className="flex items-center gap-2.5">
//           <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-900">
//             <Icon size={28} strokeWidth={1.8} />
//           </span>

//           <div className="min-w-0">
//             <h2 className="text-[19px] font-bold leading-6 tracking-tight text-[#0F1B3D]">
//               Your {module.name} Space Start Here
//             </h2>
//             <p className="mt-1 text-[14px] leading-5 text-[#5F6F8F]">
//               {module.summary}
//             </p>
//           </div>
//         </div>

//         {/* video + what's in it */}
//         <div className="mt-[52px] grid items-center gap-[38px] sm:ml-[64px] lg:grid-cols-[400px_minmax(0,470px)]">
//           <div className="aspect-[400/282] w-full max-w-[400px] overflow-hidden rounded-[22px] bg-slate-900 shadow-[0_12px_32px_rgba(15,23,42,0.16)]">
//             {playing
//               ? videoFrame
//               : thumbnail(
//                   <span className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#22C55E] text-white shadow-md ring-[7px] ring-white/25 transition group-hover:scale-105">
//                     <Play size={30} fill="none" strokeWidth={1.8} className="ml-1" />
//                   </span>
//                 )}
//           </div>

//           <div className="min-w-0">
//             <p className="text-[16px] font-medium leading-6 text-[#0F1B3D]">
//               {module.summary}
//             </p>

//             <p className="mt-3.5 text-[14px] leading-5 text-slate-400">
//               In this video
//             </p>

//             <ul className="mt-4 space-y-3">
//               {module.points.map((point) => (
//                 <li
//                   key={point}
//                   className="flex items-center gap-2 text-[15px] leading-6 text-slate-700"
//                 >
//                   <CircleCheck
//                     size={19}
//                     strokeWidth={1.8}
//                     className="shrink-0 text-green-600"
//                   />
//                   <span>{point}</span>
//                 </li>
//               ))}
//             </ul>

//             <div className="mt-9 flex flex-wrap items-center gap-2.5 pl-2.5">
//               <button
//                 type="button"
//                 onClick={onPrimary}
//                 className="inline-flex h-11 min-w-[140px] items-center justify-center rounded-xl bg-[#22C55E] px-5 text-[14px] font-bold text-white transition hover:bg-green-600"
//               >
//                 {primaryLabel}
//               </button>

//               <button
//                 type="button"
//                 onClick={() => setPlaying(true)}
//                 disabled={playing}
//                 className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#22C55E] bg-white px-4 text-[14px] font-bold text-green-700 transition hover:bg-green-50 disabled:opacity-60"
//               >
//                 <CirclePlay size={17} />
//                 Explore How its work
//                 <ArrowRight size={17} />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const body = (
//     <div className="mx-auto w-full max-w-6xl">
//       {/* Title + Skip / Close */}
//       <div className="flex items-start justify-between gap-4">
//         <div className="flex min-w-0 items-center gap-4">
//           <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-900">
//             <Icon size={26} strokeWidth={1.8} />
//           </span>

//           <div className="min-w-0">
//             <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
//               Your {module.name} Space Start Here
//             </h1>
//             <p className="mt-1 text-sm text-slate-500 sm:text-base">{module.summary}</p>
//           </div>
//         </div>

//         {isModal ? (
//           <button
//             type="button"
//             onClick={onClose}
//             aria-label="Close guide"
//             title="Close"
//             className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
//           >
//             <X size={18} />
//           </button>
//         ) : (
//           <button
//             type="button"
//             onClick={onSkip}
//             title="Skip this guide"
//             className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
//           >
//             Skip
//             <X size={15} />
//           </button>
//         )}
//       </div>

//       <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
//         {/* Video */}
//         <div className="aspect-video w-full overflow-hidden rounded-3xl bg-slate-900 shadow-xl ring-1 ring-slate-900/10">
//           {playing
//             ? videoFrame
//             : thumbnail(
//                 <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-lg ring-8 ring-white/30 transition group-hover:scale-105 group-hover:bg-green-600">
//                   <Play size={34} fill="currentColor" className="ml-1" />
//                 </span>
//               )}
//         </div>

//         {/* What's in the video */}
//         <div className="min-w-0">
//           <p className="text-lg font-medium text-slate-900">{module.summary}</p>

//           <p className="mt-5 text-base text-slate-500">In this video</p>

//           <ul className="mt-4 space-y-3.5">
//             {module.points.map((point) => (
//               <li key={point} className="flex items-start gap-3 text-base text-slate-700">
//                 <CircleCheck size={22} strokeWidth={1.7} className="mt-px shrink-0 text-green-600" />
//                 <span>{point}</span>
//               </li>
//             ))}
//           </ul>

//           <div className="mt-8 flex flex-wrap items-center gap-3">
//             <button
//               type="button"
//               onClick={onPrimary}
//               className="inline-flex h-12 items-center justify-center rounded-xl bg-green-500 px-6 text-sm font-semibold text-white transition hover:bg-green-600"
//             >
//               {primaryLabel}
//             </button>

//             <button
//               type="button"
//               onClick={() => setPlaying(true)}
//               disabled={playing}
//               className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl border border-green-500 bg-white px-5 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-60"
//             >
//               <CirclePlay size={18} />
//               Explore how it works
//               <ArrowRight size={16} />
//             </button>
//           </div>

//           {!isModal && (
//             <p className="mt-5 text-sm text-slate-500">
//               Need it later? Click the <b className="font-semibold text-slate-700">?</b> icon at the
//               top of the page to open this guide again.
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );

//   return isModal ? body : <div className="crm-page">{body}</div>;
// }



// src/components/guide/GuidePanel.jsx
//
// The "Your ___ Space Start Here" panel: video + "In this video" checklist.
//
//  variant "page"  : shown in place of a module on the first visit.
//                    Has a Skip button.
//  variant "modal" : shown when the user clicks the guide icon in the header.
//                    Has a close (X) button.
//  embedded        : the compact first-visit screen (see ModuleGuideGate). Exact
//                    sizes from the design: no Skip / close button, no page wrapper.
import { useState } from "react";
import { ArrowRight, CircleCheck, CirclePlay, Play, X } from "lucide-react";

export default function GuidePanel({
  module,
  video,
  variant = "page",
  primaryLabel,
  onPrimary,
  onSkip,
  onClose,
  embedded = false,
}) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const isModal = variant === "modal";
  const Icon = module.icon;
  const from = module.start || video.start || 0;

  const embedSrc = `https://www.youtube.com/embed/${video.id}?rel=0&autoplay=1${
    from ? `&start=${from}` : ""
  }`;

  const videoFrame = (
    <iframe
      className="h-full w-full"
      src={embedSrc}
      title={`${module.name} guide`}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );

  const thumbnail = (playIcon) => (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play the ${module.name} guide video`}
      className="group relative flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-400"
    >
      {!thumbFailed && (
        <img
          src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          onError={() => setThumbFailed(true)}
          className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
        />
      )}

      {playIcon}
    </button>
  );

  // ------------------------------------------------------------------
  // COMPACT FIRST-VISIT LAYOUT (exact sizes from the design)
  // ------------------------------------------------------------------
  if (embedded) {
    return (
      <div className="w-full max-w-[1020px] pl-5">
        {/* icon + title + summary */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-900">
            <Icon size={28} strokeWidth={1.8} />
          </span>

          <div className="min-w-0">
            <h2 className="text-[19px] font-bold leading-6 tracking-tight text-[#0F1B3D]">
              Your {module.name} Space Start Here
            </h2>
            <p className="mt-1 text-[14px] leading-5 text-[#5F6F8F]">
              {module.summary}
            </p>
          </div>
        </div>

        {/* video + what's in it */}
        <div className="mt-9 grid items-center gap-[38px] sm:ml-[64px] lg:grid-cols-[auto_minmax(0,470px)]">
          {/* 400px wide, but shrinks on short screens so the page never scrolls */}
          <div
            style={{ width: "min(100%, 400px, max(240px, calc((100vh - 420px) * 1.418)))" }}
            className="aspect-[400/282] overflow-hidden rounded-[22px] bg-slate-900 shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
          >
            {playing
              ? videoFrame
              : thumbnail(
                  <span className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#22C55E] text-white shadow-md ring-[7px] ring-white/25 transition group-hover:scale-105">
                    <Play size={30} fill="none" strokeWidth={1.8} className="ml-1" />
                  </span>
                )}
          </div>

          <div className="min-w-0">
            <p className="text-[16px] font-medium leading-6 text-[#0F1B3D]">
              {module.summary}
            </p>

            <p className="mt-3.5 text-[14px] leading-5 text-slate-400">
              In this video
            </p>

            <ul className="mt-4 space-y-3">
              {module.points.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2 text-[15px] leading-6 text-slate-700"
                >
                  <CircleCheck
                    size={19}
                    strokeWidth={1.8}
                    className="shrink-0 text-green-600"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-2.5 pl-2.5">
              <button
                type="button"
                onClick={onPrimary}
                className="inline-flex h-11 min-w-[140px] items-center justify-center rounded-xl bg-[#22C55E] px-5 text-[14px] font-bold text-white transition hover:bg-green-600"
              >
                {primaryLabel}
              </button>

              <button
                type="button"
                onClick={() => setPlaying(true)}
                disabled={playing}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#22C55E] bg-white px-4 text-[14px] font-bold text-green-700 transition hover:bg-green-50 disabled:opacity-60"
              >
                <CirclePlay size={17} />
                Explore How its work
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const body = (
    <div className="mx-auto w-full max-w-6xl">
      {/* Title + Skip / Close */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-900">
            <Icon size={26} strokeWidth={1.8} />
          </span>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Your {module.name} Space Start Here
            </h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">{module.summary}</p>
          </div>
        </div>

        {isModal ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close guide"
            title="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <X size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSkip}
            title="Skip this guide"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Skip
            <X size={15} />
          </button>
        )}
      </div>

      <div className="mt-8 grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
        {/* Video */}
        <div className="aspect-video w-full overflow-hidden rounded-3xl bg-slate-900 shadow-xl ring-1 ring-slate-900/10">
          {playing
            ? videoFrame
            : thumbnail(
                <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-lg ring-8 ring-white/30 transition group-hover:scale-105 group-hover:bg-green-600">
                  <Play size={34} fill="currentColor" className="ml-1" />
                </span>
              )}
        </div>

        {/* What's in the video */}
        <div className="min-w-0">
          <p className="text-lg font-medium text-slate-900">{module.summary}</p>

          <p className="mt-5 text-base text-slate-500">In this video</p>

          <ul className="mt-4 space-y-3.5">
            {module.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-base text-slate-700">
                <CircleCheck size={22} strokeWidth={1.7} className="mt-px shrink-0 text-green-600" />
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onPrimary}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-green-500 px-6 text-sm font-semibold text-white transition hover:bg-green-600"
            >
              {primaryLabel}
            </button>

            <button
              type="button"
              onClick={() => setPlaying(true)}
              disabled={playing}
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl border border-green-500 bg-white px-5 text-sm font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-60"
            >
              <CirclePlay size={18} />
              Explore how it works
              <ArrowRight size={16} />
            </button>
          </div>

          {!isModal && (
            <p className="mt-5 text-sm text-slate-500">
              Need it later? Click the <b className="font-semibold text-slate-700">?</b> icon at the
              top of the page to open this guide again.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return isModal ? body : <div className="crm-page">{body}</div>;
}
