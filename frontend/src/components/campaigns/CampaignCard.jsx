import { Calendar, Users, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

import RowActionsMenu from "../common/RowActionsMenu";
import { TypePill } from "./campaignUi";
import {
  STATUS_OPTIONS,
  STATUS_STYLES,
  DEFAULT_STATUS_STYLE,
  getAudienceCount,
  formatDateTime,
  getCampaignActions,
  ACTIONS_MENU_WIDTH,
} from "./campaignHelpers";
import { getCampaignMessageText } from "../../utils/campaignMessage";

export default function CampaignCard({
  campaign,
  onView,
  onSend,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const navigate = useNavigate();

  const actions = getCampaignActions(campaign, {
    onSend,
    onView,
    onEdit,
    onDelete,
  });

  const statusStyle = STATUS_STYLES[campaign.status] || DEFAULT_STATUS_STYLE;

  return (
    <div className="flex h-full min-w-0 flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* HEADER: name + actions */}
      <div className="flex items-start justify-between gap-3">
        <h2
          onClick={() => navigate(`/campaigns/${campaign.id}`)}
          title={campaign.name}
          className="min-w-0 cursor-pointer truncate text-base font-semibold text-slate-900 hover:text-green-700"
        >
          {campaign.name}
        </h2>

        <RowActionsMenu
          ariaLabel={`Actions for ${campaign.name}`}
          items={actions}
          width={ACTIONS_MENU_WIDTH}
          buttonClassName="bg-slate-50"
        />
      </div>

      {/* TYPE + STATUS */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <TypePill type={campaign.type} />

        <div className="relative inline-block">
          <select
            aria-label={`Status of ${campaign.name}`}
            value={campaign.status}
            onChange={(e) => onStatusChange?.(campaign.id, e.target.value)}
            className={`cursor-pointer appearance-none rounded-full border-none py-1 pl-3 pr-7 text-[11px] font-medium uppercase tracking-wide outline-none ${statusStyle}`}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label.toUpperCase()}
              </option>
            ))}
          </select>

          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
          />
        </div>
      </div>

      {/* MESSAGE */}
      <div className="mt-4">
        <p className="line-clamp-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
          {getCampaignMessageText(campaign)}
        </p>

        {campaign.template?.name && (
          <p className="mt-3 text-xs text-slate-400">
            Template: {campaign.template.name}
          </p>
        )}
      </div>

      {/* AUDIENCE + SCHEDULE pinned to the bottom so every card lines up */}
      <div className="mt-auto space-y-2.5 pt-4 text-sm text-slate-700">
        <div className="flex items-center gap-2">
          <Users size={16} className="shrink-0 text-slate-500" />

          <span>Audience: {getAudienceCount(campaign)}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="shrink-0 text-slate-500" />

          <span>
            {campaign.scheduledAt
              ? formatDateTime(campaign.scheduledAt)
              : "Not scheduled"}
          </span>
        </div>
      </div>
    </div>
  );
}
