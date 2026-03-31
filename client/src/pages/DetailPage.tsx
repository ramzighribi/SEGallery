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
  PersonRegular,
  CalendarRegular,
  DocumentRegular,
  DismissRegular,
  EyeRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  StarRegular,
  StarFilled,
  EditRegular,
} from '@fluentui/react-icons';
import { fetchComponentById, deleteComponent, trackDownload, rateComponent, updateComponent, formatAuthorName, getDownloadUrl, ComponentDetail, ComponentFile, fetchComments, createComment, updateCommentApi, deleteCommentApi, Comment, SECTOR_TAGS, TABLE_TAGS } from '../services/api';
import { getAuthInfo, SwaUser } from '../services/auth';
import ErrorBar from '../components/ErrorBar';
import RichTextEditor from '../components/RichTextEditor';

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
    '& p': { margin: '0 0 8px' },
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
    background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
  },
  statIconDownloads: {
    background: 'linear-gradient(135deg, #50e6ff 0%, #d13438 100%)',
  },
  statIconRating: {
    background: 'linear-gradient(135deg, #ffb900 0%, #ff8c00 100%)',
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
    backgroundColor: 'rgba(0, 120, 212, 0.08)',
    color: '#0078d4',
    fontSize: '13px',
    fontWeight: '500',
    textDecoration: 'none',
    transitionDuration: '0.2s',
    transitionProperty: 'background-color',
    ':hover': {
      backgroundColor: 'rgba(0, 120, 212, 0.15)',
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
    background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transitionDuration: '0.3s',
    transitionProperty: 'all',
    boxShadow: '0 4px 16px rgba(0, 120, 212, 0.3)',
    textDecoration: 'none',
    fontFamily: 'inherit',
    ':hover': {
      boxShadow: '0 6px 24px rgba(0, 120, 212, 0.4)',
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
    ...shorthands.border('1px', 'solid', 'rgba(209, 52, 56, 0.2)'),
    backgroundColor: 'rgba(209, 52, 56, 0.05)',
    color: '#d13438',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    fontFamily: 'inherit',
    ':hover': {
      backgroundColor: 'rgba(209, 52, 56, 0.1)',
      borderTopColor: 'rgba(209, 52, 56, 0.3)',
      borderRightColor: 'rgba(209, 52, 56, 0.3)',
      borderBottomColor: 'rgba(209, 52, 56, 0.3)',
      borderLeftColor: 'rgba(209, 52, 56, 0.3)',
    },
  },
  editBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    ...shorthands.padding('10px', '20px'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', 'rgba(0, 120, 212, 0.2)'),
    backgroundColor: 'rgba(0, 120, 212, 0.05)',
    color: '#0078d4',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    fontFamily: 'inherit',
    ':hover': {
      backgroundColor: 'rgba(0, 120, 212, 0.1)',
      borderTopColor: 'rgba(0, 120, 212, 0.3)',
      borderRightColor: 'rgba(0, 120, 212, 0.3)',
      borderBottomColor: 'rgba(0, 120, 212, 0.3)',
      borderLeftColor: 'rgba(0, 120, 212, 0.3)',
    },
  },
  editOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
  },
  editDialog: {
    backgroundColor: 'white',
    ...shorthands.borderRadius('20px'),
    ...shorthands.padding('32px'),
    width: '90%',
    maxWidth: '560px',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
  },
  editDialogTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
    marginBottom: '24px',
  },
  editField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '20px',
  },
  editLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  editInput: {
    width: '100%',
    ...shorthands.padding('12px', '16px'),
    fontSize: '15px',
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.1)'),
    ...shorthands.borderRadius('12px'),
    outlineStyle: 'none',
    fontFamily: 'inherit',
    color: tokens.colorNeutralForeground1,
    ':focus': {
      borderTopColor: '#0078d4',
      borderRightColor: '#0078d4',
      borderBottomColor: '#0078d4',
      borderLeftColor: '#0078d4',
      boxShadow: '0 0 0 3px rgba(0, 120, 212, 0.1)',
    },
  },
  editTextarea: {
    width: '100%',
    ...shorthands.padding('12px', '16px'),
    fontSize: '15px',
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.1)'),
    ...shorthands.borderRadius('12px'),
    outlineStyle: 'none',
    fontFamily: 'inherit',
    color: tokens.colorNeutralForeground1,
    resize: 'vertical' as const,
    minHeight: '100px',
    ':focus': {
      borderTopColor: '#0078d4',
      borderRightColor: '#0078d4',
      borderBottomColor: '#0078d4',
      borderLeftColor: '#0078d4',
      boxShadow: '0 0 0 3px rgba(0, 120, 212, 0.1)',
    },
  },
  editActions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '8px',
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
    backgroundColor: 'rgba(0, 120, 212, 0.08)',
    color: '#0078d4',
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
  carousel: {
    position: 'relative' as const,
    ...shorthands.borderRadius('16px'),
    ...shorthands.overflow('hidden'),
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.06)'),
    backgroundColor: '#f0f2f8',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
  },
  carouselTrack: {
    display: 'flex',
    transitionDuration: '0.5s',
    transitionProperty: 'transform',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  carouselSlide: {
    minWidth: '100%',
    cursor: 'pointer',
  },
  carouselImg: {
    width: '100%',
    height: '400px',
    objectFit: 'contain' as const,
    display: 'block',
    backgroundColor: '#f8f9fc',
  },
  carouselNav: {
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '40px',
    height: '40px',
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('0'),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    zIndex: 2,
    ':hover': {
      backgroundColor: 'white',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      transform: 'translateY(-50%) scale(1.05)',
    },
  },
  carouselDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    ...shorthands.padding('14px'),
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  dot: {
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('0'),
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    cursor: 'pointer',
    transitionDuration: '0.3s',
    transitionProperty: 'all',
    ...shorthands.padding('0'),
    ':hover': {
      backgroundColor: 'rgba(0, 120, 212, 0.4)',
    },
  },
  dotActive: {
    width: '24px',
    height: '8px',
    ...shorthands.borderRadius('4px'),
    ...shorthands.border('0'),
    backgroundColor: '#0078d4',
    cursor: 'pointer',
    transitionDuration: '0.3s',
    transitionProperty: 'all',
    ...shorthands.padding('0'),
  },
  carouselCounter: {
    position: 'absolute' as const,
    top: '12px',
    right: '12px',
    ...shorthands.padding('6px', '14px'),
    ...shorthands.borderRadius('50px'),
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    zIndex: 2,
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
  ratingSection: {
    marginTop: '24px',
    ...shorthands.padding('20px', '0', '0'),
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
  },
  ratingLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    marginBottom: '10px',
    display: 'block',
  },
  starsRow: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  starBtn: {
    ...shorthands.border('0'),
    ...shorthands.padding('2px'),
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transitionDuration: '0.15s',
    transitionProperty: 'transform',
    ':hover': {
      transform: 'scale(1.2)',
    },
  },
  ratingInfo: {
    marginLeft: '12px',
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
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
    background: 'linear-gradient(135deg, rgba(209, 52, 56, 0.1), rgba(80, 230, 255, 0.1))',
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
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<SwaUser | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

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
        setAverageRating(c.average_rating || 0);
        setRatingCount(c.rating_count || 0);
        if (c.user_rating) setUserRating(c.user_rating);
      })
      .catch((err) => {
        setError(err);
        setComponent(null);
      })
      .finally(() => setLoading(false));
    fetchComments(id).then(setComments).catch(() => {});
  }, [id]);

  const handleDownload = async (fileId?: string, fileName?: string) => {
    if (!id || !component) return;
    // Track download (best-effort), then navigate to server-side download endpoint
    trackDownload(id).then((r) => setDownloadCount(r.download_count)).catch(() => {});
    const a = document.createElement('a');
    a.href = getDownloadUrl(id, fileId);
    a.download = fileName || component.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const openEditDialog = () => {
    if (!component) return;
    setEditTitle(component.title);
    setEditDescription(component.description);
    setEditFiles([]);
    setEditTags(component.tags || []);
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!id || !component) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      setError(new Error('Le titre et la description sont requis'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', editTitle.trim());
      formData.append('description', editDescription.trim());
      formData.append('tags', JSON.stringify(editTags));
      if (editFiles.length > 0) {
        editFiles.forEach((f) => formData.append('files', f));
      }
      await updateComponent(id, formData);
      // Reload component data
      const updated = await fetchComponentById(id);
      setComponent(updated);
      setDownloadCount(updated.download_count || 0);
      setAverageRating(updated.average_rating || 0);
      setRatingCount(updated.rating_count || 0);
      setEditing(false);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRate = async (rating: number) => {
    if (!id || !user) return;
    setUserRating(rating);
    try {
      const result = await rateComponent(id, rating);
      setAverageRating(result.average_rating);
      setRatingCount(result.rating_count);
    } catch (err) {
      setError(err);
    }
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
              {component.tags && component.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                  {component.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '50px',
                        backgroundColor: SECTOR_TAGS.includes(tag) ? 'rgba(0,120,212,0.08)' : 'rgba(0,90,158,0.08)',
                        color: SECTOR_TAGS.includes(tag) ? '#0078d4' : '#005a9e',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >{tag}</span>
                  ))}
                </div>
              )}
              <div className={styles.description} dangerouslySetInnerHTML={{ __html: component.description }} />

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
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.statIconRating}`}>
                    <StarFilled fontSize={18} />
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statValue}>{averageRating > 0 ? averageRating.toFixed(1) : '—'}</span>
                    <span className={styles.statLabel}>{ratingCount} avis</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.downloadBtn} onClick={() => handleDownload()}>
                <ArrowDownloadRegular fontSize={18} />
                Télécharger
              </button>
              {isOwner && (
                <button className={styles.editBtn} onClick={openEditDialog}>
                  <EditRegular fontSize={16} />
                  Modifier
                </button>
              )}
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
              <Text weight="semibold">{formatAuthorName(component.author_name)}</Text>
            </div>
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
              {component.files && component.files.length > 1
                ? `${component.files.length} fichiers`
                : component.file_name}
            </div>
          </div>

          {user && (
            <div className={styles.ratingSection}>
              <span className={styles.ratingLabel}>Votre note</span>
              <div className={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={styles.starBtn}
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => handleRate(star)}
                    title={`${star}/5`}
                  >
                    {star <= (hoverStar || userRating) ? (
                      <StarFilled fontSize={28} style={{ color: '#ffb900' }} />
                    ) : (
                      <StarRegular fontSize={28} style={{ color: '#c8c6c4' }} />
                    )}
                  </button>
                ))}
                <span className={styles.ratingInfo}>
                  {userRating > 0 ? `Vous avez noté ${userRating}/5` : 'Cliquez pour noter'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {component.files && component.files.length > 1 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Fichiers</span>
            <span className={styles.sectionCount}>{component.files.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {component.files.map((f: ComponentFile) => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  <DocumentRegular fontSize={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.fileName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {(f.fileSize / 1024 / 1024).toFixed(1)} Mo
                  </div>
                </div>
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0, 120, 212, 0.2)',
                    backgroundColor: 'rgba(0, 120, 212, 0.05)',
                    color: '#0078d4',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onClick={() => handleDownload(f.id, f.fileName)}
                >
                  <ArrowDownloadRegular fontSize={14} />
                  Télécharger
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {component.screenshots.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>Screenshots</span>
            <span className={styles.sectionCount}>{component.screenshots.length}</span>
          </div>

          {/* Carousel */}
          <div className={styles.carousel}>
            <div className={styles.carouselCounter}>
              {carouselIndex + 1} / {component.screenshots.length}
            </div>
            <div
              className={styles.carouselTrack}
              style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
            >
              {component.screenshots.map((screenshot) => (
                <div key={screenshot.id} className={styles.carouselSlide} onClick={() => setLightboxIndex(carouselIndex)}>
                  <img
                    src={screenshot.url}
                    alt={screenshot.fileName}
                    className={styles.carouselImg}
                  />
                </div>
              ))}
            </div>
            {carouselIndex > 0 && (
              <button
                className={styles.carouselNav}
                style={{ left: '12px' }}
                onClick={() => setCarouselIndex(carouselIndex - 1)}
              >
                <ChevronLeftRegular fontSize={18} />
              </button>
            )}
            {carouselIndex < component.screenshots.length - 1 && (
              <button
                className={styles.carouselNav}
                style={{ right: '12px' }}
                onClick={() => setCarouselIndex(carouselIndex + 1)}
              >
                <ChevronRightRegular fontSize={18} />
              </button>
            )}
            {component.screenshots.length > 1 && (
              <div className={styles.carouselDots}>
                {component.screenshots.map((_, i) => (
                  <button
                    key={i}
                    className={i === carouselIndex ? styles.dotActive : styles.dot}
                    onClick={() => setCarouselIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className={styles.screenshotGrid} style={{ marginTop: '16px' }}>
            {component.screenshots.map((screenshot, index) => (
              <div
                key={screenshot.id}
                className={`${styles.screenshotItem} fade-in-up`}
                style={{
                  animationDelay: `${index * 0.08}s`,
                  animationFillMode: 'backwards',
                  borderColor: index === carouselIndex ? 'rgba(0, 120, 212, 0.4)' : undefined,
                  boxShadow: index === carouselIndex ? '0 4px 16px rgba(0, 120, 212, 0.15)' : undefined,
                }}
                onClick={() => setCarouselIndex(index)}
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

      {/* Comments section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Commentaires</span>
          <span className={styles.sectionCount}>{comments.length}</span>
        </div>

        {user && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0078d4, #005a9e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
              flexShrink: 0,
            }}>
              {formatAuthorName(user.userDetails).charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                maxLength={2000}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '60px',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <Button
                  appearance="primary"
                  size="small"
                  disabled={!newComment.trim() || submittingComment}
                  onClick={async () => {
                    if (!id || !newComment.trim()) return;
                    setSubmittingComment(true);
                    try {
                      const comment = await createComment(id, newComment.trim());
                      setComments((prev) => [...prev, comment]);
                      setNewComment('');
                    } catch (err) { setError(err); }
                    finally { setSubmittingComment(false); }
                  }}
                >
                  {submittingComment ? 'Envoi...' : 'Commenter'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {comments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#888', fontSize: '14px' }}>
            Aucun commentaire pour le moment. {user ? 'Soyez le premier !' : 'Connectez-vous pour commenter.'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {comments.map((c) => {
            const isCommentOwner = user && c.author_id === user.userId;
            const isEditing = editingCommentId === c.id;
            const initials = formatAuthorName(c.author_name).charAt(0).toUpperCase();
            const relativeDate = (() => {
              const diff = Date.now() - new Date(c.created_at).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 1) return "à l'instant";
              if (mins < 60) return `il y a ${mins} min`;
              const hours = Math.floor(mins / 60);
              if (hours < 24) return `il y a ${hours}h`;
              const days = Math.floor(hours / 24);
              if (days < 30) return `il y a ${days}j`;
              return new Date(c.created_at).toLocaleDateString('fr-FR');
            })();

            return (
              <div key={c.id} style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0,0,0,0.015)',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #50e6ff, #0078d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{formatAuthorName(c.author_name)}</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>{relativeDate}</span>
                    {c.updated_at !== c.created_at && (
                      <span style={{ fontSize: '11px', color: '#aaa', fontStyle: 'italic' }}>(modifié)</span>
                    )}
                  </div>
                  {isEditing ? (
                    <div>
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        maxLength={2000}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid rgba(0,120,212,0.3)',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          minHeight: '50px',
                          outline: 'none',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <Button size="small" appearance="primary" onClick={async () => {
                          if (!id) return;
                          try {
                            await updateCommentApi(id, c.id, editingCommentText.trim());
                            setComments((prev) => prev.map((x) => x.id === c.id ? { ...x, text: editingCommentText.trim(), updated_at: new Date().toISOString() } : x));
                            setEditingCommentId(null);
                          } catch (err) { setError(err); }
                        }}>Enregistrer</Button>
                        <Button size="small" appearance="secondary" onClick={() => setEditingCommentId(null)}>Annuler</Button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#333', whiteSpace: 'pre-wrap' }}>{c.text}</div>
                  )}
                  {isCommentOwner && !isEditing && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.text); }}
                        style={{ border: 'none', background: 'none', color: '#0078d4', fontSize: '12px', fontWeight: 500, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                      >Modifier</button>
                      <button
                        onClick={async () => {
                          if (!id || !confirm('Supprimer ce commentaire ?')) return;
                          try {
                            await deleteCommentApi(id, c.id);
                            setComments((prev) => prev.filter((x) => x.id !== c.id));
                          } catch (err) { setError(err); }
                        }}
                        style={{ border: 'none', background: 'none', color: '#d13438', fontSize: '12px', fontWeight: 500, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
                      >Supprimer</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit dialog */}
      {editing && (
        <div className={styles.editOverlay} onClick={() => setEditing(false)}>
          <div className={styles.editDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.editDialogTitle}>Modifier le composant</div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Titre</label>
              <input
                className={styles.editInput}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Description</label>
              <RichTextEditor
                value={editDescription}
                onChange={setEditDescription}
              />
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Remplacer les fichiers (optionnel)</label>
              <input
                type="file"
                accept=".zip,.html,.htm"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  const valid = selected.filter((f) => {
                    const ext = f.name.split('.').pop()?.toLowerCase();
                    return ['zip', 'html', 'htm'].includes(ext || '');
                  });
                  if (valid.length > 0) setEditFiles((prev) => [...prev, ...valid]);
                }}
                style={{ fontSize: '14px' }}
              />
              {editFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  {editFiles.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0078d4' }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <button
                        style={{ border: 'none', background: 'none', color: '#d13438', cursor: 'pointer', fontSize: '16px', padding: '2px' }}
                        onClick={() => setEditFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        title="Retirer"
                      >
                        <DismissRegular fontSize={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.editField}>
              <label className={styles.editLabel}>Tags</label>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '4px' }}>Secteur</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {SECTOR_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setEditTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '50px',
                        border: editTags.includes(tag) ? '1px solid #0078d4' : '1px solid rgba(0,0,0,0.08)',
                        backgroundColor: editTags.includes(tag) ? 'rgba(0,120,212,0.1)' : 'transparent',
                        color: editTags.includes(tag) ? '#0078d4' : '#555',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >{tag}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '4px' }}>Table Dataverse</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {TABLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setEditTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '50px',
                        border: editTags.includes(tag) ? '1px solid #005a9e' : '1px solid rgba(0,0,0,0.08)',
                        backgroundColor: editTags.includes(tag) ? 'rgba(0,90,158,0.1)' : 'transparent',
                        color: editTags.includes(tag) ? '#005a9e' : '#555',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >{tag}</button>
                  ))}
                </div>
              </div>
            </div>
            {error ? (
              <div style={{ marginBottom: '16px' }}>
                <ErrorBar error={error} fallbackMessage="Erreur lors de la modification" />
              </div>
            ) : null}
            <div className={styles.editActions}>
              <Button appearance="secondary" onClick={() => setEditing(false)} disabled={saving}>
                Annuler
              </Button>
              <Button appearance="primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
