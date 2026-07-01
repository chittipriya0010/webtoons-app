'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');

    // then in JSX, below the error div:
    {
        registered && (
            <div className={styles.success}>
                Account created! Sign in below.
            </div>
        )
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (res?.ok) {
            router.push('/');
        } else {
            setError('Invalid email or password. Please try again.');
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <a href="/" className={styles.logo}>WEBTOONS</a>
                <h1 className={styles.title}>Welcome back</h1>
                <p className={styles.subtitle}>Sign in to continue reading</p>

                {error && <div className={styles.error}>{error}</div>}

                <form className={styles.form} onSubmit={handleLogin}>
                    <div className={styles.field}>
                        <label className={styles.label}>Email</label>
                        <input
                            className={styles.input}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Password</label>
                        <input
                            className={styles.input}
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button className={styles.btn} type="submit" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className={styles.footer}>
                    Don&apos;t have an account?{' '}
                    <a href="/signup" className={styles.link}>Create one</a>
                </p>
            </div>
        </div>
    );
}