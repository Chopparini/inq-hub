import React, { useState } from 'react';
import { Boxes, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '../api/authApi';
import { User } from '../types/auth';

type Mode = 'login' | 'register';

interface LoginPageProps {
  onLoggedIn: (user: User) => void;
}

export default function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword('');
    setPassword2('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && password !== password2) {
      setError('Hasła nie są takie same');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        await authApi.register({ username, firstName, lastName, email, password });
      }
      await authApi.login(username, password);
      onLoggedIn(await authApi.me());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0b0e14] text-slate-200 font-sans p-4">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-[#0e131f] border border-slate-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="logo-badge">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-lg text-white">Hanka i Kartony</h1>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl bg-slate-900/60">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`py-2 rounded-lg text-sm font-medium transition ${
                mode === m ? 'bg-purple-600/30 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'login' ? 'Logowanie' : 'Rejestracja'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input"
            placeholder="Nazwa użytkownika"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input"
                  placeholder="Imię"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  className="input"
                  placeholder="Nazwisko"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
              <input
                className="input"
                type="email"
                placeholder="E-mail"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </>
          )}
          <input
            className="input"
            type="password"
            placeholder="Hasło"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {mode === 'register' && (
            <input
              className="input"
              type="password"
              placeholder="Powtórz hasło"
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
            />
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Zaloguj się' : 'Załóż konto'}
          </button>
        </form>
      </div>
    </div>
  );
}
