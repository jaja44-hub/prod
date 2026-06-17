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

  const [openSections, setOpenSections] = React.useState(() => Object.fromEntries(sections.map(s => [s.title, false])));

  const toggleSection = (title) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const openSectionAndExpand = (title) => {
    if (!sidebarExpanded) {
      expand();
      // give expand a tick before opening
      setTimeout(() => setOpenSections((prev) => ({ ...prev, [title]: true })), 120);
    } else {
      toggleSection(title);
    }
  };

  return (
    <aside className={`${sidebarExpanded ? 'w-64' : 'w-20'} bg-white dark:bg-gray-900 min-h-screen h-screen border-r shrink-0 relative transition-all duration-300`}>
      <div className="p-3">
        {/* Header area with title and collapse control */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold truncate">Production</div>
          <button
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            onClick={() => { sidebarExpanded ? collapse() : expand(); }}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded"
          >
            {sidebarExpanded ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Collapsed-symbols view (icons only) */}
        {!sidebarExpanded && (
          <div className="flex flex-col gap-2 items-center">
            {sections.map((s) => (
              <button
                key={s.title}
                onClick={() => openSectionAndExpand(s.title)}
                title={s.title}
                className="w-10 h-10 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={`Open ${s.title}`}
              >
                <span className="text-sm font-medium">{s.title.charAt(0)}</span>
              </button>
            ))}
            <div className="mt-2 w-full" />
          </div>
        )}

        {/* Expanded full view */}
        {sidebarExpanded && (
          <nav className="mt-2">
            {sections.map((section) => {
              const open = !!openSections[section.title];
              return (
                <div key={section.title} className="mb-4">
                  <div className="flex items-center justify-between cursor-pointer" role="button" tabIndex={0} onClick={() => toggleSection(section.title)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleSection(section.title); }} aria-expanded={open} aria-controls={`sec-${section.title.replace(/\s+/g, '-')}`}>
                    <div className="text-xs text-gray-500 uppercase font-medium truncate">{section.title}</div>
                    <div className={`transform transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div id={`sec-${section.title.replace(/\s+/g, '-')}`} className={`overflow-hidden transition-[max-height] duration-300`} style={{ maxHeight: open ? 600 : 0 }}>
                    <ul className="mt-2">
                      {section.items.map((item) => (
                        <li key={item.to} className="mb-1">
                          <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                              `block text-sm px-2 py-1 rounded whitespace-nowrap overflow-hidden truncate ${isActive ? 'text-violet-600' : 'text-gray-700 hover:text-gray-900'}`
                            }
                          >
                            <span className="text-sm truncate">{item.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </nav>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
