// src/components/tour/TakeTourButton.jsx
// Optional: drop this anywhere (header, profile menu, settings) to replay the tour.
import { Compass } from "lucide-react";
import { startProductTour } from "../../store/tourStore";

export default function TakeTourButton({ className = "" }) {
  return (
    <button
      type="button"
      onClick={startProductTour}
      className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-[#DCF8C6] ${className}`}
    >
      <Compass size={16} className="text-[#25D366]" />
      Take a tour
    </button>
  );
}
