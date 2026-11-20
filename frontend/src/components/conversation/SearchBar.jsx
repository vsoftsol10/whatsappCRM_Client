// import { FaSearch } from "react-icons/fa";

// function SearchBar({ searchTerm, setSearchTerm }) {
//   return (
//     <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-3 py-3">
//       <div className="flex items-center gap-3 rounded-full bg-gray-100 px-4 py-2.5 transition focus-within:ring-2 focus-within:ring-[#DCF8C6]">
//         <FaSearch className="text-sm text-gray-500" />

//         <input
//           type="text"
//           placeholder="Search or start new chat"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-500"
//         />
//       </div>
//     </div>
//   );
// }

// export default SearchBar;

import { FaSearch } from "react-icons/fa";

function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <div className="px-4 pb-3">
      <label className="flex items-center gap-3 rounded-full bg-gray-100 px-4 py-3 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#22C55E]/40">
        <FaSearch className="shrink-0 text-sm text-gray-500" aria-hidden="true" />

        <input
          type="text"
          placeholder="Search chats"
          aria-label="Search chats"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-500"
        />
      </label>
    </div>
  );
}

export default SearchBar;