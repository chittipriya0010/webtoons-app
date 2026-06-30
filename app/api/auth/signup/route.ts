import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';

export async function POST(request: NextRequest) {
    try {
        const { username, email, password } = await request.json();

        if (!username || !email || !password) {
            return NextResponse.json(
                { success: false, error: 'Username, email, and password are required' },
                { status: 400 }
            );
        }

        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Username or email already in use' },
                { status: 409 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (id, username, email, password_hash, role) VALUES (UUID(), ?, ?, ?, ?)',
            [username, email, passwordHash, 'reader']
        );

        return NextResponse.json(
            { success: true, message: 'Account created successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error during signup:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create account' },
            { status: 500 }
        );
    }
}