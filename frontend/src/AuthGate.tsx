import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import App from './App';
import LoginPage from './pages/LoginPage';
import { authApi } from './api/authApi';
import { tokenStorage } from './api/client';
import { User } from './types/auth';

export default function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(() => tokenStorage.get() !== null);

  useEffect(() => {
    if (!tokenStorage.get()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => authApi.logout())
      .finally(() => setChecking(false));
  }, []);

function handleLogout() {
    authApi.logout();
    setUser(null);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0e14]">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!user) return <LoginPage onLoggedIn={setUser} />;

  return <App user={user} onLogout={handleLogout} />;
}
