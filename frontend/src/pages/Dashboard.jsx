
// import { useEffect } from "react";
// import { MessageSquare, UserPlus, Users, UserCheck } from "lucide-react";

// import useDashboardStore from "../store/dashboardStore";

// import DashboardHeader from "../components/dashboard/DashboardHeader";
// import DashboardStatCard from "../components/dashboard/DashboardStatCard";
// import RecentConversations from "../components/dashboard/RecentConversations";
// import TaskOverviewCard from "../components/dashboard/TaskOverviewCard";
// import LeadGrowthChart from "../components/dashboard/LeadGrowthChart";
// import TicketStatusChart from "../components/dashboard/TicketStatusChart";

// export default function Dashboard() {
//   const { dashboardStats, isLoading, error, fetchDashboardStats } =
//     useDashboardStore();

//   useEffect(() => {
//     fetchDashboardStats();
//   }, [fetchDashboardStats]);

//   if (error) {
//     return (
//       <div role="alert" className="mx-auto w-full max-w-[1500px] text-red-600">
//         {error}
//       </div>
//     );
//   }

//   if (isLoading) {
//     return (
//       <div className="flex min-h-[60vh] items-center justify-center">
//         <div className="text-center">
//           <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#159A4B]" />
//           <p className="mt-4 text-lg font-medium text-slate-600">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="mx-auto w-full max-w-[1500px]">
//       <DashboardHeader />

//       {/* KPI CARDS */}
//       <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
//         <DashboardStatCard
//           title="Conversations"
//           value={dashboardStats?.totalConversations}
//           icon={MessageSquare}
//           path="/conversations"
//         />
//         <DashboardStatCard
//           title="Leads"
//           value={dashboardStats?.totalLeads}
//           icon={UserPlus}
//           path="/leads"
//         />
//         <DashboardStatCard
//           title="Customers"
//           value={dashboardStats?.totalCustomers}
//           icon={Users}
//           path="/customers"
//         />
//         <DashboardStatCard
//           title="Employees"
//           value={dashboardStats?.totalEmployees}
//           icon={UserCheck}
//           path="/employees"
//         />
//       </div>

//       {/* CHARTS — two equal columns */}
//       <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
//         <LeadGrowthChart leadGrowth={dashboardStats?.leadGrowth || []} />
//         <TicketStatusChart tickets={dashboardStats?.tickets} />
//       </div>

//       {/* RECENT CONVERSATIONS + TASK OVERVIEW — same two equal columns */}
//       <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
//         <RecentConversations />
//         <TaskOverviewCard tasks={dashboardStats?.tasks} />
//       </div>
//     </div>
//   );
// }




import { useEffect } from "react";
import { MessageSquare, UserPlus, Users, UserCheck } from "lucide-react";

import useDashboardStore from "../store/dashboardStore";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardStatCard from "../components/dashboard/DashboardStatCard";
import RecentConversations from "../components/dashboard/RecentConversations";
import TaskOverviewCard from "../components/dashboard/TaskOverviewCard";
import LeadGrowthChart from "../components/dashboard/LeadGrowthChart";
import TicketStatusChart from "../components/dashboard/TicketStatusChart";

export default function Dashboard() {
  const { dashboardStats, isLoading, error, fetchDashboardStats } =
    useDashboardStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (error) {
    return (
      <div role="alert" className="mx-auto w-full max-w-[1500px] text-red-600">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#159A4B]" />
          <p className="mt-4 text-lg font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <DashboardHeader />

      {/* KPI CARDS */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 xl:gap-5">
        <DashboardStatCard
          title="Conversations"
          value={dashboardStats?.totalConversations}
          icon={MessageSquare}
          path="/conversations"
        />
        <DashboardStatCard
          title="Leads"
          value={dashboardStats?.totalLeads}
          icon={UserPlus}
          path="/leads"
        />
        <DashboardStatCard
          title="Customers"
          value={dashboardStats?.totalCustomers}
          icon={Users}
          path="/customers"
        />
        <DashboardStatCard
          title="Employees"
          value={dashboardStats?.totalEmployees}
          icon={UserCheck}
          path="/employees"
        />
      </div>

      {/* CHARTS — two equal columns */}
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <LeadGrowthChart leadGrowth={dashboardStats?.leadGrowth || []} />
        <TicketStatusChart tickets={dashboardStats?.tickets} />
      </div>

      {/* RECENT CONVERSATIONS + TASK OVERVIEW — same two equal columns */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RecentConversations />
        <TaskOverviewCard tasks={dashboardStats?.tasks} />
      </div>
    </div>
  );
}