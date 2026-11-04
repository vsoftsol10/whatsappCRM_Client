// // src/pages/settings/UserGuide.jsx
// //
// // Settings -> User Guide
// // A simple list of modules. Click a module to open it and see its YouTube
// // video and a short description. Content comes from src/data/userGuide.js.
// import { useEffect, useMemo, useState } from "react";
// import { Link, useSearchParams } from "react-router-dom";
// import { BookOpen, ChevronDown, PlayCircle, Search, ArrowRight } from "lucide-react";
// import { useAuthStore } from "../../store/authStore";
// import { userGuideModules } from "../../data/userGuide";

// /* ---------------------------------------------------------------------
//    Accepts a YouTube <iframe> code, a normal link, a youtu.be link or just
//    the 11-character video ID, and returns { id, start }.
// --------------------------------------------------------------------- */
// function parseYouTube(input) {
//   const text = String(input || "").trim().replace(/&amp;/g, "&");
//   if (!text) return null;

//   const srcMatch = text.match(/src=["']([^"']+)["']/i);
//   const url = srcMatch ? srcMatch[1] : text;

//   const idMatch = url.match(
//     /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|watch\?(?:[^#\s]*&)?v=))([A-Za-z0-9_-]{11})/
//   );
//   const id = idMatch ? idMatch[1] : /^[A-Za-z0-9_-]{11}$/.test(url) ? url : null;
//   if (!id) return null;

//   const timeMatch = url.match(/[?&](?:start|t)=(\d+)/);
//   return { id, start: timeMatch ? Number(timeMatch[1]) : 0 };
// }

// /* ---------------- YouTube player ---------------- */
// function VideoPlayer({ video, start, title }) {
//   const parsed = useMemo(() => parseYouTube(video), [video]);

//   if (!parsed) {
//     return (
//       <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
//         <PlayCircle size={42} strokeWidth={1.5} />
//         <p className="mt-2 text-sm font-semibold">Video coming soon</p>
//       </div>
//     );
//   }

//   const from = start || parsed.start || 0;
//   const src = `https://www.youtube.com/embed/${parsed.id}?rel=0${from ? `&start=${from}` : ""}`;

//   return (
//     <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-slate-900/10">
//       <iframe
//         className="h-full w-full"
//         src={src}
//         title={title}
//         frameBorder="0"
//         loading="lazy"
//         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
//         referrerPolicy="strict-origin-when-cross-origin"
//         allowFullScreen
//       />
//     </div>
//   );
// }

// /* ---------------- One module row ---------------- */
// function ModuleItem({ module, open, onToggle, hasVideo }) {
//   const Icon = module.icon;
//   const panelId = `guide-panel-${module.id}`;

//   return (
//     <div
//       id={`guide-${module.id}`}
//       className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white transition-shadow ${
//         open ? "border-green-300 shadow-md" : "border-slate-200 shadow-sm hover:shadow-md"
//       }`}
//     >
//       <button
//         type="button"
//         onClick={onToggle}
//         aria-expanded={open}
//         aria-controls={panelId}
//         className="flex w-full items-center gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500/60"
//       >
//         <span
//           className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
//             open ? "bg-green-600 text-white" : "bg-green-50 text-green-700"
//           }`}
//         >
//           <Icon size={20} strokeWidth={1.9} />
//         </span>

//         <span className="min-w-0 flex-1">
//           <span className="flex flex-wrap items-center gap-2">
//             <span className="text-base font-semibold text-slate-900">{module.name}</span>
//             {module.adminOnly && (
//               <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
//                 Admin
//               </span>
//             )}
//             {!hasVideo && (
//               <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
//                 Coming soon
//               </span>
//             )}
//           </span>
//           <span className="mt-0.5 block truncate text-sm text-slate-500">{module.summary}</span>
//         </span>

//         <ChevronDown
//           size={20}
//           className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
//         />
//       </button>

//       {open && (
//         <div id={panelId} className="border-t border-slate-100 px-5 pb-6 pt-5">
//           <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
//             <VideoPlayer video={module.video} start={module.start} title={`${module.name} guide`} />

