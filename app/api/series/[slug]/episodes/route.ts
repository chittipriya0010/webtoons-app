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

        const [seriesRows] = await pool.query<RowDataPacket[]>(
            'SELECT id, creator_id FROM series WHERE slug = ?',
            [slug]
        );

        if (seriesRows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Series not found' },
                { status: 404 }
            );
        }

        const series = seriesRows[0];

        // Only the series' own creator (or an admin) can add episodes
        if (series.creator_id !== session.user.id && session.user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'You do not have permission to add episodes to this series' },
                { status: 403 }
            );
        }

        const { title, thumbnailUrl, imageUrls } = await request.json();

        if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
            return NextResponse.json(
                { success: false, error: 'At least one image is required' },
                { status: 400 }
            );
        }

        const [maxEpRows] = await pool.query<RowDataPacket[]>(
            'SELECT MAX(episode_number) AS maxNum FROM episodes WHERE series_id = ?',
            [series.id]
        );
        const nextEpisodeNumber = (maxEpRows[0].maxNum || 0) + 1;

        const episodeId = crypto.randomUUID();

        await pool.query(
            `INSERT INTO episodes (id, series_id, episode_number, title, thumbnail_url, is_published, published_at)
       VALUES (?, ?, ?, ?, ?, true, NOW())`,
            [episodeId, series.id, nextEpisodeNumber, title || null, thumbnailUrl || null]
        );

        const imageValues = imageUrls.map((url: string, index: number) => [
            crypto.randomUUID(),
            episodeId,
            url,
            index + 1,
        ]);

        await pool.query(
            'INSERT INTO episode_images (id, episode_id, image_url, position) VALUES ?',
            [imageValues]
        );

        return NextResponse.json(
            {
                success: true,
                message: 'Episode created',
                data: { id: episodeId, episodeNumber: nextEpisodeNumber },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating episode:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create episode' },
            { status: 500 }
        );
    }
}