// import {
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   Legend,
// } from "recharts";

// const COLORS = [
//   "#3B82F6", // Open
//   "#25D366", // In Progress
//   "#10B981", // Resolved
//   "#8B5CF6", // Closed
// ];

// export default function TicketStatusChart({ tickets }) {

//   const data = [
//     {
//       name: "Open",
//       value: tickets?.open ?? 0,
//     },
//     {
//       name: "In Progress",
//       value: tickets?.inProgress ?? 0,
//     },
//     {
//       name: "Resolved",
//       value: tickets?.resolved ?? 0,
//     },
//     {
//       name: "Closed",
//       value: tickets?.closed ?? 0,
//     },
//   ];

//   return (
//     <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

//       {/* Header */}
//       <div className="mb-6">
//         <h2 className="text-xl font-bold text-gray-900">
//           Ticket Status
//         </h2>

//         <p className="mt-1 text-sm text-gray-500">
//           Current task distribution
//         </p>
//       </div>

//       <ResponsiveContainer width="100%" height={320}>
//         <PieChart>

//           <Pie
//             data={data}
//             dataKey="value"
//             nameKey="name"
//             cx="50%"
//             cy="50%"
//             outerRadius={95}
//             innerRadius={55}
//             paddingAngle={4}
//           >
//             {data.map((entry, index) => (
//               <Cell
//                 key={entry.name}
//                 fill={COLORS[index]}
//               />
//             ))}
//           </Pie>

//           <Tooltip />

//           <Legend
//             verticalAlign="bottom"
//             height={36}
//           />

//         </PieChart>
//       </ResponsiveContainer>

//     </div>
//   );
// }

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

// Four clearly different colours (the old In Progress / Resolved greens
// looked almost the same).
const STATUSES = [
  { key: "open", name: "Open", color: "#2563EB" },
  { key: "inProgress", name: "In Progress", color: "#F59E0B" },
  { key: "resolved", name: "Resolved", color: "#16A34A" },
  { key: "closed", name: "Closed", color: "#8B5CF6" },
];

export default function TicketStatusChart({ tickets }) {
  const data = STATUSES.map((s) => ({
    name: s.name,
    color: s.color,
    value: tickets?.[s.key] ?? 0,
  }));

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900">Ticket Status</h2>
        <p className="mt-1 text-sm text-slate-600">Current ticket distribution</p>
      </div>

      <div className="relative mx-auto h-[220px] w-full max-w-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {total === 0 ? (
              // No tickets yet: show an empty grey ring instead of a blank chart
              <Pie
                data={[{ name: "No tickets", value: 1 }]}
                dataKey="value"
                innerRadius={70}
                outerRadius={105}
                stroke="none"
                isAnimationActive={false}
              >
                <Cell fill="#E5E7EB" />
              </Pie>
            ) : (
              <>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={105}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </>
            )}
          </PieChart>
        </ResponsiveContainer>

        {/* Total in the middle of the ring */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-900">{total}</span>
          <span className="text-xs text-slate-500">
            {total === 1 ? "ticket" : "tickets"}
          </span>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm text-slate-700">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.color }}
              aria-hidden="true"
            />
            {d.name} ({d.value})
          </li>
        ))}
      </ul>
    </div>
  );
}