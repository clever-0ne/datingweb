'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link. Token is missing.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Invalid Reset Link</h1>
          <p style={styles.error}>The password reset link is invalid or has expired.</p>
          <Link href="/login" style={styles.link}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Password Reset Successful ✅</h1>
          <p style={styles.success}>Your password has been reset. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset Your Password</h1>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p style={styles.link}>
          Remember your password? <Link href="/login" style={styles.linkText}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    padding: '20px',
  } as React.CSSProperties,
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    border: '1px solid #333',
  } as React.CSSProperties,
  title: {
    color: '#ffffff',
    fontSize: '28px',
    marginBottom: '30px',
    textAlign: 'center',
  } as React.CSSProperties,
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  } as React.CSSProperties,
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  } as React.CSSProperties,
  label: {
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: '500',
  } as React.CSSProperties,
  input: {
    padding: '12px',
    backgroundColor: '#222',
    border: '1px solid #333',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '14px',
  } as React.CSSProperties,
  button: {
    padding: '12px',
    backgroundColor: '#0066ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
  } as React.CSSProperties,
  errorBox: {
    padding: '12px',
    backgroundColor: '#3d2626',
    color: '#ff6b6b',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
  } as React.CSSProperties,
  success: {
    color: '#4caf50',
    textAlign: 'center',
    fontSize: '16px',
  } as React.CSSProperties,
  error: {
    color: '#ff6b6b',
    textAlign: 'center',
    fontSize: '14px',
    marginBottom: '20px',
  } as React.CSSProperties,
  link: {
    textAlign: 'center',
    color: '#888',
    fontSize: '14px',
    marginTop: '20px',
  } as React.CSSProperties,
  linkText: {
    color: '#0066ff',
    textDecoration: 'none',
    fontWeight: 'bold',
  } as React.CSSProperties,
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
