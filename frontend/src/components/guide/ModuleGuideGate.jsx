// src/components/guide/ModuleGuideGate.jsx
//
// First-visit guide for a module.
//
// Wrap a module's page in a route:
//   <ModuleGuideGate moduleId="templates"><Templates /></ModuleGuideGate>
//
// The first time a user opens that module they see the "Your ___ Space Start
// Here" panel with the module's user guide video. It counts as "seen" only when
// the user clicks the green button or Skip. If they leave by mistake (another
// menu item, reload, back button) it shows again on their next visit.
//
// After that the module opens normally. The user can always open the guide again
// from the ? icon in the top header (see ModuleGuideButton).
//
// All text, checklists and video links come from src/data/userGuide.js - the
// same data as Settings -> User Guide.
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuthStore } from "../../store/authStore";
import { useTourStore } from "../../store/tourStore";
import { userGuideModules } from "../../data/userGuide";
import GuidePanel from "./GuidePanel";
import { PRIMARY_LABELS, hasSeenGuide, markGuideSeen, parseYouTube } from "./guideUtils";

function Gate({ moduleId, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const tourActive = useTourStore((state) => state.active);

  const userId = user?.id ?? user?._id ?? user?.email;

  const module = useMemo(
    () => userGuideModules.find((item) => item.id === moduleId),
    [moduleId]
  );
  const video = useMemo(() => parseYouTube(module?.video), [module]);

  // Decided when the module is opened. The panel stays up until the user
  // clicks the green button or Skip - only then is it saved as "seen".
  const [show, setShow] = useState(
    () => Boolean(userId && module && video && !tourActive && !hasSeenGuide(userId, moduleId))
  );

  if (!show || !module || !video) return children;

  const finish = () => {
    markGuideSeen(userId, moduleId);
    setShow(false);
  };

  const handleContinue = () => {
    finish();

    // e.g. Instagram guide: the connect button lives in Integrations
    if (module.path && module.path !== location.pathname) navigate(module.path);
  };

  return (
    <GuidePanel
      module={module}
      video={video}
      variant="page"
      primaryLabel={PRIMARY_LABELS[module.id] || `Open ${module.name}`}
      onPrimary={handleContinue}
      onSkip={finish}
    />
  );
}

// key={moduleId} makes sure every module gets its own fresh "first visit" check
export default function ModuleGuideGate({ moduleId, children }) {
  return (
    <Gate key={moduleId} moduleId={moduleId}>
      {children}
    </Gate>
  );
}
