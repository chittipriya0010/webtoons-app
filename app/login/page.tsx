'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('alex@example.com');
    const [password, setPassword] = useState('password123');
    const [result, setResult] = useState('');

    const handleLogin = async () => {
        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });
        setResult(JSON.stringify(res, null, 2));
    };

    return (
        <div style={{ padding: 40 }}>
            <h1>Test Login</h1>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
            <br />
            <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                type="password"
            />
            <br />
            <button onClick={handleLogin}>Login</button>
            <pre>{result}</pre>
        </div>
    );
}