// src/components/guide/GuidePanel.jsx
//
// The "Your ___ Space Start Here" panel: video + "In this video" checklist.
//
//  variant "page"  : shown in place of a module on the first visit.
//                    Has a Skip button.
//  variant "modal" : shown when the user clicks the guide icon in the header.
//                    Has a close (X) button.
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
}) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const isModal = variant === "modal";
  const Icon = module.icon;
  const from = module.start || video.start || 0;

  const embedSrc = `https://www.youtube.com/embed/${video.id}?rel=0&autoplay=1${
    from ? `&start=${from}` : ""
  }`;

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
          {playing ? (
            <iframe
              className="h-full w-full"
              src={embedSrc}
              title={`${module.name} guide`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
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

              <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-lg ring-8 ring-white/30 transition group-hover:scale-105 group-hover:bg-green-600">
                <Play size={34} fill="currentColor" className="ml-1" />
              </span>
            </button>
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
