// import { Plus, Loader2 } from "lucide-react";

// const BackupHeader = ({ onCreateBackup, creating }) => {
//   return (
//     <div className="mb-6">
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//         <div>
//           <h1 className="text-[28px] font-bold leading-tight text-slate-900">
//             Backup
//           </h1>

//           <p className="mt-1 text-sm text-slate-500">
//             Create and manage backups of your CRM data.
//           </p>
//         </div>

//         <button
//           type="button"
//           onClick={onCreateBackup}
//           disabled={creating}
//           className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
//         >
//           {creating ? (
//             <Loader2 className="h-4 w-4 animate-spin" />
//           ) : (
//             <Plus className="h-4 w-4" />
//           )}
//           {creating ? "Creating..." : "Create Backup"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default BackupHeader;



import { Plus, Loader2 } from "lucide-react";

const BackupHeader = ({ onCreateBackup, creating }) => {
  return (
    <div className="mb-6">
      {/* Heading removed - the "Backup & Restore" tab above already names this page */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCreateBackup}
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {creating ? "Creating..." : "Create Backup"}
        </button>
      </div>
    </div>
  );
};

export default BackupHeader;
