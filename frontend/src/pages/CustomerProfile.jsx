
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCustomerById } from "../api/customerApi";
import { FaArrowLeft } from "react-icons/fa";

function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const data = await getCustomerById(id);
        setCustomer(data.customer);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCustomer();
  }, [id]);

  if (!customer) {
    return (
      <div className="crm-page flex items-center justify-center text-gray-700">
        Loading...
      </div>
    );
  }

  return (
    <div className="crm-page">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">

          <button
            onClick={() => navigate("/customers")}
            className="
              bg-white 
              border 
              border-gray-200
              hover:bg-gray-100
              p-3 
              rounded-lg 
              transition
              shadow-sm
            "
          >
            <FaArrowLeft className="text-[#25D366]" />
          </button>

          <h1 className="crm-title">
            Customer Profile
          </h1>

        </div>


        {/* Customer Information */}
        <div className="crm-page-surface mb-8 p-5 sm:p-8">

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Customer Information
          </h2>


          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

            <div>
              <p className="text-gray-500 text-sm">
                Name
              </p>
              <p className="break-all font-semibold text-gray-900">
                {customer.name}
              </p>
            </div>


            <div>
              <p className="text-gray-500 text-sm">
                Phone
              </p>
              <p className="font-semibold text-gray-900">
                {customer.phone}
              </p>
            </div>


            <div>
              <p className="text-gray-500 text-sm">
                Email
              </p>
              <p className="font-semibold text-gray-900">
                {customer.email || "-"}
              </p>
            </div>


            <div>
              <p className="text-gray-500 text-sm">
                Company
              </p>
              <p className="font-semibold text-gray-900">
                {customer.companyName || "-"}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Source
              </p>

              <p className="font-semibold text-gray-900">
                {customer.source || "-"}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-gray-500 text-sm">
                Requirements
              </p>

              <p className="whitespace-pre-wrap break-words font-semibold text-gray-900">
                {customer.requirements || "-"}
              </p>
            </div>


            <div>
              <p className="text-gray-500 text-sm">
                Status
              </p>

              <span
                className="
                  inline-block
                  mt-1
                  px-3
                  py-1
                  rounded-full
                  text-sm
                  font-medium
                  bg-green-100
                  text-green-700
                "
              >
                {customer.status}
              </span>
            </div>


            <div>
              <p className="text-gray-500 text-sm">
                Created At
              </p>

              <p className="font-semibold text-gray-900">
                {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>

          </div>

        </div>



        {/* Activity Timeline */}
        <div className="crm-page-surface p-5 sm:p-8">

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Activity Timeline
          </h2>


          <div className="space-y-5">


            <div className="border-l-4 border-[#25D366] pl-4">

              <h3 className="font-semibold text-gray-900">
                Customer Created
              </h3>

              <p className="text-gray-500 text-sm">
                {new Date(customer.createdAt).toLocaleString()}
              </p>

            </div>



            <div className="border-l-4 border-blue-500 pl-4">

              <h3 className="font-semibold text-gray-900">
                Profile Updated
              </h3>

              <p className="text-gray-500 text-sm">
                {new Date(customer.updatedAt).toLocaleString()}
              </p>

            </div>


          </div>

        </div>


      </div>
    </div>
  );
}

export default CustomerProfile;