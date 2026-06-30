import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const [seriesRows] = await pool.query<RowDataPacket[]>(
            `SELECT s.*, u.username AS creator_name, u.avatar_url AS creator_avatar
       FROM series s
       JOIN users u ON s.creator_id = u.id
       WHERE s.slug = ? AND s.is_published = true`,
            [slug]
        );

        if (seriesRows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Series not found' },
                { status: 404 }
            );
        }

        const series = seriesRows[0];

        const [genreRows] = await pool.query<RowDataPacket[]>(
            `SELECT g.name FROM genres g
       JOIN series_genres sg ON g.id = sg.genre_id
       WHERE sg.series_id = ?`,
            [series.id]
        );

        const [episodeRows] = await pool.query<RowDataPacket[]>(
            `SELECT id, episode_number, title, thumbnail_url, published_at, view_count
       FROM episodes
       WHERE series_id = ? AND is_published = true
       ORDER BY episode_number ASC`,
            [series.id]
        );

        return NextResponse.json({
            success: true,
            data: {
                ...series,
                genres: genreRows.map((g) => g.name),
                episodes: episodeRows,
            },
        });
    } catch (error) {
        console.error('Error fetching series detail:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch series' },
            { status: 500 }
        );
    }
}