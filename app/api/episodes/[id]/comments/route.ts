import pool from '@/lib/db';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket } from 'mysql2';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [comments] = await pool.query<RowDataPacket[]>(
            `SELECT c.id, c.body, c.like_count, c.parent_comment_id, c.created_at,
              u.id AS user_id, u.username, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.episode_id = ?
       ORDER BY c.created_at ASC`,
            [id]
        );

        return NextResponse.json({ success: true, data: comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: 'You must be logged in to comment' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const { body, parentCommentId } = await request.json();

        if (!body || body.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Comment body is required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query(
            `INSERT INTO comments (id, episode_id, user_id, parent_comment_id, body)
       VALUES (UUID(), ?, ?, ?, ?)`,
            [id, session.user.id, parentCommentId || null, body.trim()]
        );

        return NextResponse.json(
            { success: true, message: 'Comment added' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error posting comment:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to post comment' },
            { status: 500 }
        );
    }
}