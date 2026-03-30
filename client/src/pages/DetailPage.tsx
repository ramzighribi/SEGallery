import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  shorthands,
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
  EyeRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import { fetchComponentById, deleteComponent, trackDownload, ComponentDetail } from '../services/api';
import { getAuthInfo, SwaUser } from '../services/auth';
import ErrorBar from '../components/ErrorBar';

const useStyles = makeStyles({
  container: {
    maxWidth: '960px',
    ...shorthands.margin('0', 'auto'),
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ...shorthands.padding('8px', '16px'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('0'),
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    marginBottom: '20px',
    fontFamily: 'inherit',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      color: tokens.colorNeutralForeground1,
    },
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    ...shorthands.borderRadius('20px'),
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.5)'),
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
    ...shorthands.overflow('hidden'),
  },
  cardInner: {
    ...shorthands.padding('32px'),
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '24px',
    flexWrap: 'wrap',
  },
  titleLeft: {
    flex: 1,
    minWidth: '250px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
    color: tokens.colorNeutralForeground1,
  },
  description: {
    marginTop: '12px',
    fontSize: '15px',
    lineHeight: '1.7',
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'pre-wrap' as const,
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    flexWrap: 'wrap',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    ...shorthands.padding('12px', '20px'),
    ...shorthands.borderRadius('14px'),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.04)'),
  },
  statIcon: {
    width: '36px',
    height: '36px',
    ...shorthands.borderRadius('10px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    color: 'white',
    flexShrink: 0,
  },
  statIconViews: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  statIconDownloads: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    lineHeight: '1.2',
    color: tokens.colorNeutralForeground1,
  },
  statLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    fontWeight: '500',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    marginTop: '24px',
    ...shorthands.padding('20px', '0', '0'),
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
  },
  metaIcon: {
    width: '28px',
    height: '28px',
    ...shorthands.borderRadius('8px'),
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contactLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ...shorthands.padding('6px', '14px'),
    ...shorthands.borderRadius('50px'),
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    color: '#667eea',
    fontSize: '13px',
    fontWeight: '500',
    textDecoration: 'none',
    transitionDuration: '0.2s',
    transitionProperty: 'background-color',
    ':hover': {
      backgroundColor: 'rgba(102, 126, 234, 0.15)',
    },
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0,
  },
  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ...shorthands.padding('14px', '28px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('0'),
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transitionDuration: '0.3s',
    transitionProperty: 'all',
    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
    textDecoration: 'none',
    fontFamily: 'inherit',
    ':hover': {
      boxShadow: '0 6px 24px rgba(102, 126, 234, 0.4)',
      transform: 'translateY(-2px)',
    },
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    ...shorthands.padding('10px', '20px'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', 'rgba(245, 87, 108, 0.2)'),
    backgroundColor: 'rgba(245, 87, 108, 0.05)',
    color: '#f5576c',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    fontFamily: 'inherit',
    ':hover': {
      backgroundColor: 'rgba(245, 87, 108, 0.1)',
      borderTopColor: 'rgba(245, 87, 108, 0.3)',
      borderRightColor: 'rgba(245, 87, 108, 0.3)',
      borderBottomColor: 'rgba(245, 87, 108, 0.3)',
      borderLeftColor: 'rgba(245, 87, 108, 0.3)',
    },
  },
  section: {
    marginTop: '32px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  sectionCount: {
    ...shorthands.padding('2px', '10px'),
    ...shorthands.borderRadius('50px'),
    backgroundColor: 'rgba(102, 126, 234, 0.08)',
    color: '#667eea',
    fontSize: '13px',
    fontWeight: '600',
  },
  screenshotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
  },
  screenshotItem: {
    ...shorthands.borderRadius('14px'),
    ...shorthands.overflow('hidden'),
    cursor: 'pointer',
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.06)'),
    transitionDuration: '0.3s',
    transitionProperty: 'transform, box-shadow',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
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
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    cursor: 'pointer',
  },
  lightboxImg: {
    maxWidth: '90vw',
    maxHeight: '85vh',
    objectFit: 'contain' as const,
    ...shorthands.borderRadius('12px'),
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
  },
  lightboxClose: {
    position: 'absolute' as const,
    top: '24px',
    right: '24px',
    width: '40px',
    height: '40px',
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('0'),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'background-color',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
  },
  lightboxNav: {
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '44px',
    height: '44px',
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('0'),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'background-color',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
  },
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.padding('80px'),
  },
  notFound: {
    textAlign: 'center' as const,
    ...shorthands.padding('80px', '24px'),
  },
  notFoundIcon: {
    width: '80px',
    height: '80px',
    ...shorthands.borderRadius('50%'),
    background: 'linear-gradient(135deg, rgba(245, 87, 108, 0.1), rgba(240, 147, 251, 0.1))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    ...shorthands.margin('0', 'auto', '20px'),
  },
});

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

