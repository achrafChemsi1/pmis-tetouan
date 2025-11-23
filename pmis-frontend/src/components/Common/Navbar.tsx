import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const { currentUser, logoutUser } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLangChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <header className="flex items-center justify-between bg-white border-b h-14 px-4 shadow-sm">
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Logo" className="h-8 w-8" />
        <span className="font-bold text-lg text-teal-700 select-none">PMIS</span>
      </div>
      <nav aria-label="Main Navigation" className="flex-1">
        <input
          className="max-w-xs px-2 py-1 ml-8 border rounded text-sm bg-gray-100 focus:outline-none"
          type="search"
          placeholder={t('search')}
          aria-label={t('search')}
        />
      </nav>
      <div className="flex items-center gap-4">
        <button
          aria-label="Toggle theme"
          className="rounded-full bg-gray-100 p-2 hover:bg-gray-200 focus:outline-none"
        >🌙</button>
        <select
          aria-label="Select language"
          className="rounded border px-2 py-1 text-sm"
          value={i18n.language}
          onChange={handleLangChange}
        >
          <option value="fr">Fr</option>
          <option value="en">En</option>
        </select>
        <button
          onClick={logoutUser}
          className="ml-2 px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
        >
          {t('logout')}
        </button>
        <span className="ml-3 text-gray-700 font-semibold" aria-live="polite">
          {currentUser?.name}
        </span>
      </div>
    </header>
  );
};

export default React.memo(Navbar);
