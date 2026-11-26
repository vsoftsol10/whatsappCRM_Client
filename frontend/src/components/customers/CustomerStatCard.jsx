// import { Users } from "lucide-react";
// import { FaWhatsapp, FaInstagram, FaFacebookF } from "react-icons/fa";

// // Four summary cards: all customers, then how many came from each channel.
// function CustomerStatCard({
//   totalCustomers,
//   whatsappCustomers,
//   instagramCustomers,
//   facebookCustomers,
// }) {
//   const cards = [
//     {
//       key: "ALL",
//       title: "All Customers",
//       value: totalCustomers,
//       badgeBg: "bg-green-100",
//       icon: <Users size={22} className="text-green-600" />,
//     },
//     {
//       key: "WHATSAPP",
//       title: "WhatsApp",
//       value: whatsappCustomers,
//       badgeBg: "bg-green-100",
//       icon: (
//         <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
//           <FaWhatsapp size={19} className="text-white" />
//         </span>
//       ),
//     },
//     {
//       key: "INSTAGRAM",
//       title: "Instagram",
//       value: instagramCustomers,
//       badgeBg: "bg-pink-100",
//       icon: (
//         <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
//           <FaInstagram size={18} className="text-white" />
//         </span>
//       ),
//     },
//     {
//       key: "FACEBOOK",
//       title: "Facebook",
//       value: facebookCustomers,
//       badgeBg: "bg-blue-100",
//       icon: (
//         <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
//           <FaFacebookF size={15} className="text-white" />
//         </span>
//       ),
//     },
//   ];

//   return (
//     <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
//       {cards.map((card) => (
//         <div
//           key={card.key}
//           className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
//         >
//           <div>
//             <p className="text-sm text-slate-500">{card.title}</p>

//             <p className="mt-2 text-4xl font-bold text-slate-900">
//               {card.value}
//             </p>
//           </div>

//           <div
//             className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.badgeBg}`}
//           >
//             {card.icon}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

// export default CustomerStatCard;



import { Users } from "lucide-react";
import { FaWhatsapp, FaInstagram, FaFacebookF } from "react-icons/fa";

// Four summary cards: all customers, then how many came from each channel.
function CustomerStatCard({
  totalCustomers,
  whatsappCustomers,
  instagramCustomers,
  facebookCustomers,
}) {
  const cards = [
    {
      key: "ALL",
      title: "All Customers",
      value: totalCustomers,
      badgeBg: "bg-green-100",
      icon: <Users size={22} className="text-green-600" />,
    },
    {
      key: "WHATSAPP",
      title: "WhatsApp",
      value: whatsappCustomers,
      badgeBg: "bg-green-100",
      icon: (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
          <FaWhatsapp size={19} className="text-white" />
        </span>
      ),
    },
    {
      key: "INSTAGRAM",
      title: "Instagram",
      value: instagramCustomers,
      badgeBg: "bg-pink-100",
      icon: (
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
          <FaInstagram size={18} className="text-white" />
        </span>
      ),
    },
    {
      key: "FACEBOOK",
      title: "Facebook",
      value: facebookCustomers,
      badgeBg: "bg-blue-100",
      icon: (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
          <FaFacebookF size={15} className="text-white" />
        </span>
      ),
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 xl:gap-5">
      {cards.map((card) => (
        <div
          key={card.key}
          className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="min-w-0">
            <p className="text-xs text-slate-500 sm:text-sm">{card.title}</p>

            <p className="mt-2 text-3xl font-bold sm:text-4xl text-slate-900">
              {card.value}
            </p>
          </div>

          <div
            className={`flex h-11 w-11 shrink-0 items-center sm:h-14 sm:w-14 justify-center rounded-2xl ${card.badgeBg}`}
          >
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CustomerStatCard;