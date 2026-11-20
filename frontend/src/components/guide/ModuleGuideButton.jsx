// src/components/guide/ModuleGuideButton.jsx
//
// Small "?" icon for the top header. On every module page it opens that
// module's guide video in a popup - so a user can watch it again whenever
// they have a doubt. Shows nothing on pages that have no guide.
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { CircleHelp } from "lucide-react";

import { userGuideModules } from "../../data/userGuide";
import GuidePanel from "./GuidePanel";
import { getGuideModuleId, parseYouTube } from "./guideUtils";

export default function ModuleGuideButton() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const moduleId = getGuideModuleId(pathname);

  const module = useMemo(
    () => userGuideModules.find((item) => item.id === moduleId),
    [moduleId]
  );
  const video = useMemo(() => parseYouTube(module?.video), [module]);

  // Close the popup when the user goes to another page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!module || !video) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`How ${module.name} works`}
        aria-label={`Open the ${module.name} guide video`}
        className="flex h-11 w-11 items-center justify-center rounded-full text-[#159A4B] transition hover:bg-[#159A4B]/10"
      >
        <CircleHelp size={22} strokeWidth={1.9} />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 p-4"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${module.name} guide`}
              className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <GuidePanel
                module={module}
                video={video}
                variant="modal"
                primaryLabel="Got it"
                onPrimary={() => setOpen(false)}
                onClose={() => setOpen(false)}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