//             <div className="flex flex-col">
//               <p className="text-[15px] leading-relaxed text-slate-700">{module.summary}</p>

//               <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
//                 In this video
//               </p>
//               <ul className="mt-2 space-y-2">
//                 {module.points.map((point) => (
//                   <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
//                     <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
//                     {point}
//                   </li>
//                 ))}
//               </ul>

//               <Link
//                 to={module.path}
//                 className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/60"
//               >
//                 Open {module.name}
//                 <ArrowRight size={16} />
//               </Link>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// /* ---------------- Page ---------------- */
// export default function UserGuide() {
//   const role = useAuthStore((state) => state.user?.role);
//   const [params] = useSearchParams();
//   const [query, setQuery] = useState("");
//   // ?module=customers opens that module straight away (for future "Help" buttons)
//   const [openId, setOpenId] = useState(params.get("module") || null);

//   const modules = useMemo(() => {
//     const q = query.trim().toLowerCase();
//     return userGuideModules
//       .filter((m) => !m.adminOnly || role === "ADMIN")
//       .filter(
//         (m) =>
//           !q ||
//           `${m.name} ${m.summary} ${m.keywords || ""} ${m.points.join(" ")}`
//             .toLowerCase()
//             .includes(q)
//       );
//   }, [query, role]);

//   // When opened from a link like ?module=customers, scroll that row into view
//   useEffect(() => {
//     const id = params.get("module");
//     if (!id) return;
//     const t = setTimeout(() => {
//       document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
//     }, 100);
//     return () => clearTimeout(t);
//   }, [params]);

//   return (
//     <div className="mx-auto w-full max-w-4xl">
//       <div className="flex items-center gap-3">
//         <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
//           <BookOpen size={22} strokeWidth={1.9} />
//         </span>
//         <div>
//           <h2 className="text-xl font-bold text-slate-900">User Guide</h2>
//           <p className="text-sm text-slate-500">
//             Have a doubt? Open a module to watch a short video and see how it works.
//           </p>
//         </div>
//       </div>

//       <div className="relative mt-5">
//         <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
//         <input
//           type="search"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder="Search a module or topic, e.g. import, template, backup"
//           className="h-12 w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 text-[15px] text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
//         />
//       </div>

//       <div className="mt-5 space-y-3">
//         {modules.map((m) => (
//           <ModuleItem
//             key={m.id}
//             module={m}
//             hasVideo={Boolean(parseYouTube(m.video))}
//             open={openId === m.id}
//             onToggle={() => setOpenId(openId === m.id ? null : m.id)}
//           />
//         ))}

//         {modules.length === 0 && (
//           <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
//             <p className="font-semibold text-slate-700">No guides found</p>
//             <p className="mt-1 text-sm text-slate-500">Try a different word, or clear the search.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }



// src/pages/settings/UserGuide.jsx
//
// Settings -> User Guide
// A simple list of modules. Click a module to open it and see its YouTube
// video and a short description. Content comes from src/data/userGuide.js.
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, ChevronDown, PlayCircle, Search, ArrowRight } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { userGuideModules } from "../../data/userGuide";

/* ---------------------------------------------------------------------
   Accepts a YouTube <iframe> code, a normal link, a youtu.be link or just
   the 11-character video ID, and returns { id, start }.
--------------------------------------------------------------------- */
function parseYouTube(input) {
  const text = String(input || "").trim().replace(/&amp;/g, "&");
  if (!text) return null;

  const srcMatch = text.match(/src=["']([^"']+)["']/i);
  const url = srcMatch ? srcMatch[1] : text;

  const idMatch = url.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|watch\?(?:[^#\s]*&)?v=))([A-Za-z0-9_-]{11})/
  );
  const id = idMatch ? idMatch[1] : /^[A-Za-z0-9_-]{11}$/.test(url) ? url : null;
  if (!id) return null;

  const timeMatch = url.match(/[?&](?:start|t)=(\d+)/);
  return { id, start: timeMatch ? Number(timeMatch[1]) : 0 };
}

/* ---------------- YouTube player ---------------- */
function VideoPlayer({ video, start, title }) {
  const parsed = useMemo(() => parseYouTube(video), [video]);

  if (!parsed) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
        <PlayCircle size={42} strokeWidth={1.5} />
        <p className="mt-2 text-sm font-semibold">Video coming soon</p>
      </div>
    );
  }

  const from = start || parsed.start || 0;
  const src = `https://www.youtube.com/embed/${parsed.id}?rel=0${from ? `&start=${from}` : ""}`;

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-lg ring-1 ring-slate-900/10">
      <iframe
        className="h-full w-full"
        src={src}
        title={title}
        frameBorder="0"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}

