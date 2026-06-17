import React from "react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";

function Sidebar() {
  const { sidebarExpanded } = useSidebar();

  const sections = [
    {
      title: "Operations",
      items: [
        { to: "/dashboard", label: "Dashboard" },
        { to: "/inventory", label: "Inventory" },
        { to: "/work-orders", label: "Work Orders" },
        { to: "/orders", label: "Orders" },
      ],
    },
    {
      title: "Procurement",
      items: [
        { to: "/procurement", label: "Procurement" },
        { to: "/purchasing", label: "Purchasing" },
        { to: "/suppliers", label: "Suppliers" },
      ],
    },
    {
      title: "Quality & Logistics",
      items: [
        { to: "/qc", label: "QC" },
        { to: "/logistics", label: "Logistics" },
      ],
    },
    {
      title: "Finance",
      items: [
        { to: "/reports", label: "Reports" },
        { to: "/invoices", label: "Invoices" },
      ],
    },
    {
      title: "People",
      items: [
        { to: "/employees", label: "Employees" },
        { to: "/payroll", label: "Payroll" },
      ],
    },
    {
      title: "Sales & CRM",
      items: [
        { to: "/sales", label: "Sales" },
        { to: "/customers", label: "Customers" },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 h-full border-r">
      <div className="p-4">
        <div className="mb-6">
          <div className="text-lg font-semibold">Production</div>
        </div>
        <nav>
          {sections.map((section) => (
            <div key={section.title} className="mb-6">
              <div className="text-xs text-gray-500 uppercase font-medium mb-2">{section.title}</div>
              <ul>
                {section.items.map((item) => (
                  <li key={item.to} className="mb-1">
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        "block text-sm px-2 py-1 rounded " + (isActive ? "text-violet-600" : "text-gray-700 hover:text-gray-900")
                      }
                    >
                      <span className={sidebarExpanded ? "opacity-100" : "opacity-100"}>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
