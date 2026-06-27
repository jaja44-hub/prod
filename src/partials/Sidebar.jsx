import React from "react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { useLang } from "../context/LangContext";

function Sidebar() {
  const { sidebarOpen, toggle, sidebarExpanded, setSidebarExpanded, collapse, expand } = useSidebar();

  const { lang, setLang, t } = useLang();

  const sections = [
    {
      title: "Operations",
      items: [
        { to: "/dashboard", label: t('dashboard') },
        { to: "/inventory", label: t('inventory') },
        { to: "/work-orders", label: t('workOrders') },
        { to: "/orders", label: t('orders') },
      ],
    },
    {
      title: "Procurement",
      items: [
        { to: "/procurement", label: t('procurement') },
        { to: "/purchasing", label: t('purchasing') },
        { to: "/suppliers", label: t('vendors') },
      ],
    },
    {
      title: "Quality & Logistics",
      items: [
        { to: "/qc", label: t('qc') },
        { to: "/logistics", label: t('logistics') },
      ],
    },
    {
      title: "Finance",
      items: [
        { to: "/reports", label: t('reports') },
        { to: "/invoices", label: t('invoices') },
      ],
    },
    {
      title: "People",
      items: [
        { to: "/employees", label: t('employees') },
        { to: "/payroll", label: t('payroll') },
      ],
    },
    {
      title: "Sales & CRM",
      items: [
        { to: "/sales", label: t('sales') },
        { to: "/customers", label: t('customers') },
      ],
    },
  ];

  const [openSections, setOpenSections] = React.useState(() => Object.fromEntries(sections.map(s => [s.title, false])));

  const icons = {
    Operations: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 13h8V3H3v10zM13 21h8v-8h-8v8zM13 3v6h8V3h-8zM3 21h8v-6H3v6z" fill="currentColor" />
      </svg>
    ),
    Procurement: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18v2H3V6zm2 4h14v10H5V10z" fill="currentColor" />
      </svg>
    ),
    "Quality & Logistics": (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" fill="currentColor" />
      </svg>
    ),
    Finance: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 1v22M5 5h14M5 19h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    People: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM6 11c1.657 0 3-1.343 3-3S7.657 5 6 5 3 6.343 3 8s1.343 3 3 3zM2 20c0-2.5 4-4 10-4s10 1.5 10 4v1H2v-1z" fill="currentColor" />
      </svg>
    ),
    "Sales & CRM": (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 7l-6 6-4-4-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

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

  const nextLang = lang === 'en' ? 'am' : 'en';
  const nextLangLabel = lang === 'en' ? 'አማርኛ' : 'English';

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 transition-opacity duration-300 lg:hidden ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        onClick={toggle}
        aria-hidden="true"
      />
      <aside
        id="sidebar"
        className={`${sidebarExpanded ? 'w-64' : 'w-20'} fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-gray-900 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-3 flex flex-col h-full justify-between">
          {/* Header area with title and collapse control */}
          <div className="mb-3 flex items-center justify-between">
            <div className="hidden lg:block text-sm font-semibold truncate">Production</div>
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
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{icons[s.title] || s.title.charAt(0)}</span>
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

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setLang(nextLang)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            aria-label={`Switch language to ${nextLangLabel}`}
          >
            {sidebarExpanded ? nextLangLabel : <span className="sr-only">{nextLangLabel}</span>}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}

export default Sidebar;
