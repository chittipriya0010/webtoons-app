'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './library.module.css';

interface LibrarySeries {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string;
    status: string;
    view_count: number;
    rating_avg: number;
    creator_name: string;
    bookmarked_at: string;
    last_episode_id: string | null;
    last_episode_number: number | null;
    last_episode_title: string | null;
    scroll_position: number | null;
}

const STATUS_STYLES: Record<string, string> = {
    ongoing: 'statusOngoing',
    completed: 'statusCompleted',
    hiatus: 'statusHiatus',
};

export default function LibraryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [library, setLibrary] = useState<LibrarySeries[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'ongoing' | 'completed' | 'hiatus'>('all');

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status, router]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        fetch('/api/library')
            .then((r) => r.json())
            .then((d) => {
                setLibrary(d.data || []);
                setLoading(false);
            });
    }, [status]);

    const handleRemoveBookmark = async (slug: string) => {
        await fetch(`/api/series/${slug}/bookmark`, { method: 'POST' });
        setLibrary((prev) => prev.filter((s) => s.slug !== slug));
    };

    const filtered = filter === 'all'
        ? library
        : library.filter((s) => s.status === filter);

    if (status === 'loading' || loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.spinner} />
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
                    <li><a href="/library" className={styles.navActive}>My Library</a></li>
                    {session?.user?.name && (
                        <li><a href="/dashboard">{session.user.name}</a></li>
                    )}
                </ul>
            </nav>

            <main className={styles.main}>
                {/* HEADER */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.pageTitle}>My Library</h1>
                        <p className={styles.pageSub}>
                            {library.length} bookmarked {library.length === 1 ? 'series' : 'series'}
                        </p>
                    </div>

                    {/* FILTER PILLS */}
                    <div className={styles.filters}>
                        {(['all', 'ongoing', 'completed', 'hiatus'] as const).map((f) => (
                            <button
                                key={f}
                                className={`${styles.pill} ${filter === f ? styles.pillActive : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.divider} />

                {/* EMPTY STATE */}
                {library.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>Your library is empty</p>
                        <p className={styles.emptySub}>
                            Bookmark series while browsing to save them here.
                        </p>
                        <a href="/" className={styles.browseBtn}>Browse Series</a>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyTitle}>No {filter} series</p>
                        <p className={styles.emptySub}>
                            None of your bookmarked series have this status.
                        </p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filtered.map((s) => (
                            <div key={s.id} className={styles.card}>
                                {/* COVER */}
                                <a href={`/series/${s.slug}`} className={styles.coverLink}>
                                    <img
                                        className={styles.cover}
                                        src={s.cover_image_url || 'https://picsum.photos/seed/placeholder/400/600'}
                                        alt={s.title}
                                    />
                                    <span className={`${styles.statusBadge} ${styles[STATUS_STYLES[s.status] || '']}`}>
                                        {s.status}
                                    </span>
                                </a>

                                {/* INFO */}
                                <div className={styles.info}>
                                    <a href={`/series/${s.slug}`} className={styles.title}>
                                        {s.title}
                                    </a>
                                    <p className={styles.creator}>by {s.creator_name}</p>

                                    <div className={styles.meta}>
                                        <span className={styles.rating}>★ {s.rating_avg}</span>
                                        <span className={styles.metaDot}>·</span>
                                        <span className={styles.views}>{s.view_count.toLocaleString()} views</span>
                                    </div>

                                    {/* CONTINUE READING */}
                                    {s.last_episode_id ? (
                                        <a
                                            href={`/series/${s.slug}/episodes/${s.last_episode_id}`}
                                            className={styles.continueBtn}
                                        >
                                            ▶ Continue — Ep {s.last_episode_number}
                                            {s.last_episode_title ? ` · ${s.last_episode_title}` : ''}
                                        </a>
                                    ) : (
                                        <a
                                            href={`/series/${s.slug}`}
                                            className={styles.startBtn}
                                        >
                                            Start Reading →
                                        </a>
                                    )}

                        {/* PROGRESS BAR */}
                        {s.scroll_position !== null && (
                            <div className={styles.progressRow}>
                                <div className={styles.progressTrack}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${Math.min(s.scroll_position, 100)}%` }}
                                    />
                                </div>
                                <span className={styles.progressLabel}>
                                    {Math.round(s.scroll_position || 0)}%
                                </span>
                            </div>
                        )}

                        {/* REMOVE */}
                        <button
                            className={styles.removeBtn}
                            onClick={() => handleRemoveBookmark(s.slug)}
                        >
                            ✕ Remove
                        </button>
                    </div>
              </div>
            ))}
        </div >
        )
}
      </main >
    </>
  );
}