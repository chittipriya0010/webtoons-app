'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

interface Episode {
    id: string;
    episode_number: number;
    title: string;
    view_count: number;
    published_at: string;
}

interface Series {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string;
    status: string;
    view_count: number;
    rating_avg: number;
    is_published: boolean;
    episodes: Episode[];
}

type ActiveTab = 'series' | 'new-series' | 'new-episode';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [series, setSeries] = useState<Series[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ActiveTab>('series');
    const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

    // New series form
    const [newTitle, setNewTitle] = useState('');
    const [newSynopsis, setNewSynopsis] = useState('');
    const [newCoverUrl, setNewCoverUrl] = useState('');
    const [newGenreIds, setNewGenreIds] = useState<number[]>([]);
    const [seriesSubmitting, setSeriesSubmitting] = useState(false);
    const [seriesMsg, setSeriesMsg] = useState('');

    // New episode form
    const [epTitle, setEpTitle] = useState('');
    const [epThumbnailUrl, setEpThumbnailUrl] = useState('');
    const [epImageUrls, setEpImageUrls] = useState<string[]>(['']);
    const [epSubmitting, setEpSubmitting] = useState(false);
    const [epMsg, setEpMsg] = useState('');

    // Upload state
    const [uploading, setUploading] = useState(false);

    const GENRES = [
        { id: 1, name: 'Romance' }, { id: 2, name: 'Fantasy' },
        { id: 3, name: 'Action' }, { id: 4, name: 'Comedy' },
        { id: 5, name: 'Drama' }, { id: 6, name: 'Horror' },
        { id: 7, name: 'Slice of Life' }, { id: 8, name: 'Thriller' },
        { id: 9, name: 'Sci-Fi' }, { id: 10, name: 'Mystery' },
    ];

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status, router]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        fetchMySeries();
    }, [status]);

    const fetchMySeries = () => {
        fetch('/api/series')
            .then((r) => r.json())
            .then((d) => {
                setSeries(d.data || []);
                setLoading(false);
            });
    };

    const totalViews = series.reduce((sum, s) => sum + (s.view_count || 0), 0);
    const totalEpisodes = series.reduce((sum, s) => sum + (s.episodes?.length || 0), 0);

    const handleUploadImage = async (
        file: File,
        onSuccess: (url: string) => void
    ) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) onSuccess(data.data.url);
        setUploading(false);
    };

    const handleCreateSeries = async (e: React.FormEvent) => {
        e.preventDefault();
        setSeriesSubmitting(true);
        setSeriesMsg('');
        const res = await fetch('/api/series', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newTitle,
                synopsis: newSynopsis,
                coverImageUrl: newCoverUrl,
                genreIds: newGenreIds,
            }),
        });
        const data = await res.json();
        setSeriesSubmitting(false);
        if (data.success) {
            setSeriesMsg('Series created successfully!');
            setNewTitle(''); setNewSynopsis('');
            setNewCoverUrl(''); setNewGenreIds([]);
            fetchMySeries();
            setTimeout(() => { setActiveTab('series'); setSeriesMsg(''); }, 1500);
        } else {
            setSeriesMsg(data.error || 'Failed to create series.');
        }
    };

    const handleCreateEpisode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSeries) return;
        setEpSubmitting(true);
        setEpMsg('');
        const validUrls = epImageUrls.filter((u) => u.trim().length > 0);
        const res = await fetch(`/api/series/${selectedSeries.slug}/episodes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: epTitle,
                thumbnailUrl: epThumbnailUrl,
                imageUrls: validUrls,
            }),
        });
        const data = await res.json();
        setEpSubmitting(false);
        if (data.success) {
            setEpMsg('Episode published!');
            setEpTitle(''); setEpThumbnailUrl('');
            setEpImageUrls(['']);
            fetchMySeries();
            setTimeout(() => { setActiveTab('series'); setEpMsg(''); }, 1500);
        } else {
            setEpMsg(data.error || 'Failed to create episode.');
        }
    };

    const toggleGenre = (id: number) => {
        setNewGenreIds((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
        );
    };

    const addImageUrl = () => setEpImageUrls((prev) => [...prev, '']);
    const removeImageUrl = (i: number) =>
        setEpImageUrls((prev) => prev.filter((_, idx) => idx !== i));
    const updateImageUrl = (i: number, val: string) =>
        setEpImageUrls((prev) => prev.map((u, idx) => (idx === i ? val : u)));

    if (status === 'loading' || loading) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.spinner} />
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            {/* SIDEBAR */}
            <aside className={styles.sidebar}>
                <a href="/" className={styles.logo}>WEBTOONS</a>

                <div className={styles.profile}>
                    <div className={styles.profileAvatar}>
                        {session?.user?.name?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                        <p className={styles.profileName}>{session?.user?.name}</p>
                        <p className={styles.profileRole}>Creator</p>
                    </div>
                </div>

                <nav className={styles.sideNav}>
                    <button
                        className={`${styles.navItem} ${activeTab === 'series' ? styles.navItemActive : ''}`}
                        onClick={() => setActiveTab('series')}
                    >
                        <span className={styles.navIcon}>▦</span> My Series
                    </button>
                    <button
                        className={`${styles.navItem} ${activeTab === 'new-series' ? styles.navItemActive : ''}`}
                        onClick={() => setActiveTab('new-series')}
                    >
                        <span className={styles.navIcon}>＋</span> New Series
                    </button>
                    <button
                        className={`${styles.navItem} ${activeTab === 'new-episode' ? styles.navItemActive : ''}`}
                        onClick={() => setActiveTab('new-episode')}
                    >
                        <span className={styles.navIcon}>↑</span> Upload Episode
                    </button>
                </nav>

                <button
                    className={styles.signOutBtn}
                    onClick={() => signOut({ callbackUrl: '/' })}
                >
                    Sign Out
                </button>
            </aside>

            {/* MAIN */}
            <main className={styles.main}>

                {/* STATS BAR */}
                <div className={styles.statsBar}>
                    <div className={styles.statCard}>
                        <p className={styles.statValue}>{series.length}</p>
                        <p className={styles.statLabel}>Series</p>
                    </div>
                    <div className={styles.statCard}>
                        <p className={styles.statValue}>{totalEpisodes}</p>
                        <p className={styles.statLabel}>Episodes</p>
                    </div>
                    <div className={styles.statCard}>
                        <p className={styles.statValue}>{totalViews.toLocaleString()}</p>
                        <p className={styles.statLabel}>Total Views</p>
                    </div>
                </div>

                {/* TAB: MY SERIES */}
                {activeTab === 'series' && (
                    <section className={styles.section}>
                        <h1 className={styles.pageTitle}>My Series</h1>

                        {series.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p className={styles.emptyTitle}>No series yet</p>
                                <p className={styles.emptySub}>Create your first series to get started.</p>
                                <button
                                    className={styles.emptyBtn}
                                    onClick={() => setActiveTab('new-series')}
                                >
                                    Create Series
                                </button>
                            </div>
                        ) : (
                            <div className={styles.seriesGrid}>
                                {series.map((s) => (
                                    <div key={s.id} className={styles.seriesCard}>
                                        <img
                                            className={styles.seriesCover}
                                            src={s.cover_image_url || 'https://picsum.photos/seed/placeholder/400/600'}
                                            alt={s.title}
                                        />
                                        <div className={styles.seriesInfo}>
                                            <div className={styles.seriesTop}>
                                                <p className={styles.seriesTitle}>{s.title}</p>
                                                <span className={`${styles.statusBadge} ${s.status === 'ongoing' ? styles.statusOngoing :
                                                        s.status === 'completed' ? styles.statusCompleted :
                                                            styles.statusHiatus
                                                    }`}>
                                                    {s.status}
                                                </span>
                                            </div>
                                            <div className={styles.seriesMeta}>
                                                <span>★ {s.rating_avg}</span>
                                                <span>{s.view_count?.toLocaleString()} views</span>
                                            </div>
                                            <div className={styles.seriesActions}>
                                                <a
                                                    href={`/series/${s.slug}`}
                                                    className={styles.viewBtn}
                                                    target="_blank"
                                                >
                                                    View
                                                </a>
                                                <button
                                                    className={styles.uploadBtn}
                                                    onClick={() => {
                                                        setSelectedSeries(s);
                                                        setActiveTab('new-episode');
                                                    }}
                                                >
                                                    + Episode
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

            {/* TAB: NEW SERIES */}
            {activeTab === 'new-series' && (
                <section className={styles.section}>
                    <h1 className={styles.pageTitle}>Create Series</h1>

                    <form className={styles.form} onSubmit={handleCreateSeries}>
                        <div className={styles.field}>
                            <label className={styles.label}>Title <span className={styles.required}>*</span></label>
                            <input
                                className={styles.input}
                                placeholder="e.g. Moonlit Academy"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Synopsis</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="What is your series about?"
                                value={newSynopsis}
                                onChange={(e) => setNewSynopsis(e.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Cover Image</label>
                            <div className={styles.uploadRow}>
                                <input
                                    className={styles.input}
                                    placeholder="Paste URL or upload below"
                                    value={newCoverUrl}
                                    onChange={(e) => setNewCoverUrl(e.target.value)}
                                />
                                <label className={styles.uploadLabel}>
                                    {uploading ? 'Uploading...' : 'Upload'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUploadImage(file, setNewCoverUrl);
                                        }}
                                    />
                                </label>
                            </div>
                            {newCoverUrl && (
                                <img
                                    src={newCoverUrl}
                                    alt="Cover preview"
                                    className={styles.imagePreview}
                                />
                            )}
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Genres</label>
                            <div className={styles.genreGrid}>
                                {GENRES.map((g) => (
                                    <button
                                        key={g.id}
                                        type="button"
                                        className={`${styles.genrePill} ${newGenreIds.includes(g.id) ? styles.genrePillActive : ''}`}
                                        onClick={() => toggleGenre(g.id)}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {seriesMsg && (
                            <div className={`${styles.msg} ${seriesMsg.includes('success') ? styles.msgSuccess : styles.msgError}`}>
                                {seriesMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={seriesSubmitting}
                        >
                            {seriesSubmitting ? 'Creating...' : 'Create Series'}
                        </button>
                    </form>
                </section>
            )}

            {/* TAB: NEW EPISODE */}
            {activeTab === 'new-episode' && (
                <section className={styles.section}>
                    <h1 className={styles.pageTitle}>Upload Episode</h1>

                    <form className={styles.form} onSubmit={handleCreateEpisode}>

                        <div className={styles.field}>
                            <label className={styles.label}>Series <span className={styles.required}>*</span></label>
                            <select
                                className={styles.select}
                                value={selectedSeries?.id || ''}
                                onChange={(e) => {
                                    const found = series.find((s) => s.id === e.target.value) || null;
                                    setSelectedSeries(found);
                                }}
                                required
                            >
                                <option value="">Select a series</option>
                                {series.map((s) => (
                                    <option key={s.id} value={s.id}>{s.title}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Episode Title</label>
                            <input
                                className={styles.input}
                                placeholder="e.g. The Hidden Gate"
                                value={epTitle}
                                onChange={(e) => setEpTitle(e.target.value)}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Thumbnail Image</label>
                            <div className={styles.uploadRow}>
                                <input
                                    className={styles.input}
                                    placeholder="Paste URL or upload"
                                    value={epThumbnailUrl}
                                    onChange={(e) => setEpThumbnailUrl(e.target.value)}
                                />
                                <label className={styles.uploadLabel}>
                                    {uploading ? 'Uploading...' : 'Upload'}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleUploadImage(file, setEpThumbnailUrl);
                                        }}
                                    />
                                </label>
                            </div>
                            {epThumbnailUrl && (
                                <img
                                    src={epThumbnailUrl}
                                    alt="Thumbnail preview"
                                    className={styles.imagePreview}
                                />
                            )}
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>
                                Comic Panels <span className={styles.required}>*</span>
                                <span className={styles.labelHint}> — add images in reading order</span>
                            </label>

                            {epImageUrls.map((url, i) => (
                                <div key={i} className={styles.panelRow}>
                                    <span className={styles.panelNum}>{i + 1}</span>
                                    <input
                                        className={styles.input}
                                        placeholder="Paste URL or upload"
                                        value={url}
                                        onChange={(e) => updateImageUrl(i, e.target.value)}
                                    />
                                    <label className={styles.uploadLabel}>
                                        {uploading ? '...' : 'Upload'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleUploadImage(file, (url) => updateImageUrl(i, url));
                                            }}
                                        />
                                    </label>
                                    {epImageUrls.length > 1 && (
                                        <button
                                            type="button"
                                            className={styles.removeBtn}
                                            onClick={() => removeImageUrl(i)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button
                                type="button"
                                className={styles.addPanelBtn}
                                onClick={addImageUrl}
                            >
                                + Add Panel
                            </button>
                        </div>

                        {epMsg && (
                            <div className={`${styles.msg} ${epMsg.includes('published') ? styles.msgSuccess : styles.msgError}`}>
                                {epMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={epSubmitting || !selectedSeries}
                        >
                            {epSubmitting ? 'Publishing...' : 'Publish Episode'}
                        </button>
                    </form>
                </section>
            )}
        </main>
    </div >
  );
}