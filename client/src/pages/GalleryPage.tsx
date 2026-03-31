import { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Spinner,
  shorthands,
} from '@fluentui/react-components';
import {
  SearchRegular,
  ArrowLeftRegular,
  ArrowRightRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  ArrowSortDownRegular,
  ArrowSortUpRegular,
  FilterRegular,
  ChevronDownRegular,
  ChevronUpRegular,
} from '@fluentui/react-icons';
import ComponentCard from '../components/ComponentCard';
import ErrorBar from '../components/ErrorBar';
import { fetchComponents, ComponentSummary, PaginatedResponse, SECTOR_TAGS, TABLE_TAGS } from '../services/api';

const useStyles = makeStyles({
  hero: {
    textAlign: 'center' as const,
    ...shorthands.padding('32px', '24px', '24px'),
    marginBottom: '24px',
    position: 'relative' as const,
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    lineHeight: '1.1',
    color: tokens.colorNeutralForeground1,
    marginBottom: '20px',
  },
  heroGradient: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #a78bfa 70%, #6366f1 100%)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    animationName: 'gradientShift',
    animationDuration: '4s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
  heroSubtitle: {
    fontSize: '15px',
    color: tokens.colorNeutralForeground3,
    lineHeight: '1.5',
    maxWidth: '520px',
    ...shorthands.margin('0', 'auto', '20px'),
  },
  searchWrapper: {
    maxWidth: '600px',
    ...shorthands.margin('0', 'auto'),
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    position: 'relative' as const,
  },
  searchInput: {
    width: '100%',
    ...shorthands.padding('16px', '20px', '16px', '52px'),
    fontSize: '15px',
    ...shorthands.border('1.5px', 'solid', 'rgba(99, 102, 241, 0.12)'),
    ...shorthands.borderRadius('50px'),
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 4px 24px rgba(99, 102, 241, 0.06), 0 1px 4px rgba(0, 0, 0, 0.02)',
    outlineStyle: 'none',
    transitionDuration: '0.3s',
    transitionProperty: 'border-color, box-shadow',
    fontFamily: 'inherit',
    color: tokens.colorNeutralForeground1,
    ':focus': {
      borderTopColor: '#6366f1',
      borderRightColor: '#6366f1',
      borderBottomColor: '#6366f1',
      borderLeftColor: '#6366f1',
      boxShadow: '0 4px 28px rgba(99, 102, 241, 0.18), 0 0 0 4px rgba(99, 102, 241, 0.06)',
    },
    '::placeholder': {
      color: tokens.colorNeutralForeground4,
    },
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: tokens.colorNeutralForeground4,
    pointerEvents: 'none',
  },
  resultInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  resultCount: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    fontWeight: '500',
  },
  sortRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sortLabel: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    fontWeight: '500',
    marginRight: '4px',
  },
  sortBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    ...shorthands.padding('6px', '14px'),
    ...shorthands.borderRadius('10px'),
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.06)'),
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    fontFamily: 'inherit',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderTopColor: 'rgba(99, 102, 241, 0.25)',
      borderRightColor: 'rgba(99, 102, 241, 0.25)',
      borderBottomColor: 'rgba(99, 102, 241, 0.25)',
      borderLeftColor: 'rgba(99, 102, 241, 0.25)',
      color: '#6366f1',
    },
  },
  sortBtnActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    ...shorthands.padding('6px', '14px'),
    ...shorthands.borderRadius('10px'),
    ...shorthands.border('1px', 'solid', 'rgba(99, 102, 241, 0.25)'),
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
    color: '#6366f1',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  empty: {
    textAlign: 'center' as const,
    ...shorthands.padding('80px', '24px'),
  },
  emptyIcon: {
    width: '80px',
    height: '80px',
    ...shorthands.borderRadius('50%'),
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.1))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    ...shorthands.margin('0', 'auto', '20px'),
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  emptySubtitle: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
  },
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.padding('80px'),
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '40px',
  },
  pageBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: '40px',
    ...shorthands.padding('0', '16px'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', 'rgba(99, 102, 241, 0.12)'),
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: tokens.colorNeutralForeground2,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    fontFamily: 'inherit',
    ':hover': {
      backgroundColor: 'rgba(99, 102, 241, 0.06)',
      borderTopColor: 'rgba(99, 102, 241, 0.3)',
      borderRightColor: 'rgba(99, 102, 241, 0.3)',
      borderBottomColor: 'rgba(99, 102, 241, 0.3)',
      borderLeftColor: 'rgba(99, 102, 241, 0.3)',
      color: '#6366f1',
    },
  },
  pageBtnDisabled: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: '40px',
    ...shorthands.padding('0', '16px'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.03)'),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    color: tokens.colorNeutralForeground4,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'default',
    fontFamily: 'inherit',
  },
  pageIndicator: {
    ...shorthands.padding('0', '12px'),
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
  },
});

