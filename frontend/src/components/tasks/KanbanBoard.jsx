import KanbanTaskCard from "./KanbanTaskCard";

// Card view: a responsive grid of task cards.
export default function KanbanBoard({
  tasks = [],
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
}) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <KanbanTaskCard
          key={task.id}
          task={task}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onPriorityChange={onPriorityChange}
        />
      ))}
    </div>
  );
}
