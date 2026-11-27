// import { Eye, Pencil, Trash2, ClipboardList } from "lucide-react";

// import { useAuthStore } from "../../store/authStore";
// import RowActionsMenu from "../common/RowActionsMenu";
// import {
//   Pill,
//   PillSelect,
// } from "./taskUi";
// import {
//   STATUS_OPTIONS,
//   PRIORITY_OPTIONS,
//   formatDate,
//   priorityTone,
//   statusTone,
//   optionLabel,
// } from "./taskHelpers";

// const thClass =
//   "whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-green-900/70";

// const tdClass = "px-6 py-4 text-sm text-slate-600";

// export default function TaskTable({
//   tasks = [],
//   onView,
//   onEdit,
//   onDelete,
//   onStatusChange,
//   onPriorityChange,
// }) {
//   const { user } = useAuthStore();

//   const isAdmin = user?.role === "ADMIN";

//   const currentUserId = user?.id || user?.userId;

//   if (!tasks || tasks.length === 0) {
//     return (
//       <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
//         <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
//           <ClipboardList size={30} className="text-green-500" />
//         </div>

//         <h3 className="text-xl font-semibold text-slate-800">
//           No Tasks Found
//         </h3>

//         <p className="mt-2 text-sm text-slate-500">
//           There are no tasks matching your filters.
//         </p>
//       </div>
//     );
//   }

//   const menuItems = (task) => {
//     const items = [
//       {
//         key: "view",
//         label: "View",
//         icon: Eye,
//         onClick: () => onView?.(task),
//       },
//     ];

//     if (isAdmin) {
//       items.push(
//         {
//           key: "edit",
//           label: "Edit",
//           icon: Pencil,
//           onClick: () => onEdit?.(task),
//         },
//         {
//           key: "delete",
//           label: "Delete",
//           icon: Trash2,
//           danger: true,
//           onClick: () => onDelete?.(task.id),
//         }
//       );
//     }

//     return items;
//   };

//   return (
//     <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//       <div className="overflow-x-auto">
//         <table className="w-full min-w-[900px] table-auto">
//           <thead className="bg-green-100/80">
//             <tr>
//               <th className={`${thClass} min-w-[240px]`}>
//                 Task
//               </th>
//               <th className={thClass}>Owner</th>
//               <th className={thClass}>Email</th>
//               <th className={thClass}>Due Date</th>
//               <th className={thClass}>Priority</th>
//               <th className={thClass}>Status</th>
//               <th className={`${thClass} text-center`}>
//                 Actions
//               </th>
//             </tr>
//           </thead>

//           <tbody className="divide-y divide-slate-100">
//             {tasks.map((task) => {
//               const canUpdateStatus =
//                 isAdmin ||
//                 task.assignedToId === currentUserId;

//               return (
//                 <tr
//                   key={task.id}
//                   className="transition hover:bg-slate-50/70"
//                 >
//                   {/* TASK */}

//                   <td className={tdClass}>
//                     <button
//                       type="button"
//                       onClick={() => onView?.(task)}
//                       className="break-words text-left font-medium text-slate-800 hover:text-green-600"
//                     >
//                       {task.title}
//                     </button>
//                   </td>

//                   {/* OWNER */}

//                   <td className={`${tdClass} whitespace-nowrap`}>
//                     {task.assignedTo?.name || (
//                       <span className="italic text-slate-400">
//                         Unassigned
//                       </span>
//                     )}
//                   </td>

//                   {/* EMAIL */}

//                   <td className={tdClass}>
//                     <span className="break-all">
//                       {task.assignedTo?.email || "-"}
//                     </span>
//                   </td>

//                   {/* DUE DATE */}

//                   <td className={`${tdClass} whitespace-nowrap`}>
//                     {formatDate(task.dueDate, { utc: true })}
//                   </td>

//                   {/* PRIORITY */}

//                   <td className={tdClass}>
//                     {isAdmin ? (
//                       <PillSelect
//                         label="Priority"
//                         value={task.priority}
//                         options={PRIORITY_OPTIONS}
//                         tone={priorityTone(task.priority)}
//                         onChange={(value) =>
//                           onPriorityChange?.(task.id, value)
//                         }
//                       />
//                     ) : (
//                       <Pill tone={priorityTone(task.priority)}>
//                         {optionLabel(
//                           PRIORITY_OPTIONS,
//                           task.priority
//                         )}
//                       </Pill>
//                     )}
//                   </td>

//                   {/* STATUS */}

