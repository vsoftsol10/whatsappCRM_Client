// src/hooks/usePlanFeatures.js
//
//   const { can, limitOf } = usePlanFeatures();
//   can("leads")          -> true / false  (switch in Super Admin)
//   limitOf("customers")  -> number, or null when unlimited
import { useCallback } from "react";
import { usePlanFeatureStore } from "../store/planFeatureStore";

export default function usePlanFeatures() {
  const features = usePlanFeatureStore((state) => state.features);
  const usage = usePlanFeatureStore((state) => state.usage);
  const planName = usePlanFeatureStore((state) => state.planName);
  const loaded = usePlanFeatureStore((state) => state.loaded);

  // No data (not loaded yet / no plan) -> nothing is hidden
  const can = useCallback(
    (key) => !key || !features || features[key]?.enabled !== false,
    [features]
  );

  const limitOf = useCallback(
    (key) => {
      const limit = features?.[key]?.limit;
      return limit === undefined ? null : limit;
    },
    [features]
  );

  return { can, limitOf, features, usage, planName, loaded };
}
