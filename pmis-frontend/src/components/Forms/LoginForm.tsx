import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { loginSchema } from '../../utils/validators';
import { LoginFormValues } from '../../types/index';

const LoginForm: React.FC = () => {
  const { loginUser, loading } = useAuth();
  const { t, i18n } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onChange',
  });

  const onSubmit = (data: LoginFormValues) => {
    loginUser(data.email, data.password, data.rememberMe);
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)} autoComplete="off" aria-label="Login form">
      <label htmlFor="email" className="font-semibold text-sm" aria-label={t('email')}>
        {t('email')}
      </label>
      <input
        {...register('email')}
        id="email"
        type="email"
        className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-200"
        aria-invalid={!!errors.email}
        aria-describedby="email-error"
        autoFocus
      />
      {errors.email && (
        <span id="email-error" className="text-red-600 text-xs" role="alert">
          {errors.email.message}
        </span>
      )}

      <label htmlFor="password" className="font-semibold text-sm" aria-label={t('password')}>
        {t('password')}
      </label>
      <input
        {...register('password')}
        id="password"
        type="password"
        className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-200"
        aria-invalid={!!errors.password}
        aria-describedby="password-error"
      />
      {errors.password && (
        <span id="password-error" className="text-red-600 text-xs" role="alert">
          {errors.password.message}
        </span>
      )}

      <div className="flex items-center gap-2">
        <input
          {...register('rememberMe')}
          id="rememberMe"
          type="checkbox"
          className="rounded border-gray-300"
        />
        <label htmlFor="rememberMe" className="text-sm">
          {t('rememberMe')}
        </label>
      </div>

      <button
        type="submit"
        className="bg-teal-700 text-white px-4 py-2 rounded font-semibold hover:bg-teal-600 disabled:opacity-60 mt-2"
        aria-busy={loading}
        disabled={loading}
      >
        {loading ? t('loading') : t('login')}
      </button>

      <div className="text-right mt-1">
        <a href="#" className="text-teal-600 underline text-xs">
          {t('forgotPassword')}
        </a>
      </div>
      <div className="flex mt-2 justify-center">
        <select
          aria-label="Select language"
          className="rounded border px-2 py-1 text-sm"
          value={i18n.language}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </div>
    </form>
  );
};

export default React.memo(LoginForm);
