'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './reader.module.css';

interface EpisodeImage {
    image_url: string;
    position: number;
    width: number;
    height: number;
}

interface Episode {
    id: string;
    episode_number: number;
    title: string;
    series_title: string;
    series_slug: string;
    images: EpisodeImage[];
}

interface Comment {
    id: string;
    body: string;
    like_count: number;
    parent_comment_id: string | null;
    created_at: string;
    user_id: string;
    username: string;
    avatar_url: string;
}

export default function EpisodeReaderPage() {
    const { slug, id } = useParams() as { slug: string; id: string };
    const { data: session } = useSession();

    const [episode, setEpisode] = useState<Episode | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likeLoading, setLikeLoading] = useState(false);
    const [commentBody, setCommentBody] = useState('');
    const [replyTo, setReplyTo] = useState<Comment | null>(null);
    const [commentLoading, setCommentLoading] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/episodes/${id}`)
            .then((r) => r.json())
            .then((d) => {
                setEpisode(d.data || null);
                setLoading(false);
            });

        fetch(`/api/episodes/${id}/comments`)
            .then((r) => r.json())
            .then((d) => setComments(d.data || []));
    }, [id]);

    // Track scroll progress
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            setScrollProgress(Math.min(progress, 100));
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLike = async () => {
        if (!session) { window.location.href = '/login'; return; }
        setLikeLoading(true);
        const res = await fetch(`/api/episodes/${id}/like`, { method: 'POST' });
        const data = await res.json();
        if (data.success) setLiked(data.liked);
        setLikeLoading(false);
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) { window.location.href = '/login'; return; }
        if (!commentBody.trim()) return;
        setCommentLoading(true);

        const res = await fetch(`/api/episodes/${id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                body: commentBody.trim(),
                parentCommentId: replyTo?.id || null,
            }),
        });

        const data = await res.json();
        if (data.success) {
            setCommentBody('');
            setReplyTo(null);
            // Refresh comments
            fetch(`/api/episodes/${id}/comments`)
                .then((r) => r.json())
                .then((d) => setComments(d.data || []));
        }
        setCommentLoading(false);
    };

    const handleReply = (comment: Comment) => {
        setReplyTo(comment);
        commentInputRef.current?.focus();
        commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const topLevelComments = comments.filter((c) => !c.parent_comment_id);
    const getReplies = (commentId: string) =>
        comments.filter((c) => c.parent_comment_id === commentId);

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (!episode) {
        return (
            <div className={styles.notFound}>
                <p className={styles.notFoundTitle}>Episode not found</p>
                <a href={`/series/${slug}`} className={styles.backLink}>← Back to series</a>
            </div>
        );
    }

    return (
        <>
            {/* SCROLL PROGRESS BAR */}
            <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${scrollProgress}%` }} />
            </div>

            {/* NAV */}
            <nav className={styles.nav}>
                <a href={`/series/${slug}`} className={styles.navBack}>
                    ← {episode.series_title}
                </a>
                <div className={styles.navCenter}>
                    <span className={styles.navEpisode}>
                        EP {episode.episode_number} · {episode.title || `Episode ${episode.episode_number}`}
                    </span>
                </div>
                <button
                    className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
                    onClick={handleLike}
                    disabled={likeLoading}
                >
                    {liked ? '♥' : '♡'} Like
                </button>
            </nav>

            {/* COMIC READER */}
            <main className={styles.reader}>
                <div className={styles.imageStack}>
                    {episode.images.map((img) => (
                        <img
                            key={img.position}
                            src={img.image_url}
                            alt={`Page ${img.position}`}
                            className={styles.comicImage}
                            style={{
                                aspectRatio: img.width && img.height
                                    ? `${img.width} / ${img.height}`
                                    : '800 / 1200',
                            }}
                            loading="lazy"
                        />
                    ))}
                </div>

                {/* END OF EPISODE */}
                <div className={styles.endCard}>
                    <p className={styles.endTitle}>End of Episode {episode.episode_number}</p>
                    <p className={styles.endSub}>Thanks for reading!</p>
                    <div className={styles.endActions}>
                        <a href={`/series/${slug}`} className={styles.endBtn}>
                            ← Back to Series
                        </a>
                        <button
                            className={`${styles.endLikeBtn} ${liked ? styles.endLikeBtnActive : ''}`}
                            onClick={handleLike}
                            disabled={likeLoading}
                        >
                            {liked ? '♥ Liked!' : '♡ Like this episode'}
                        </button>
                    </div>
                </div>

                {/* COMMENTS */}
                <section className={styles.commentsSection}>
                    <h2 className={styles.commentsTitle}>
                        Comments <span className={styles.commentsCount}>{comments.length}</span>
                    </h2>

                    {/* COMMENT INPUT */}
                    <form className={styles.commentForm} onSubmit={handleComment}>
                        {replyTo && (
                            <div className={styles.replyBanner}>
                                <span>Replying to <strong>{replyTo.username}</strong></span>
                                <button
                                    type="button"
                                    className={styles.cancelReply}
                                    onClick={() => setReplyTo(null)}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                        <textarea
                            ref={commentInputRef}
                            className={styles.commentInput}
                            placeholder={
                                session
                                    ? replyTo
                                        ? `Reply to ${replyTo.username}...`
                                        : 'Share your thoughts...'
                                    : 'Sign in to comment'
                            }
                            value={commentBody}
                            onChange={(e) => setCommentBody(e.target.value)}
                            rows={3}
                            disabled={!session}
                        />
                        <div className={styles.commentFormFooter}>
                            <span className={styles.charCount}>{commentBody.length} / 500</span>
                            <button
                                type="submit"
                                className={styles.commentSubmit}
                                disabled={commentLoading || !commentBody.trim() || !session}
                            >
                                {commentLoading ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </form>

                    {/* COMMENT LIST */}
                    <div className={styles.commentList}>
                        {topLevelComments.length === 0 ? (
                            <div className={styles.emptyComments}>
                                <p>No comments yet. Be the first!</p>
                            </div>
                        ) : (
                            topLevelComments.map((comment) => (
                                <div key={comment.id} className={styles.commentThread}>
                                    <div className={styles.commentCard}>
                                        <img
                                            className={styles.commentAvatar}
                                            src={comment.avatar_url || 'https://i.pravatar.cc/40'}
                                            alt={comment.username}
                                        />
                                        <div className={styles.commentContent}>
                                            <div className={styles.commentHeader}>
                                                <span className={styles.commentUsername}>{comment.username}</span>
                                                <span className={styles.commentDate}>
                                                    {new Date(comment.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <p className={styles.commentBody}>{comment.body}</p>
                                            <div className={styles.commentActions}>
                                                <span className={styles.commentLikes}>♥ {comment.like_count}</span>
                                                <button
                                                    className={styles.replyBtn}
                                                    onClick={() => handleReply(comment)}
                                                >
                                                    Reply
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* REPLIES */}
                                    {getReplies(comment.id).map((reply) => (
                                        <div key={reply.id} className={styles.replyCard}>
                                            <img
                                                className={styles.commentAvatar}
                                                src={reply.avatar_url || 'https://i.pravatar.cc/40'}
                                                alt={reply.username}
                                            />
                                            <div className={styles.commentContent}>
                                                <div className={styles.commentHeader}>
                                                    <span className={styles.commentUsername}>{reply.username}</span>
                                                    <span className={styles.commentDate}>
                                                        {new Date(reply.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                                <p className={styles.commentBody}>{reply.body}</p>
                                                <div className={styles.commentActions}>
                                                    <span className={styles.commentLikes}>♥ {reply.like_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </>
    );
}