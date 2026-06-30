import pool from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'You must be logged in' },
                { status: 401 }
            );
        }

        const { slug } = await params;
        const { episodeId, scrollPosition } = await request.json();
        const userId = session.user.id;

        const [seriesRows] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM series WHERE slug = ?',
            [slug]
        );

        if (seriesRows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Series not found' },
                { status: 404 }
            );
        }

        const seriesId = seriesRows[0].id;

        await pool.query(
            `INSERT INTO reading_progress (user_id, series_id, last_episode_id, scroll_position)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE last_episode_id = ?, scroll_position = ?`,
            [userId, seriesId, episodeId, scrollPosition, episodeId, scrollPosition]
        );

        return NextResponse.json({ success: true, message: 'Progress updated' });
    } catch (error) {
        console.error('Error updating progress:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update progress' },
            { status: 500 }
        );
    }
}