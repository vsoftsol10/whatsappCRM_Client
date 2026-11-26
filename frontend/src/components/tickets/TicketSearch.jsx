// function TicketSearch({ searchTerm, setSearchTerm }) {
//   return (
//     <input
//       type="text"
//       aria-label="Search tickets"
//       placeholder="Search tickets..."
//       value={searchTerm}
//       onChange={(e) => setSearchTerm(e.target.value)}
//       className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
//     />
//   );
// }

// export default TicketSearch;


function TicketSearch({ searchTerm, setSearchTerm }) {
  return (
    <input
      type="text"
      aria-label="Search tickets"
      placeholder="Search tickets..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="h-12 w-full min-w-0 rounded-xl sm:flex-1 border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
    />
  );
}

export default TicketSearch;
