import { useEffect } from "react";
import {
  MessageCircle,
  Briefcase,
  Users,
  UserCheck,
  ClipboardList,
} from "lucide-react";

import useDashboardStore from "../store/dashboardStore";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardSearch from "../components/dashboard/DashboardSearch";
import DashboardStatCard from "../components/dashboard/DashboardStatCard";
import RecentConversations from "../components/dashboard/RecentConversations";
import TaskOverviewCard from "../components/dashboard/TaskOverviewCard";
import LeadGrowthChart from "../components/dashboard/LeadGrowthChart";
import TicketStatusChart from "../components/dashboard/TicketStatusChart";
import InsightsCard from "../components/dashboard/InsightsCard";
import PerformanceOverview from "../components/dashboard/PerformanceOverview";

export default function Dashboard() {
  const {
    dashboardStats,
    isLoading,
    error,
    fetchDashboardStats,
  } = useDashboardStore();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (error) {
    return (
      <div className="crm-page text-red-600">
        {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="crm-page flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div>

          <p className="mt-4 text-lg font-medium text-gray-600">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-page">

      {/* HEADER */}
      <DashboardHeader />

      {/* SEARCH */}
  

      {/* KPI CARDS */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5 xl:grid-cols-5">

        <DashboardStatCard
          title="Conversations"
          value={dashboardStats?.totalConversations}
          subtitle="WhatsApp Chats"
          icon={MessageCircle}
          iconBg="bg-green-100"
          iconColor="text-[#128C7E]"
          borderColor="from-green-500 to-emerald-500"
          path="/conversations"
        />

        <DashboardStatCard
          title="Leads"
          value={dashboardStats?.totalLeads}
          subtitle="Sales Pipeline"
          icon={Briefcase}
          iconBg="bg-[#DCF8C6]"
          iconColor="text-[#25D366]"
          borderColor="from-[#25D366] to-[#128C7E]"
          path="/leads"
        />

        <DashboardStatCard
          title="Customers"
          value={dashboardStats?.totalCustomers}
          subtitle="Registered Customers"
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          borderColor="from-blue-500 to-cyan-500"
          path="/customers"
        />

        <DashboardStatCard
          title="Employees"
          value={dashboardStats?.totalEmployees}
          subtitle="CRM Users"
          icon={UserCheck}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          borderColor="from-purple-500 to-pink-500"
          path="/employees"
        />

        <DashboardStatCard
          title="Tasks"
          value={dashboardStats?.tasks?.total}
          subtitle="Assigned Tasks"
          icon={ClipboardList}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          borderColor="from-red-500 to-rose-500"
          path="/tasks"
        />

      </div>

      {/* RECENT CONVERSATIONS + TASK OVERVIEW */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 xl:gap-6">

        <div className="xl:col-span-2">
          <RecentConversations />
        </div>

        <TaskOverviewCard
          tasks={dashboardStats?.tasks}
        />

      </div>

      {/* CHARTS */}
      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6">

        <LeadGrowthChart 
           leadGrowth={dashboardStats?.leadGrowth || []}
        />

        <TicketStatusChart 
           tickets={dashboardStats?.tickets}
        />

      </div>

      {/* INSIGHTS + PERFORMANCE */}
      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2 xl:gap-6">

        <InsightsCard
          stats={dashboardStats}
        />

        <PerformanceOverview
          stats={dashboardStats}
        />

      </div>

    </div>
  );
}