//                   <td className={tdClass}>
//                     {canUpdateStatus ? (
//                       <PillSelect
//                         label="Status"
//                         value={task.status}
//                         options={STATUS_OPTIONS}
//                         tone={statusTone(task.status)}
//                         onChange={(value) =>
//                           onStatusChange?.(task.id, value)
//                         }
//                       />
//                     ) : (
//                       <Pill tone={statusTone(task.status)}>
//                         {optionLabel(
//                           STATUS_OPTIONS,
//                           task.status
//                         )}
//                       </Pill>
//                     )}
//                   </td>

//                   {/* ACTIONS */}

//                   <td className={tdClass}>
//                     <div className="flex justify-center [&>button]:bg-slate-100 [&>button]:text-slate-600">
//                       <RowActionsMenu
//                         ariaLabel={`Actions for ${task.title}`}
//                         items={menuItems(task)}
//                       />
//                     </div>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


import { Eye, Pencil, Trash2, ClipboardList } from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import RowActionsMenu from "../common/RowActionsMenu";
import {
  Pill,
  PillSelect,
} from "./taskUi";
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  formatDate,
  priorityTone,
  statusTone,
  optionLabel,
} from "./taskHelpers";

const thClass =
  "whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-green-900/70";

const tdClass = "px-6 py-4 text-sm text-slate-600";

export default function TaskTable({
  tasks = [],
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
}) {
  const { user } = useAuthStore();

  const isAdmin = user?.role === "ADMIN";

  const currentUserId = user?.id || user?.userId;

  if (!tasks || tasks.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <ClipboardList size={30} className="text-green-500" />
        </div>

        <h3 className="text-xl font-semibold text-slate-800">
          No Tasks Found
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          There are no tasks matching your filters.
        </p>
      </div>
    );
  }

  const menuItems = (task) => {
    const items = [
      {
        key: "view",
        label: "View",
        icon: Eye,
        onClick: () => onView?.(task),
      },
    ];

    if (isAdmin) {
      items.push(
        {
          key: "edit",
          label: "Edit",
          icon: Pencil,
          onClick: () => onEdit?.(task),
        },
        {
          key: "delete",
          label: "Delete",
          icon: Trash2,
          danger: true,
          onClick: () => onDelete?.(task.id),
        }
      );
    }

    return items;
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] table-auto">
          <thead className="bg-green-100/80">
            <tr>
              <th className={`${thClass} min-w-[240px]`}>
                Task
              </th>
              <th className={thClass}>Owner</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Due Date</th>
              <th className={thClass}>Priority</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} text-center`}>
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const canUpdateStatus =
                isAdmin ||
                task.assignedToId === currentUserId;

              return (
                <tr
                  key={task.id}
                  className="transition hover:bg-slate-50/70"
                >
                  {/* TASK */}

                  <td className={tdClass}>
                    <button
                      type="button"
                      onClick={() => onView?.(task)}
                      className="break-words text-left font-medium text-slate-800 hover:text-green-600"
                    >
                      {task.title}
                    </button>
                  </td>

                  {/* OWNER */}

                  <td className={`${tdClass} whitespace-nowrap`}>
                    {task.assignedTo?.name || (
                      <span className="italic text-slate-400">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* EMAIL */}

                  <td className={tdClass}>
                    <span className="whitespace-nowrap">
                      {task.assignedTo?.email || "-"}
                    </span>
                  </td>

                  {/* DUE DATE */}

                  <td className={`${tdClass} whitespace-nowrap`}>
                    {formatDate(task.dueDate, { utc: true })}
                  </td>

                  {/* PRIORITY */}

                  <td className={tdClass}>
                    {isAdmin ? (
                      <PillSelect
                        label="Priority"
                        value={task.priority}
                        options={PRIORITY_OPTIONS}
                        tone={priorityTone(task.priority)}
                        onChange={(value) =>
                          onPriorityChange?.(task.id, value)
                        }
                      />
                    ) : (
                      <Pill tone={priorityTone(task.priority)}>
                        {optionLabel(
                          PRIORITY_OPTIONS,
                          task.priority
                        )}
                      </Pill>
                    )}
                  </td>

                  {/* STATUS */}

                  <td className={tdClass}>
                    {canUpdateStatus ? (
                      <PillSelect
                        label="Status"
                        value={task.status}
                        options={STATUS_OPTIONS}
                        tone={statusTone(task.status)}
                        onChange={(value) =>
                          onStatusChange?.(task.id, value)
                        }
                      />
                    ) : (
                      <Pill tone={statusTone(task.status)}>
                        {optionLabel(
                          STATUS_OPTIONS,
                          task.status
                        )}
                      </Pill>
                    )}
                  </td>

                  {/* ACTIONS */}

                  <td className={tdClass}>
                    <div className="flex justify-center [&>button]:bg-slate-100 [&>button]:text-slate-600">
                      <RowActionsMenu
                        ariaLabel={`Actions for ${task.title}`}
                        items={menuItems(task)}
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