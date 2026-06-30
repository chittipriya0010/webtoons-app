import pool from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'You must be logged in to like an episode' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const userId = session.user.id;

        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM episode_likes WHERE user_id = ? AND episode_id = ?',
            [userId, id]
        );

        if (existing.length > 0) {
            await pool.query(
                'DELETE FROM episode_likes WHERE user_id = ? AND episode_id = ?',
                [userId, id]
            );
            return NextResponse.json({ success: true, liked: false });
        } else {
            await pool.query(
                'INSERT INTO episode_likes (user_id, episode_id) VALUES (?, ?)',
                [userId, id]
            );
            return NextResponse.json({ success: true, liked: true });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to toggle like' },
            { status: 500 }
        );
    }
}