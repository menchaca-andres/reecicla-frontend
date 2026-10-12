import { useEffect, useState } from 'react';
import { AdminManager } from './AdminManager';
import { AuthPage } from '../../auth/components/AuthPage';
import { Navbar } from '../../../components/Navbar';
import { ApiService } from '../../../services/api';
import type { PlatformAuthResponse } from '../../../types';
import styles from '../PlatformAdminPage.module.css';

const PLATFORM_TOKEN_KEY = 'reecicla_platform_token';

interface PlatformAdmin {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN';
}

export function PlatformAdminPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(PLATFORM_TOKEN_KEY));
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(PLATFORM_TOKEN_KEY)));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    ApiService.getPlatformProfile(token)
      .then(({ user }) => setAdmin(user))
      .catch((requestError: Error) => {
        localStorage.removeItem(PLATFORM_TOKEN_KEY);
        setToken(null);
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleLoginSuccess = (result: PlatformAuthResponse) => {
    localStorage.setItem(PLATFORM_TOKEN_KEY, result.token);
    setAdmin(result.user);
    setToken(result.token);
    setError(null);
  };

  const signOut = () => {
    localStorage.removeItem(PLATFORM_TOKEN_KEY);
    setToken(null);
    setAdmin(null);
  };

  if (loading) {
    return <main className={styles.loading}>Cargando administración...</main>;
  }

  if (token && admin) {
    return (
      <div className={styles.page}>
        <Navbar mode="platform" admin={admin} onLogout={signOut} />
        <main className={styles.content}>
          <AdminManager token={token} />
        </main>
      </div>
    );
  }

  return (
    <AuthPage
      mode="platform"
      onPlatformSuccess={handleLoginSuccess}
      onCancel={() => window.location.assign('/recicla/demo')}
      initialError={error}
    />
  );
}
