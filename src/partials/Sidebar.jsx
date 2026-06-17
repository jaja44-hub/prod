import React from "react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";

function Sidebar() {
  const { sidebarExpanded, setSidebarExpanded, collapse, expand } = useSidebar();

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
    <aside className={`${sidebarExpanded ? 'w-64' : 'w-20'} bg-white dark:bg-gray-900 min-h-screen h-screen border-r shrink-0 relative transition-width duration-200`}>
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Production</div>
          <button
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            onClick={() => { sidebarExpanded ? collapse() : expand(); }}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded"
          >
            {sidebarExpanded ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
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
