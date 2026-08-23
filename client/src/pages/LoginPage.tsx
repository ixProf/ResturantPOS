import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Languages, Sun, Moon, Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import api from '../services/api';
import type { AuthResponseDto, EmployeeRole } from '../types/api';

import logoImg from '../assets/logo.png';

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post<AuthResponseDto>('/Auth/login', {
        email,
        password,
      });

      login(response.data);
      navigate('/tables');
    } catch (err: any) {
      console.error('Login error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        t('auth.invalidCredentials');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: EmployeeRole) => {
    setError(null);
    setIsLoading(true);

    const emailMap: Record<EmployeeRole, string> = {
      Manager: 'manager@alaris.com',
      Waiter: 'waiter@alaris.com',
      Chef: 'chef@alaris.com',
      Cashier: 'cashier@alaris.com',
      InventoryManager: 'inventory@alaris.com',
    };

    const targetEmail = emailMap[role];
    const targetPassword = 'Password123!';
    setEmail(targetEmail);
    setPassword(targetPassword);

    try {
      const response = await api.post<AuthResponseDto>('/Auth/login', {
        email: targetEmail,
        password: targetPassword,
      });

      login(response.data);
      navigate('/tables');
    } catch (err: any) {
      // If user doesn't exist on backend yet, attempt auto-registration for seamless demo testing
      try {
        const regResponse = await api.post<AuthResponseDto>('/Auth/register', {
          fullName: `${role} Staff`,
          email: targetEmail,
          password: targetPassword,
          phone: '01000000000',
          role: role,
        });

        login(regResponse.data);
        navigate('/tables');
      } catch (regErr: any) {
        const msg = regErr.response?.data?.message || t('auth.invalidCredentials');
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-color)] text-[var(--fg-color)] flex flex-col justify-between p-6 transition-colors">
      {/* Top Bar Controls */}
      <div className="flex justify-between items-center w-full max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 gap-2">
          <Link to="/" className="flex items-center space-x-3 gap-3 group">
            <img src={logoImg} alt={t('app.logoAlt')} className="w-9 h-9 object-contain" />
            <div>
              <span className="font-bold text-lg brand-gradient-text tracking-tight">Alaris FlowX</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-2 gap-2">
          <Button variant="outline" size="sm" onClick={toggleLanguage}>
            <Languages className="w-4 h-4" />
            <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={toggleTheme} className="p-2">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <img
              src={logoImg}
              alt={t('app.logoAlt')}
              className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 object-contain"
            />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--fg-color)]">
              {t('auth.welcome')}
            </h1>
            <p className="text-xs text-[var(--muted-fg)] mt-2">{t('auth.enterCredentials')}</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Input
                label={t('auth.emailLabel')}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@alaris.com"
                className="ps-10"
              />
              <Mail className="w-4 h-4 absolute start-3 top-8.5 text-[var(--muted-fg)]" />
            </div>

            <div className="relative">
              <Input
                label={t('auth.passwordLabel')}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="ps-10"
              />
              <Lock className="w-4 h-4 absolute start-3 top-8.5 text-[var(--muted-fg)]" />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
            >
              {t('auth.login')}
            </Button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-8 pt-6 border-t border-[var(--border-color)] text-center">
            <p className="text-xs font-semibold text-[var(--muted-fg)] mb-3 uppercase tracking-wider">
              {t('auth.demoPresets')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['Manager', 'Waiter', 'Chef', 'Cashier', 'InventoryManager'] as EmployeeRole[]).map(
                (role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleDemoLogin(role)}
                    className="px-2 py-1.5 rounded-lg bg-[var(--secondary-bg)] border border-[var(--glass-border-color)] text-[11px] font-medium text-[var(--fg-color)] hover:bg-[var(--glass-card-bg)] transition-colors text-center truncate"
                  >
                    {role}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between max-w-6xl w-full mx-auto text-xs text-[var(--muted-fg)] gap-2">
        <div>&copy; 2026 Alaris FlowX System. All rights reserved.</div>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 gap-1.5 font-medium text-[var(--fg-color)] hover:text-[var(--primary-color)] transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>{t('about.aboutLink')}</span>
        </Link>
      </div>
    </div>
  );
};