export default function DetailPage() {
  const styles = useStyles();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [component, setComponent] = useState<ComponentDetail | null>(null);
  const [downloadCount, setDownloadCount] = useState(0);
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
      .then((c) => {
        setComponent(c);
        setDownloadCount(c.download_count || 0);
      })
      .catch((err) => {
        setError(err);
        setComponent(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!id || !component) return;
    try {
      const result = await trackDownload(id);
      setDownloadCount(result.download_count);
    } catch {
      // download tracking is best-effort
    }
    window.open(component.fileUrl, '_blank');
  };

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
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <ErrorBar error={error} fallbackMessage="Impossible de charger le composant" />
          </div>
        ) : null}
        <div className={styles.notFoundIcon}>&#x1F50D;</div>
        <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
          Composant non trouvé
        </div>
        <div style={{ fontSize: '14px', color: tokens.colorNeutralForeground3, marginBottom: '24px' }}>
          Ce composant n'existe pas ou a été supprimé
        </div>
        <button
          className={styles.downloadBtn}
          style={{ display: 'inline-flex' }}
          onClick={() => navigate('/')}
        >
          Retour à la galerie
        </button>
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
      <button className={styles.backBtn} onClick={() => navigate('/')}>
        <ArrowLeftRegular fontSize={16} />
        Retour à la galerie
      </button>

      <div className={`${styles.mainCard} fade-in-up`}>
        {error ? (
          <div style={{ padding: '20px 32px 0' }}>
            <ErrorBar error={error} fallbackMessage="Une erreur est survenue" />
          </div>
        ) : null}
        <div className={styles.cardInner}>
          <div className={styles.titleRow}>
            <div className={styles.titleLeft}>
              <h1 className={styles.title}>{component.title}</h1>
              <p className={styles.description}>{component.description}</p>

              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.statIconViews}`}>
                    <EyeRegular fontSize={18} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>{formatCount(component.view_count || 0)}</span>
                    <span className={styles.statLabel}>Vues</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.statIconDownloads}`}>
                    <ArrowDownloadRegular fontSize={18} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>{formatCount(downloadCount)}</span>
                    <span className={styles.statLabel}>Téléchargements</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.downloadBtn} onClick={handleDownload}>
                <ArrowDownloadRegular fontSize={18} />
                Télécharger
              </button>
              {isOwner && (
                <Dialog>
                  <DialogTrigger disableButtonEnhancement>
                    <button className={styles.deleteBtn}>
                      <DeleteRegular fontSize={16} />
                      Supprimer
                    </button>
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

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <div className={styles.metaIcon}>
                <PersonRegular fontSize={14} />
              </div>
              <Text weight="semibold">{component.author_name}</Text>
            </div>
            <a href={`mailto:${component.author_email}`} className={styles.contactLink}>
              <MailRegular fontSize={14} />
              Contacter
            </a>
            <div className={styles.metaItem}>
              <div className={styles.metaIcon}>
                <CalendarRegular fontSize={14} />
              </div>
              {formattedDate}
            </div>
            <div className={styles.metaItem}>
              <div className={styles.metaIcon}>
                <DocumentRegular fontSize={14} />
              </div>
              {component.file_name}
            </div>
          </div>
        </div>
      </div>

      {component.screenshots.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Screenshots</span>
            <span className={styles.sectionCount}>{component.screenshots.length}</span>
          </div>
          <div className={styles.screenshotGrid}>
            {component.screenshots.map((screenshot, index) => (
              <div
                key={screenshot.id}
                className={`${styles.screenshotItem} fade-in-up`}
                style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'backwards' }}
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
        <div className={`${styles.lightbox} fade-in`} onClick={() => setLightboxIndex(null)}>
          <img
            src={component.screenshots[lightboxIndex].url}
            alt={component.screenshots[lightboxIndex].fileName}
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
          <button className={styles.lightboxClose} onClick={() => setLightboxIndex(null)}>
            <DismissRegular fontSize={18} />
          </button>
          {lightboxIndex > 0 && (
            <button
              className={styles.lightboxNav}
              style={{ left: '24px' }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            >
              <ChevronLeftRegular fontSize={20} />
            </button>
          )}
          {lightboxIndex < component.screenshots.length - 1 && (
            <button
              className={styles.lightboxNav}
              style={{ right: '24px' }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
            >
              <ChevronRightRegular fontSize={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
