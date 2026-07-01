import pool from '@/lib/db';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'You must be logged in' },
                { status: 401 }
            );
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT s.id, s.title, s.slug, s.cover_image_url, s.status,
              s.view_count, s.rating_avg, u.username AS creator_name,
              b.created_at AS bookmarked_at,
              rp.last_episode_id, rp.scroll_position,
              e.episode_number AS last_episode_number,
              e.title AS last_episode_title
       FROM bookmarks b
       JOIN series s ON b.series_id = s.id
       JOIN users u ON s.creator_id = u.id
       LEFT JOIN reading_progress rp ON rp.series_id = s.id AND rp.user_id = b.user_id
       LEFT JOIN episodes e ON e.id = rp.last_episode_id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
            [session.user.id]
        );

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching library:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch library' },
            { status: 500 }
        );
    }
}