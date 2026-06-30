import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        const [genres] = await pool.query<RowDataPacket[]>(
            'SELECT id, name FROM genres ORDER BY name ASC'
        );

        return NextResponse.json({ success: true, data: genres });
    } catch (error) {
        console.error('Error fetching genres:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch genres' },
            { status: 500 }
        );
    }
}