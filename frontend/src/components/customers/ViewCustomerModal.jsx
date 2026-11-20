import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { getCustomerById } from "../../api/customerApi";
import { toLocalPhone } from "../../utils/customerFormat";
import {
  CustomerModal,
  CustomerFields,
  CustomerModalFooter,
  secondaryButtonClass,
} from "./CustomerForm";

const noop = () => {};

// Read-only view of one customer. "Edit" hands over to the edit modal.
function ViewCustomerModal({ customerId, onClose, onEdit }) {
  const [values, setValues] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);

        const data = await getCustomerById(customerId);
        const customer = data.customer;

        setValues({
          name: customer.name || "",
          phone: toLocalPhone(customer.phone),
          email: customer.email || "",
          company: customer.companyName || "",
          source: customer.source || "",
          requirements: customer.requirements || "",
          status: customer.status || "ACTIVE",
          serviceIds: (customer.services || []).map((s) => s.id),
        });
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
    <CustomerModal
      title="View Customer"
      onClose={onClose}
      action={
        values && onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-green-500 bg-green-50 px-5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
          >
            <Pencil size={16} />
            Edit
          </button>
        ) : null
      }
    >
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          <span>Loading customer...</span>
        </div>
      ) : !values ? (
        <p className="py-12 text-center text-slate-500">
          This customer could not be loaded.
        </p>
      ) : (
        <CustomerFields
          values={values}
          onChange={noop}
          onServicesChange={noop}
          readOnly
        />
      )}

      <CustomerModalFooter>
        <button
          type="button"
          onClick={onClose}
          className={secondaryButtonClass}
        >
          Close
        </button>
      </CustomerModalFooter>
    </CustomerModal>
  );
}

export default ViewCustomerModal;