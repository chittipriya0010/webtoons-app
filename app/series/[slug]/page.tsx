'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from './series.module.css';

interface Episode {
    id: string;
    episode_number: number;
    title: string;
    thumbnail_url: string;
    published_at: string;
    view_count: number;
}

interface SeriesDetail {
    id: string;
    title: string;
    slug: string;
    synopsis: string;
    cover_image_url: string;
    banner_image_url: string;
    status: string;
    view_count: number;
    rating_avg: number;
    creator_name: string;
    creator_avatar: string;
    genres: string[];
    episodes: Episode[];
}

const STATUS_STYLES: Record<string, string> = {
    ongoing: styles.statusOngoing,
    completed: styles.statusCompleted,
    hiatus: styles.statusHiatus,
};

export default function SeriesDetailPage() {
    const { slug } = useParams() as { slug: string };
    const { data: session } = useSession();

    const [series, setSeries] = useState<SeriesDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookmarked, setBookmarked] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);

    useEffect(() => {
        if (!slug) return;
        fetch(`/api/series/${slug}`)
            .then((r) => r.json())
            .then((d) => {
                setSeries(d.data || null);
                setLoading(false);
            });
    }, [slug]);

    const handleBookmark = async () => {
        if (!session) {
            window.location.href = '/login';
            return;
        }
        setBookmarkLoading(true);
        const res = await fetch(`/api/series/${slug}/bookmark`, { method: 'POST' });
        const data = await res.json();
        if (data.success) setBookmarked(data.bookmarked);
        setBookmarkLoading(false);
    };

    if (loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.spinner} />
            </div>
        );
    }

    if (!series) {
        return (
            <div className={styles.notFound}>
                <p className={styles.notFoundTitle}>Series not found</p>
                <a href="/" className={styles.backLink}>← Back to home</a>
            </div>
        );
    }

    return (
        <>
            {/* NAV */}
            <nav className={styles.nav}>
                <a href="/" className={styles.navLogo}>WEBTOONS</a>
                <ul className={styles.navLinks}>
                    <li><a href="/">Browse</a></li>
                    <li><a href="#">My Library</a></li>
                    {session ? (
                        <li><a href="/dashboard">{session.user?.name}</a></li>
                    ) : (
                        <li><a href="/login">Login</a></li>
                    )}
                </ul>
            </nav>

            {/* BANNER */}
            <div className={styles.banner}>
                <div
                    className={styles.bannerBg}
                    style={{
                        backgroundImage: `url(${series.banner_image_url || series.cover_image_url})`,
                    }}
                />
                <div className={styles.bannerGradient} />
                <div className={styles.bannerContent}>
                    <img
                        className={styles.coverArt}
                        src={series.cover_image_url || 'https://picsum.photos/seed/placeholder/400/600'}
                        alt={series.title}
                    />
                    <div className={styles.bannerInfo}>
                        <div className={styles.genreTags}>
                            {series.genres.map((g) => (
                                <span key={g} className={styles.genreTag}>{g}</span>
                            ))}
                        </div>
                        <h1 className={styles.seriesTitle}>{series.title}</h1>
                        <div className={styles.creatorRow}>
                            <img
                                className={styles.creatorAvatar}
                                src={series.creator_avatar || 'https://i.pravatar.cc/40'}
                                alt={series.creator_name}
                            />
                            <span className={styles.creatorName}>by {series.creator_name}</span>
                        </div>
                        <p className={styles.synopsis}>{series.synopsis}</p>
                        <div className={styles.metaRow}>
                            <span className={styles.rating}>★ {series.rating_avg}</span>
                            <span className={styles.metaDot}>·</span>
                            <span className={styles.views}>{series.view_count.toLocaleString()} views</span>
                            <span className={styles.metaDot}>·</span>
                            <span className={`${styles.statusBadge} ${STATUS_STYLES[series.status] || ''}`}>
                                {series.status}
                            </span>
                        </div>
                        <div className={styles.actions}>
                            {series.episodes.length > 0 && (
                                <a
                                    href={`/series/${slug}/episodes/${series.episodes[0].id}`}
                                    className={styles.readBtn}
                                >
                                    Start Reading →
                                </a>
                            )}
                            <button
                                className={`${styles.bookmarkBtn} ${bookmarked ? styles.bookmarkActive : ''}`}
                                onClick={handleBookmark}
                                disabled={bookmarkLoading}
                            >
                                {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* EPISODE LIST */}
            <main className={styles.main}>
                <div className={styles.episodeHeader}>
                    <h2 className={styles.episodeHeading}>Episodes</h2>
                    <span className={styles.episodeCount}>{series.episodes.length} episodes</span>
                </div>

                {series.episodes.length === 0 ? (
                    <div className={styles.emptyEpisodes}>
                        <p>No episodes published yet. Check back soon!</p>
                    </div>
                ) : (
                    <div className={styles.episodeList}>
                        {series.episodes.map((ep) => (
                            <a
                                key={ep.id}
                                href={`/series/${slug}/episodes/${ep.id}`}
                                className={styles.episodeCard}
                            >
                                <img
                                    className={styles.episodeThumbnail}
                                    src={ep.thumbnail_url || 'https://picsum.photos/seed/ep/300/200'}
                                    alt={ep.title || `Episode ${ep.episode_number}`}
                                />
                                <div className={styles.episodeInfo}>
                                    <p className={styles.episodeNumber}>Episode {ep.episode_number}</p>
                                    <p className={styles.episodeTitle}>
                                        {ep.title || `Episode ${ep.episode_number}`}
                                    </p>
                                    <p className={styles.episodeMeta}>
                                        {new Date(ep.published_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                        <span className={styles.metaDot}>·</span>
                                        {ep.view_count.toLocaleString()} views
                                    </p>
                                </div>
                                <span className={styles.episodeArrow}>→</span>
                            </a>
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}