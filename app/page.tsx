'use client';

import { useEffect, useState } from 'react';
import type { Series, Genre } from '@/types';
import styles from './homepage.module.css';

const STATUS_STYLES: Record<string, string> = {
  ongoing: styles.statusOngoing,
  completed: styles.statusCompleted,
  hiatus: styles.statusHiatus,
};

export default function HomePage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/genres')
      .then((r) => r.json())
      .then((d) => setGenres(d.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeGenre) params.set('genre', activeGenre);
    if (activeStatus) params.set('status', activeStatus);

    fetch(`/api/series?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setSeries(d.data || []);
        setLoading(false);
      });
  }, [activeGenre, activeStatus]);

  const featured = series[0];

  return (
    <>
      {/* NAV */}
      <nav className={styles.nav}>
        <span className={styles.navLogo}>WEBTOONS</span>
        <ul className={styles.navLinks}>
          <li><a href="#">Browse</a></li>
          <li><a href="/library">My Library</a></li>
          <li><a href="/login">Login</a></li>
        </ul>
      </nav>

      {/* HERO */}
      {featured && (
        <section className={styles.hero}>
          <div
            className={styles.heroBg}
            style={{ backgroundImage: `url(${featured.cover_image_url})` }}
          />
          <div className={styles.heroGradient} />
          <div className={styles.heroContent}>
            <span className={styles.heroTag}>Featured Series</span>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleUnderline}>{featured.title}</span>
            </h1>
            <p className={styles.heroSynopsis}>{featured.synopsis}</p>
            <div className={styles.heroMeta}>
              <span className={styles.heroRating}>★ {featured.rating_avg}</span>
              <span>by {featured.creator_name}</span>
              <span>{featured.view_count.toLocaleString()} views</span>
            </div>
            <a href={`/series/${featured.slug}`} className={styles.heroBtn}>
              Start Reading →
            </a>
          </div>
        </section>
      )}

      {/* FILTERS */}
      <section className={styles.filtersSection}>
        <div className={styles.filtersRow}>
          <span className={styles.filterLabel}>Genre</span>
          <button
            className={`${styles.pill} ${!activeGenre ? styles.pillActive : ''}`}
            onClick={() => setActiveGenre(null)}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g.id}
              className={`${styles.pill} ${activeGenre === g.name ? styles.pillActive : ''}`}
              onClick={() => setActiveGenre(activeGenre === g.name ? null : g.name)}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className={styles.filtersRow}>
          <span className={styles.filterLabel}>Status</span>
          {['ongoing', 'completed', 'hiatus'].map((s) => (
            <button
              key={s}
              className={`${styles.pill} ${activeStatus === s ? styles.pillActive : ''}`}
              onClick={() => setActiveStatus(activeStatus === s ? null : s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.divider} />

      {/* CATALOG */}
      <section className={styles.catalogSection}>
        <div className={styles.catalogHeader}>
          <h2 className={styles.catalogTitle}>
            {activeGenre ? activeGenre : 'All Series'}
          </h2>
          {!loading && (
            <span className={styles.catalogCount}>{series.length} titles</span>
          )}
        </div>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : series.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No series found</p>
            <p>Try a different genre or status filter.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {series.map((s) => (
              <a key={s.id} href={`/series/${s.slug}`} className={styles.card}>
                <img
                  className={styles.cardCover}
                  src={s.cover_image_url || 'https://picsum.photos/seed/placeholder/400/600'}
                  alt={s.title}
                  loading="lazy"
                />
                <div className={styles.cardBody}>
                  <p className={styles.cardTitle}>{s.title}</p>
                  <p className={styles.cardCreator}>by {s.creator_name}</p>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardRating}>★ {s.rating_avg}</span>
                    <span className={`${styles.cardStatus} ${STATUS_STYLES[s.status] || ''}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}