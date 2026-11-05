import React, { useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { api } from '../api';
import { User } from '../types';

interface SignInPageProps {
  onLoginSuccess: (user: User) => void;
  onBack: () => void;
}

const DEMO_ACCOUNTS = [
  { role: 'Doctor', name: 'Dr. Arjun Smith', username: 'dr.smith', password: 'doctor123' },
  { role: 'Nurse', name: 'Mary D’Souza', username: 'nurse.mary', password: 'nurse123' },
  { role: 'Nurse', name: 'Sarah Khan', username: 'nurse.sarah', password: 'nurse123' },
];

// Full-page sign in, laid out like a booking page: header with a centred wordmark, a
// rotated marquee title down the left, the demo accounts in the middle column and the
// form on the right. Everything animates in once the page has risen into place.
export const SignInPage: React.FC<SignInPageProps> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.login(username.trim(), password.trim());
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <main className="signin-page">
      <header className="signin-page__header">
        <span className="signin-page__brand" aria-hidden="true">
          <Stethoscope className="h-5 w-5" />
        </span>
        <span className="signin-page__wordmark" aria-label="MediTrack">
          MediTrack
        </span>
        <button type="button" className="signin-page__link" onClick={onBack}>
          Back
        </button>
      </header>

      <div className="signin-page__layout">
        <div className="signin-page__vertical-title" aria-hidden="true">
          <div className="signin-page__marquee">
            <span>Staff sign in</span>
            <span>Staff sign in</span>
            <span>Staff sign in</span>
            <span>Staff sign in</span>
          </div>
        </div>

        <section className="signin-page__details" aria-labelledby="signin-page-title">
          <h1 id="signin-page-title">Sign in to your clinic.</h1>
          <div className="signin-page__channels">
            {DEMO_ACCOUNTS.map(account => (
              <button
                key={account.username}
                type="button"
                className="signin-page__account"
                onClick={() => fillDemo(account.username, account.password)}
                aria-label={`Fill the form with the ${account.role.toLowerCase()} demo account ${account.name}`}
              >
                <span className="signin-page__account-role">{account.role}</span>
                <span className="signin-page__account-name">{account.name}</span>
                <span className="signin-page__account-user">{account.username}</span>
              </button>
            ))}
          </div>
        </section>

        <form className="signin-page__form" aria-label="Staff sign in" onSubmit={handleSubmit}>
          <div className="signin-page__form-heading">Staff sign in</div>
          {error && (
            <p className="signin-page__error" role="alert">
              {error}
            </p>
          )}
          <label className="signin-page__field">
            <span>Username*</span>
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="signin-page__field">
            <span>Password*</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="signin-page__submit" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
};
