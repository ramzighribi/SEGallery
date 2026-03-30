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
} from '@fluentui/react-icons';
import ComponentCard from '../components/ComponentCard';
import ErrorBar from '../components/ErrorBar';
import { fetchComponents, ComponentSummary, PaginatedResponse } from '../services/api';

const useStyles = makeStyles({
  hero: {
    textAlign: 'center' as const,
    ...shorthands.padding('48px', '24px', '40px'),
    marginBottom: '40px',
  },
  heroTitle: {
    fontSize: '44px',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    lineHeight: '1.1',
    color: tokens.colorNeutralForeground1,
    marginBottom: '14px',
  },
  heroGradient: {
    background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: tokens.colorNeutralForeground3,
    lineHeight: '1.6',
    maxWidth: '500px',
    ...shorthands.margin('0', 'auto', '32px'),
  },
  searchWrapper: {
    maxWidth: '560px',
    ...shorthands.margin('0', 'auto'),
    position: 'relative' as const,
  },
  searchInput: {
    width: '100%',
    ...shorthands.padding('16px', '20px', '16px', '52px'),
    fontSize: '15px',
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.08)'),
    ...shorthands.borderRadius('50px'),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
    outlineStyle: 'none',
    transitionDuration: '0.3s',
    transitionProperty: 'border-color, box-shadow',
    fontFamily: 'inherit',
    color: tokens.colorNeutralForeground1,
    ':focus': {
      borderTopColor: '#0078d4',
      borderRightColor: '#0078d4',
      borderBottomColor: '#0078d4',
      borderLeftColor: '#0078d4',
      boxShadow: '0 4px 20px rgba(0, 120, 212, 0.15)',
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
      borderTopColor: 'rgba(0, 120, 212, 0.3)',
      borderRightColor: 'rgba(0, 120, 212, 0.3)',
      borderBottomColor: 'rgba(0, 120, 212, 0.3)',
      borderLeftColor: 'rgba(0, 120, 212, 0.3)',
    },
  },
  sortBtnActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    ...shorthands.padding('6px', '14px'),
    ...shorthands.borderRadius('10px'),
    ...shorthands.border('1px', 'solid', 'rgba(0, 120, 212, 0.3)'),
    backgroundColor: 'rgba(0, 120, 212, 0.08)',
    color: '#0078d4',
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
    background: 'linear-gradient(135deg, rgba(0, 120, 212, 0.1), rgba(0, 90, 158, 0.1))',
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
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.06)'),
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
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderTopColor: 'rgba(0, 120, 212, 0.3)',
      borderRightColor: 'rgba(0, 120, 212, 0.3)',
      borderBottomColor: 'rgba(0, 120, 212, 0.3)',
      borderLeftColor: 'rgba(0, 120, 212, 0.3)',
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
      const result = await fetchComponents(debouncedSearch, page, 12, sort);
      setData(result);
    } catch (err) {
      console.error('Failed to load components:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, sort]);

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
          Explorez et partagez les composants développés par les équipes SE Dynamics 365
        </p>
        <div className={styles.searchWrapper}>
          <SearchRegular className={styles.searchIcon} fontSize={20} />
          <input
            className={styles.searchInput}
            placeholder="Rechercher un composant, auteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

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
