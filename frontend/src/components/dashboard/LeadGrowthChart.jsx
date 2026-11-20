// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
// } from "recharts";



// export default function LeadGrowthChart({ leadGrowth = [] }) {
//   return (
//     <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

//       {/* Header */}
//       <div className="mb-6">
//         <h2 className="text-xl font-bold text-gray-900">
//           Lead Growth
//         </h2>

//         <p className="mt-1 text-sm text-gray-500">
//           Monthly lead acquisition
//         </p>
//       </div>

//       <ResponsiveContainer
//         width="100%"
//         height={320}
//       >
//         <LineChart data={leadGrowth}>

//           <CartesianGrid
//             strokeDasharray="3 3"
//             stroke="#E5E7EB"
//           />

//           <XAxis
//             dataKey="month"
//             tick={{ fill: "#6B7280" }}
//             axisLine={false}
//             tickLine={false}
//           />

//           <YAxis
//             tick={{ fill: "#6B7280" }}
//             axisLine={false}
//             tickLine={false}
//           />

//           <Tooltip />

//           <Line
//             type="monotone"
//             dataKey="leads"
//             stroke="#2563EB"
//             strokeWidth={3}
//             dot={{
//               r: 5,
//               fill: "#2563EB",
//             }}
//             activeDot={{
//               r: 7,
//             }}
//           />

//         </LineChart>
//       </ResponsiveContainer>

//     </div>
//   );
// }

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function LeadGrowthChart({ leadGrowth = [] }) {
  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Lead Growth</h2>
        <p className="mt-1 text-sm text-slate-600">Monthly lead acquisition</p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={leadGrowth} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#E5E7EB" vertical={false} />

          <XAxis
            dataKey="month"
            tick={{ fill: "#4B5563", fontSize: 13 }}
            axisLine={false}
            tickLine={false}
          />

          {/* Whole numbers only: you can't have 1.5 leads. The top of the
              scale follows your data instead of being fixed. */}
          <YAxis
            allowDecimals={false}
            domain={[0, (max) => Math.max(4, max)]}
            tick={{ fill: "#4B5563", fontSize: 13 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            cursor={{ stroke: "#159A4B", strokeOpacity: 0.25 }}
            formatter={(value) => [value, "Leads"]}
          />

          <Line
            type="linear"
            dataKey="leads"
            stroke="#166534"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#FFFFFF", stroke: "#166534", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#166534", stroke: "#FFFFFF", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}