export default function GalleryPage() {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [data, setData] = useState<PaginatedResponse<ComponentSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchComponents(debouncedSearch, page, 12, sort, activeTags);
      setData(result);
    } catch (err) {
      console.error('Failed to load components:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, sort, activeTags]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div>
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Découvrez les <span className={styles.heroGradient}>composants</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Explorez les composants développés par les équipes SE Dynamics 365
        </p>
        <div className={styles.searchWrapper}>
          <div style={{ position: 'relative', flex: 1 }}>
            <SearchRegular className={styles.searchIcon} fontSize={20} />
            <input
              className={styles.searchInput}
              placeholder="Rechercher un composant, auteur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 18px',
              borderRadius: '50px',
              border: activeTags.length > 0 ? '1.5px solid #6366f1' : '1.5px solid rgba(99,102,241,0.12)',
              backgroundColor: activeTags.length > 0 ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.85)',
              color: activeTags.length > 0 ? '#6366f1' : '#666',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 2px 12px rgba(99,102,241,0.06)',
              flexShrink: 0,
            }}
          >
            <FilterRegular fontSize={16} />
            {activeTags.length > 0 && (
              <span style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '11px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>{activeTags.length}</span>
            )}
            {filtersOpen ? <ChevronUpRegular fontSize={12} /> : <ChevronDownRegular fontSize={12} />}
          </button>
        </div>
      </div>

      {/* Active tag chips + filter panels */}
      {(activeTags.length > 0 || filtersOpen) && (
      <div style={{ maxWidth: '600px', margin: '0 auto 20px' }}>
        {activeTags.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: filtersOpen ? '10px' : '0' }}>
          {activeTags.map((tag) => (
            <span
              key={tag}
              onClick={() => { setActiveTags((prev) => prev.filter((t) => t !== tag)); setPage(1); }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: '50px',
                backgroundColor: SECTOR_TAGS.includes(tag) ? 'rgba(99,102,241,0.1)' : 'rgba(139,92,246,0.1)',
                color: SECTOR_TAGS.includes(tag) ? '#6366f1' : '#8b5cf6',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >{tag} ×</span>
          ))}
          {activeTags.length > 1 && (
            <button
              onClick={() => { setActiveTags([]); setPage(1); }}
              style={{ border: 'none', background: 'none', color: '#f43f5e', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px' }}
            >Tout effacer</button>
          )}
        </div>
        )}
        {filtersOpen && (
          <div style={{
            padding: '14px 18px',
            borderRadius: '14px',
            backgroundColor: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.08)',
            display: 'flex',
            gap: '20px',
            animation: 'slideDown 0.2s ease-out',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>Secteur</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {SECTOR_TAGS.map((tag) => {
                  const active = activeTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => { setActiveTags((prev) => active ? prev.filter((t) => t !== tag) : [...prev, tag]); setPage(1); }}
                      style={{
                        padding: '4px 11px',
                        borderRadius: '50px',
                        border: active ? '1px solid #6366f1' : '1px solid rgba(0,0,0,0.06)',
                        backgroundColor: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                        color: active ? '#6366f1' : '#666',
                        fontSize: '11.5px',
                        fontWeight: active ? 600 : 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >{tag}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(0,0,0,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>Table Dataverse</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {TABLE_TAGS.map((tag) => {
                  const active = activeTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => { setActiveTags((prev) => active ? prev.filter((t) => t !== tag) : [...prev, tag]); setPage(1); }}
                      style={{
                        padding: '4px 11px',
                        borderRadius: '50px',
                        border: active ? '1px solid #8b5cf6' : '1px solid rgba(0,0,0,0.06)',
                        backgroundColor: active ? 'rgba(139,92,246,0.1)' : 'transparent',
                        color: active ? '#8b5cf6' : '#666',
                        fontSize: '11.5px',
                        fontWeight: active ? 600 : 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >{tag}</button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {error ? (
        <div style={{ marginBottom: '24px' }}>
          <ErrorBar error={error} fallbackMessage="Impossible de charger les composants" />
        </div>
      ) : null}

      {loading ? (
        <div className={styles.spinner}>
          <Spinner size="large" label="Chargement..." />
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className={styles.resultInfo}>
            <Text className={styles.resultCount}>
              {data.pagination.total} composant{data.pagination.total > 1 ? 's' : ''}
              {debouncedSearch ? ` pour « ${debouncedSearch} »` : ''}
            </Text>
            <div className={styles.sortRow}>
              <span className={styles.sortLabel}>Trier par date :</span>
              <button
                className={sort === 'desc' ? styles.sortBtnActive : styles.sortBtn}
                onClick={() => { setSort('desc'); setPage(1); }}
              >
                <ArrowSortDownRegular fontSize={15} />
                Récent
              </button>
              <button
                className={sort === 'asc' ? styles.sortBtnActive : styles.sortBtn}
                onClick={() => { setSort('asc'); setPage(1); }}
              >
                <ArrowSortUpRegular fontSize={15} />
                Ancien
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {data.data.map((comp, i) => (
              <div key={comp.id} className="fade-in-up" style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'backwards' }}>
                <ComponentCard component={comp} />
              </div>
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={page <= 1 ? styles.pageBtnDisabled : styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeftRegular fontSize={16} />
                Précédent
              </button>
              <span className={styles.pageIndicator}>
                {page} / {data.pagination.totalPages}
              </span>
              <button
                className={page >= data.pagination.totalPages ? styles.pageBtnDisabled : styles.pageBtn}
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
                <ChevronRightRegular fontSize={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            {debouncedSearch ? '🔍' : '📦'}
          </div>
          <div className={styles.emptyTitle}>
            {debouncedSearch
              ? 'Aucun résultat pour votre recherche'
              : 'Aucun composant publié pour le moment'}
          </div>
          <div className={styles.emptySubtitle}>
            {debouncedSearch
              ? "Essayez avec d'autres mots-clés"
              : 'Soyez le premier à publier un composant !'}
          </div>
        </div>
      )}
    </div>
  );
}
