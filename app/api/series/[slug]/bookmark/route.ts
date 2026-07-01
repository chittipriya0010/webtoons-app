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
                { success: false, error: 'You must be logged in to bookmark' },
                { status: 401 }
            );
        }

        const { slug } = await params;
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

        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM bookmarks WHERE user_id = ? AND series_id = ?',
            [userId, seriesId]
        );

        if (existing.length > 0) {
            await pool.query(
                'DELETE FROM bookmarks WHERE user_id = ? AND series_id = ?',
                [userId, seriesId]
            );
            return NextResponse.json({ success: true, bookmarked: false });
        } else {
            await pool.query(
                'INSERT INTO bookmarks (user_id, series_id) VALUES (?, ?)',
                [userId, seriesId]
            );
            return NextResponse.json({ success: true, bookmarked: true });
        }
    } catch (error) {
        console.error('Error toggling bookmark:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to toggle bookmark' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ success: true, bookmarked: false });
        }

        const { slug } = await params;
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

        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM bookmarks WHERE user_id = ? AND series_id = ?',
            [userId, seriesId]
        );

        return NextResponse.json({ success: true, bookmarked: existing.length > 0 });
    } catch (error) {
        console.error('Error checking bookmark status:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check bookmark status' },
            { status: 500 }
        );
    }
}