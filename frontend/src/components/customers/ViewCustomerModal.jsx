import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getCustomerById } from "../../api/customerApi";
import toast from "react-hot-toast";

function ViewCustomerModal({ customerId, onClose }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);

        const data = await getCustomerById(customerId);

        setCustomer(data.customer);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch customer");
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between bg-[#25D366] px-5 py-5 sm:px-8 sm:py-6">

          <div>
            <h1 className="text-2xl font-bold text-black sm:text-3xl">
              Customer Profile
            </h1>

            <p className="mt-1 text-gray-800">
              View customer information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white p-2 shadow transition hover:bg-gray-100"
          >
            <X size={22} />
          </button>

        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center p-10">
            <p className="text-gray-600">
              Loading customer...
            </p>
          </div>
        )}

        {/* Customer Details */}
        {!loading && customer && (
          <div className="p-5 sm:p-8">

            {/* Customer Information */}
            <div className="mb-8">

              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Customer Information
              </h2>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                {/* Name */}
                <div>
                  <p className="text-sm text-gray-500">
                    Name
                  </p>

                  <p className="break-all font-semibold text-gray-900">
                    {customer.name}
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <p className="text-sm text-gray-500">
                    Phone
                  </p>

                  <p className="font-semibold text-gray-900">
                    {customer.phone}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-sm text-gray-500">
                    Email
                  </p>

                  <p className="break-all font-semibold text-gray-900">
                    {customer.email || "-"}
                  </p>
                </div>

                {/* Company */}
                <div>
                  <p className="text-sm text-gray-500">
                    Company
                  </p>

                  <p className="font-semibold text-gray-900">
                    {customer.companyName || "-"}
                  </p>
                </div>

                {/* Source */}
                <div>
                  <p className="text-sm text-gray-500">
                    Source
                  </p>

                  <p className="font-semibold text-gray-900">
                    {customer.source || "-"}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-sm text-gray-500">
                    Status
                  </p>

                  <span
                    className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                      customer.status === "ACTIVE"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {customer.status}
                  </span>
                </div>

                {/* Requirements */}
                <div className="sm:col-span-2">

                  <p className="text-sm text-gray-500">
                    Requirements
                  </p>

                  <p className="whitespace-pre-wrap break-words font-semibold text-gray-900">
                    {customer.requirements || "-"}
                  </p>

                </div>

                {/* Created At */}
                <div>
                  <p className="text-sm text-gray-500">
                    Created At
                  </p>

                  <p className="font-semibold text-gray-900">
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

                {/* Updated At */}
                <div>
                  <p className="text-sm text-gray-500">
                    Updated At
                  </p>

                  <p className="font-semibold text-gray-900">
                    {customer.updatedAt
                      ? new Date(customer.updatedAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

              </div>

            </div>

            {/* Activity Timeline */}
            <div className="border-t border-gray-200 pt-8">

              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Activity Timeline
              </h2>

              <div className="space-y-5">

                <div className="border-l-4 border-[#25D366] pl-4">

                  <h3 className="font-semibold text-gray-900">
                    Customer Created
                  </h3>

                  <p className="text-sm text-gray-500">
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleString()
                      : "-"}
                  </p>

                </div>

                <div className="border-l-4 border-blue-500 pl-4">

                  <h3 className="font-semibold text-gray-900">
                    Profile Updated
                  </h3>

                  <p className="text-sm text-gray-500">
                    {customer.updatedAt
                      ? new Date(customer.updatedAt).toLocaleString()
                      : "-"}
                  </p>

                </div>

              </div>

            </div>

            {/* Close */}
            <div className="mt-8 flex justify-end border-t border-gray-200 pt-4">

              <button
                type="button"
                onClick={onClose}
                className="crm-secondary-button"
              >
                Close
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}

export default ViewCustomerModal;