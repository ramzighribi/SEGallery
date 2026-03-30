import { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Input,
  Text,
  Spinner,
  Button,
} from '@fluentui/react-components';
import { SearchRegular, ArrowLeftRegular, ArrowRightRegular } from '@fluentui/react-icons';
import ComponentCard from '../components/ComponentCard';
import ErrorBar from '../components/ErrorBar';
import { fetchComponents, ComponentSummary, PaginatedResponse } from '../services/api';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '32px',
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  searchRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    maxWidth: '500px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
    gap: '20px',
    justifyItems: 'center',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '64px 16px',
    color: tokens.colorNeutralForeground3,
  },
  emptyIcon: {
    fontSize: '64px',
    opacity: 0.3,
    marginBottom: '16px',
  },
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    padding: '64px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    marginTop: '32px',
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
      <div className={styles.header}>
        <Text className={styles.title}>Galerie des Composants</Text>
        <Text className={styles.subtitle}>
          Découvrez et partagez les composants développés par les équipes SE
        </Text>
        <div className={styles.searchRow}>
          <Input
            placeholder="Rechercher un composant, auteur..."
            contentBefore={<SearchRegular />}
            value={search}
            onChange={(_, d) => setSearch(d.value)}
            style={{ flex: 1 }}
            size="large"
          />
        </div>
      </div>

      {error ? (
        <div style={{ marginBottom: '16px' }}>
          <ErrorBar error={error} fallbackMessage="Impossible de charger les composants" />
        </div>
      ) : null}

      {loading ? (
        <div className={styles.spinner}>
          <Spinner size="large" label="Chargement..." />
        </div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className={styles.grid}>
            {data.data.map((comp) => (
              <ComponentCard key={comp.id} component={comp} />
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <div className={styles.pagination}>
              <Button
                appearance="subtle"
                icon={<ArrowLeftRegular />}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Précédent
              </Button>
              <Text>
                Page {page} / {data.pagination.totalPages} ({data.pagination.total} résultats)
              </Text>
              <Button
                appearance="subtle"
                icon={<ArrowRightRegular />}
                iconPosition="after"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📭</div>
          <Text size={500} weight="semibold">
            {debouncedSearch
              ? 'Aucun résultat pour votre recherche'
              : 'Aucun composant publié pour le moment'}
          </Text>
          <br />
          <Text className={styles.subtitle}>
            {debouncedSearch
              ? "Essayez avec d'autres mots-clés"
              : 'Soyez le premier à publier un composant !'}
          </Text>
        </div>
      )}
    </div>
  );
}
