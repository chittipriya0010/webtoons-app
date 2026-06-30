import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [episodeRows] = await pool.query<RowDataPacket[]>(
            `SELECT e.*, s.title AS series_title, s.slug AS series_slug
       FROM episodes e
       JOIN series s ON e.series_id = s.id
       WHERE e.id = ? AND e.is_published = true`,
            [id]
        );

        if (episodeRows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Episode not found' },
                { status: 404 }
            );
        }

        const episode = episodeRows[0];

        const [imageRows] = await pool.query<RowDataPacket[]>(
            `SELECT image_url, position, width, height
       FROM episode_images
       WHERE episode_id = ?
       ORDER BY position ASC`,
            [id]
        );

        // Fire-and-forget view count increment
        pool.query('UPDATE episodes SET view_count = view_count + 1 WHERE id = ?', [id]);

        return NextResponse.json({
            success: true,
            data: { ...episode, images: imageRows },
        });
    } catch (error) {
        console.error('Error fetching episode:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch episode' },
            { status: 500 }
        );
    }
}