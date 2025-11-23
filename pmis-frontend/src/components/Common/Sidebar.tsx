import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const navItems = [
  { labelKey: 'dashboard', icon: <span>🏠</span>, path: '/' },
  { labelKey: 'projects', icon: <span>📁</span>, path: '/projects' },
  { labelKey: 'equipment', icon: <span>🛠️</span>, path: '/equipment' },
  { labelKey: 'budget', icon: <span>💰</span>, path: '/budget' },
  { labelKey: 'users', icon: <span>👤</span>, path: '/users', roles: ['admin'] },
  { labelKey: 'settings', icon: <span>⚙️</span>, path: '/settings' },
];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();
  const { currentUser, hasRole } = useAuth();

  const allowedNavs = navItems.filter(item => !item.roles || item.roles.some(role => hasRole(role)));

  return (
    <aside
      aria-label="Sidebar navigation"
      className={
        'h-full w-56 bg-white border-r transition-all duration-300 ease-in-out flex flex-col ' +
        (collapsed ? 'w-16' : 'w-56')
      }
    >
      <button
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="p-2 m-2 rounded hover:bg-gray-100 focus:outline-none self-end"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        {collapsed ? <span>➡️</span> : <span>⬅️</span>}
      </button>
      <nav className="flex flex-col gap-2 flex-1 mt-4" aria-label="Main sidebar">
        {allowedNavs.map(item => (
          <a
            key={item.path}
            href={item.path}
            className="flex items-center gap-3 px-4 py-2 text-gray-700 rounded hover:bg-gray-100 focus:bg-teal-50 group"
            tabIndex={0}
            aria-current={window.location.pathname === item.path ? 'page' : undefined}
          >
            <span className="text-xl" aria-hidden="true">{item.icon}</span>
            <span className={collapsed ? 'sr-only' : 'font-medium'}>{t(item.labelKey)}</span>
          </a>
        ))}
      </nav>
      <div className="p-4 text-xs text-gray-400 text-center hidden md:block">
        Powered by PMIS
      </div>
    </aside>
  );
};

export default React.memo(Sidebar);
