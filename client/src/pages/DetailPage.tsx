import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Card,
  Button,
  Badge,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@fluentui/react-components';
import {
  ArrowDownloadRegular,
  DeleteRegular,
  ArrowLeftRegular,
  MailRegular,
  PersonRegular,
  CalendarRegular,
  DocumentRegular,
  DismissRegular,
} from '@fluentui/react-icons';
import { fetchComponentById, deleteComponent, ComponentDetail } from '../services/api';
import { getAuthInfo, SwaUser } from '../services/auth';
import ErrorBar from '../components/ErrorBar';

const useStyles = makeStyles({
  container: {
    maxWidth: '960px',
    margin: '0 auto',
  },
  backButton: {
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    flexWrap: 'wrap',
    padding: '24px',
  },
  headerLeft: {
    flex: 1,
    minWidth: '200px',
  },
  title: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    lineHeight: tokens.lineHeightHero700,
  },
  description: {
    marginTop: '12px',
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase400,
    whiteSpace: 'pre-wrap' as const,
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '16px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  section: {
    marginTop: '32px',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '16px',
  },
  screenshotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '12px',
  },
  screenshotItem: {
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    cursor: 'pointer',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    transitionDuration: '0.2s',
    transitionProperty: 'box-shadow, transform',
    ':hover': {
      boxShadow: tokens.shadow8,
    },
  },
  screenshotImg: {
    width: '100%',
    height: '200px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  lightbox: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    cursor: 'pointer',
  },
  lightboxImg: {
    maxWidth: '90vw',
    maxHeight: '90vh',
    objectFit: 'contain' as const,
    borderRadius: tokens.borderRadiusMedium,
  },
  lightboxClose: {
    position: 'absolute' as const,
    top: '16px',
    right: '16px',
  },
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    padding: '64px',
  },
  notFound: {
    textAlign: 'center' as const,
    padding: '64px',
  },
});

export default function DetailPage() {
  const styles = useStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [component, setComponent] = useState<ComponentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState<SwaUser | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    getAuthInfo().then((info) => setUser(info.clientPrincipal));
  }, []);

  const isOwner = user && component && component.author_id === user.userId;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchComponentById(id)
      .then(setComponent)
      .catch((err) => {
        setError(err);
        setComponent(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteComponent(id);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.spinner}>
        <Spinner size="large" label="Chargement..." />
      </div>
    );
  }

  if (!component) {
    return (
      <div className={styles.notFound}>
        {error ? (
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <ErrorBar error={error} fallbackMessage="Impossible de charger le composant" />
          </div>
        ) : null}
        <Text size={600}>Composant non trouvé</Text>
        <br /><br />
        <Button appearance="primary" onClick={() => navigate('/')}>
          Retour à la galerie
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(component.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={styles.container}>
      <Button
        className={styles.backButton}
        appearance="subtle"
        icon={<ArrowLeftRegular />}
        onClick={() => navigate('/')}
      >
        Retour à la galerie
      </Button>

      <Card>
        {error ? (
          <div style={{ padding: '16px 16px 0' }}>
            <ErrorBar error={error} fallbackMessage="Une erreur est survenue" />
          </div>
        ) : null}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Text className={styles.title}>{component.title}</Text>
            <Text className={styles.description}>{component.description}</Text>

            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <PersonRegular />
                <Text weight="semibold">{component.author_name}</Text>
              </div>
              <a href={`mailto:${component.author_email}`} style={{ textDecoration: 'none' }}>
                <Badge appearance="outline" icon={<MailRegular />} size="large">
                  Contacter {component.author_name}
                </Badge>
              </a>
              <div className={styles.metaItem}>
                <CalendarRegular />
                <Text>{formattedDate}</Text>
              </div>
              <div className={styles.metaItem}>
                <DocumentRegular />
                <Text>{component.file_name}</Text>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <a href={component.fileUrl} download>
              <Button appearance="primary" icon={<ArrowDownloadRegular />} size="large">
                Télécharger
              </Button>
            </a>

            {isOwner && (
              <Dialog>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="outline" icon={<DeleteRegular />} size="large">
                    Supprimer
                  </Button>
                </DialogTrigger>
                <DialogSurface>
                  <DialogBody>
                    <DialogTitle>Supprimer ce composant ?</DialogTitle>
                    <DialogContent>
                      Cette action est irréversible. Le composant et tous ses fichiers seront supprimés.
                    </DialogContent>
                    <DialogActions>
                      <DialogTrigger disableButtonEnhancement>
                        <Button appearance="secondary">Annuler</Button>
                      </DialogTrigger>
                      <Button appearance="primary" onClick={handleDelete} disabled={deleting}>
                        {deleting ? 'Suppression...' : 'Supprimer'}
                      </Button>
                    </DialogActions>
                  </DialogBody>
                </DialogSurface>
              </Dialog>
            )}
          </div>
        </div>
      </Card>

      {component.screenshots.length > 0 && (
        <div className={styles.section}>
          <Divider />
          <Text className={styles.sectionTitle}>
            Screenshots ({component.screenshots.length})
          </Text>
          <div className={styles.screenshotGrid}>
            {component.screenshots.map((screenshot, index) => (
              <div
                key={screenshot.id}
                className={styles.screenshotItem}
                onClick={() => setLightboxIndex(index)}
              >
                <img
                  src={screenshot.url}
                  alt={screenshot.fileName}
                  className={styles.screenshotImg}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <div className={styles.lightbox} onClick={() => setLightboxIndex(null)}>
          <img
            src={component.screenshots[lightboxIndex].url}
            alt={component.screenshots[lightboxIndex].fileName}
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            className={styles.lightboxClose}
            appearance="primary"
            icon={<DismissRegular />}
            onClick={() => setLightboxIndex(null)}
          />
        </div>
      )}
    </div>
  );
}