/* ---------------- One module row ---------------- */
function ModuleItem({ module, open, onToggle, hasVideo }) {
  const Icon = module.icon;
  const panelId = `guide-panel-${module.id}`;

  return (
    <div
      id={`guide-${module.id}`}
      className={`scroll-mt-24 overflow-hidden rounded-2xl border bg-white transition-shadow ${
        open ? "border-green-300 shadow-md" : "border-slate-200 shadow-sm hover:shadow-md"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-5 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500/60"
      >
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            open ? "bg-green-600 text-white" : "bg-green-50 text-green-700"
          }`}
        >
          <Icon size={22} strokeWidth={1.9} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">{module.name}</span>
            {module.adminOnly && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                Admin
              </span>
            )}
            {!hasVideo && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                Coming soon
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[15px] text-slate-500">{module.summary}</span>
        </span>

        <ChevronDown
          size={20}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div id={panelId} className="border-t border-slate-100 px-6 pb-7 pt-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <VideoPlayer video={module.video} start={module.start} title={`${module.name} guide`} />

            <div className="flex flex-col">
              <p className="text-base leading-relaxed text-slate-700">{module.summary}</p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                In this video
              </p>
              <ul className="mt-3 space-y-2.5">
                {module.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-[15px] text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                    {point}
                  </li>
                ))}
              </ul>

              <Link
                to={module.path}
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-[15px] font-semibold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/60"
              >
                Open {module.name}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function UserGuide() {
  const role = useAuthStore((state) => state.user?.role);
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");
  // ?module=customers opens that module straight away (for future "Help" buttons)
  const [openId, setOpenId] = useState(params.get("module") || null);

  const modules = useMemo(() => {
    const q = query.trim().toLowerCase();
    return userGuideModules
      .filter((m) => !m.adminOnly || role === "ADMIN")
      .filter(
        (m) =>
          !q ||
          `${m.name} ${m.summary} ${m.keywords || ""} ${m.points.join(" ")}`
            .toLowerCase()
            .includes(q)
      );
  }, [query, role]);

  // When opened from a link like ?module=customers, scroll that row into view
  useEffect(() => {
    const id = params.get("module");
    if (!id) return;
    const t = setTimeout(() => {
      document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(t);
  }, [params]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <BookOpen size={24} strokeWidth={1.9} />
        </span>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">User Guide</h2>
          <p className="text-[15px] text-slate-500">
            Have a doubt? Open a module to watch a short video and see how it works.
          </p>
        </div>
      </div>

      <div className="relative mt-5">
        <Search size={20} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a module or topic, e.g. import, template, backup"
          className="h-14 w-full rounded-full border border-slate-200 bg-white pl-12 pr-5 text-base text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
        />
      </div>

      <div className="mt-6 space-y-4">
        {modules.map((m) => (
          <ModuleItem
            key={m.id}
            module={m}
            hasVideo={Boolean(parseYouTube(m.video))}
            open={openId === m.id}
            onToggle={() => setOpenId(openId === m.id ? null : m.id)}
          />
        ))}

        {modules.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <p className="font-semibold text-slate-700">No guides found</p>
            <p className="mt-1 text-sm text-slate-500">Try a different word, or clear the search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
