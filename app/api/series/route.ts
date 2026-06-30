import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const genre = searchParams.get('genre');
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = `
      SELECT DISTINCT s.id, s.title, s.slug, s.synopsis, s.cover_image_url,
             s.status, s.view_count, s.rating_avg, u.username AS creator_name
      FROM series s
      JOIN users u ON s.creator_id = u.id
      LEFT JOIN series_genres sg ON s.id = sg.series_id
      LEFT JOIN genres g ON sg.genre_id = g.id
      WHERE s.is_published = true
    `;
        const params: (string | number)[] = [];

        if (genre) {
            query += ' AND g.name = ?';
            params.push(genre);
        }
        if (status) {
            query += ' AND s.status = ?';
            params.push(status);
        }

        query += ' ORDER BY s.view_count DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching series:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch series' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'You must be logged in' },
                { status: 401 }
            );
        }

        if (session.user.role !== 'creator' && session.user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Only creators can create a series' },
                { status: 403 }
            );
        }

        const { title, synopsis, coverImageUrl, bannerImageUrl, genreIds } = await request.json();

        if (!title || title.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Title is required' },
                { status: 400 }
            );
        }

        const slug = title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        const [existing] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM series WHERE slug = ?',
            [slug]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: 'A series with a similar title already exists' },
                { status: 409 }
            );
        }

        const seriesId = crypto.randomUUID();

        await pool.query(
            `INSERT INTO series (id, creator_id, title, slug, synopsis, cover_image_url, banner_image_url, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, false)`,
            [seriesId, session.user.id, title.trim(), slug, synopsis || null, coverImageUrl || null, bannerImageUrl || null]
        );

        if (Array.isArray(genreIds) && genreIds.length > 0) {
            const values = genreIds.map((gid: number) => [seriesId, gid]);
            await pool.query('INSERT INTO series_genres (series_id, genre_id) VALUES ?', [values]);
        }

        return NextResponse.json(
            { success: true, message: 'Series created', data: { id: seriesId, slug } },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating series:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create series' },
            { status: 500 }
        );
    }
}