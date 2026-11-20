import { useNavigate } from "react-router-dom";

import RowActionsMenu from "../common/RowActionsMenu";
import { StatusPill } from "./campaignUi";
import {
  getAudienceCount,
  getSentCount,
  getCampaignActions,
  ACTIONS_MENU_WIDTH,
} from "./campaignHelpers";

const TH = "px-5 py-3.5 text-left text-xs font-semibold text-green-900";

export default function CampaignTable({
  campaigns = [],
  onView,
  onSend,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="bg-green-100/70">
              <th className={TH}>Campaign</th>
              <th className={TH}>Audience</th>
              <th className={TH}>Sent</th>
              <th className={TH}>Status</th>
              <th className={`${TH} text-center uppercase`}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {campaigns.map((campaign) => {
              const audience = getAudienceCount(campaign);

              return (
                <tr
                  key={campaign.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50/70"
                >
                  <td className="max-w-[260px] px-5 py-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      title={campaign.name}
                      className="block max-w-full truncate text-left text-slate-800 hover:text-green-700"
                    >
                      {campaign.name}
                    </button>
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {audience} {audience === 1 ? "customer" : "customers"}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {getSentCount(campaign).toLocaleString()}
                  </td>

                  <td className="px-5 py-4">
                    <StatusPill status={campaign.status} />
                  </td>

                  <td className="px-5 py-2.5">
                    <div className="flex justify-center">
                      <RowActionsMenu
                        ariaLabel={`Actions for ${campaign.name}`}
                        items={getCampaignActions(campaign, {
                          onSend,
                          onView,
                          onEdit,
                          onDelete,
                        })}
                        width={ACTIONS_MENU_WIDTH}
                        buttonClassName="bg-slate-50"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
