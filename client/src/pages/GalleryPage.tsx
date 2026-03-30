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
    fontSize: '40px',
    fontWeight: '800',
    letterSpacing: '-0.03em',
    lineHeight: '1.1',
    color: tokens.colorNeutralForeground1,
    marginBottom: '12px',
  },
  heroGradient: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
      borderTopColor: '#667eea',
      borderRightColor: '#667eea',
      borderBottomColor: '#667eea',
      borderLeftColor: '#667eea',
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
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
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
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
      borderTopColor: 'rgba(102, 126, 234, 0.3)',
      borderRightColor: 'rgba(102, 126, 234, 0.3)',
      borderBottomColor: 'rgba(102, 126, 234, 0.3)',
      borderLeftColor: 'rgba(102, 126, 234, 0.3)',
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
      const result = await fetchComponents(debouncedSearch, page);
      setData(result);
    } catch (err) {
      console.error('Failed to load components:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

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
          Explorez et partagez les composants développés par les équipes SE
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
