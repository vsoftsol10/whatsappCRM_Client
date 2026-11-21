// src/components/guide/useGuideAutoOpen.js
//
// Put this in a module page (Leads, Campaigns...). When the user came from the
// first-visit guide by clicking the green "+ Add ..." button, the page opens
// its own add form once, right after it appears. Does nothing otherwise.
import { useEffect, useRef } from "react";
import { consumeGuideOpen } from "./guideUtils";

export default function useGuideAutoOpen(moduleId, openForm) {
  const openRef = useRef(openForm);
  openRef.current = openForm;

  useEffect(() => {
    if (consumeGuideOpen(moduleId)) openRef.current();
  }, [moduleId]);
}