'use client';

import { useState } from 'react';

export default function TestUploadPage() {
    const [result, setResult] = useState('');

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        setResult(JSON.stringify(data, null, 2));
    };

    return (
        <div style={{ padding: 40 }}>
            <h1>Test Image Upload</h1>
            <input type="file" accept="image/*" onChange={handleUpload} />
            <pre>{result}</pre>
        </div>
    );
}