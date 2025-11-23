import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/Forms/LoginForm';
import { useTranslation } from 'react-i18next';

const LoginPage: React.FC = () => {
  const { isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
    return () => {
      clearError();
    };
  }, [isAuthenticated, navigate, clearError]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50" aria-label="Login screen">
      <div className="max-w-md w-full border rounded-lg bg-white shadow-lg p-8">
        <h1 className="text-xl font-bold text-center mb-4 text-teal-700">{t('login')}</h1>
        <LoginForm />
        {error && (
          <div className="mt-4 text-red-600 bg-red-100 p-2 rounded text-sm" role="alert">
            {t('error')}: {error}
          </div>
        )}
      </div>
    </main>
  );
};

export default React.memo(LoginPage);
