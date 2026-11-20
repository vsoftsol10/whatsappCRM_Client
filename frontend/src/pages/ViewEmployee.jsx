import { Navigate } from "react-router-dom";

// Employee details now open as a popup on the Manage Employees page
// (components/employee/ViewEmployeeModal.jsx). This route only stays so old
// links to /employees/:id still land somewhere useful.
const ViewEmployee = () => <Navigate to="/employees" replace />;

export default ViewEmployee;
