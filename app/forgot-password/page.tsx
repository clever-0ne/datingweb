'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send reset email.');
        return;
      }

      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Email Sent ✅</h1>
          <p style={styles.successText}>
            Check your email for a password reset link. The link will expire in 24 hours.
          </p>
          <p style={styles.note}>Didn't receive it? Check your spam folder.</p>
          <Link href="/login" style={styles.button}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset Your Password</h1>
        <p style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.group}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
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
    marginBottom: '10px',
    textAlign: 'center',
  } as React.CSSProperties,
  subtitle: {
    color: '#888',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '30px',
    lineHeight: '1.5',
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
  submitButton: {
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
  button: {
    display: 'inline-block',
    padding: '12px 30px',
    backgroundColor: '#0066ff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: '20px',
  } as React.CSSProperties,
  errorBox: {
    padding: '12px',
    backgroundColor: '#3d2626',
    color: '#ff6b6b',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
  } as React.CSSProperties,
  successText: {
    color: '#4caf50',
    textAlign: 'center',
    fontSize: '16px',
    marginBottom: '15px',
  } as React.CSSProperties,
  note: {
    color: '#888',
    textAlign: 'center',
    fontSize: '12px',
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
