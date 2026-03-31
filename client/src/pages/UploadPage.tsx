import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Spinner,
  shorthands,
} from '@fluentui/react-components';
import {
  ArrowUploadRegular,
  ImageRegular,
  DismissRegular,
  DocumentRegular,
  CheckmarkCircleRegular,
  PersonRegular,
  TagRegular,
  ChevronDownRegular,
  ChevronUpRegular,
} from '@fluentui/react-icons';
import { createComponent, SECTOR_TAGS, TABLE_TAGS } from '../services/api';
import { getAuthInfo, loginUrl, SwaUser } from '../services/auth';
import ErrorBar from '../components/ErrorBar';
import RichTextEditor from '../components/RichTextEditor';

const useStyles = makeStyles({
  container: {
    maxWidth: '680px',
    ...shorthands.margin('0', 'auto'),
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  pageTitleGradient: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  pageSubtitle: {
    fontSize: '15px',
    color: tokens.colorNeutralForeground3,
    marginBottom: '32px',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    ...shorthands.borderRadius('24px'),
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.5)'),
    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02)',
    ...shorthands.padding('36px'),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  required: {
    color: '#f43f5e',
  },
  hint: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground4,
  },
  input: {
    width: '100%',
    ...shorthands.padding('12px', '16px'),
    fontSize: '15px',
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.08)'),
    ...shorthands.borderRadius('12px'),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    outlineStyle: 'none',
    transitionDuration: '0.2s',
    transitionProperty: 'border-color, box-shadow',
    fontFamily: 'inherit',
    color: tokens.colorNeutralForeground1,
    ':focus': {
      borderTopColor: '#6366f1',
      borderRightColor: '#6366f1',
      borderBottomColor: '#6366f1',
      borderLeftColor: '#6366f1',
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
    },
    '::placeholder': {
      color: tokens.colorNeutralForeground4,
    },
  },
  textarea: {
    width: '100%',
    ...shorthands.padding('12px', '16px'),
    fontSize: '15px',
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.08)'),
    ...shorthands.borderRadius('12px'),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    outlineStyle: 'none',
    transitionDuration: '0.2s',
    transitionProperty: 'border-color, box-shadow',
    fontFamily: 'inherit',
    color: tokens.colorNeutralForeground1,
    resize: 'vertical' as const,
    minHeight: '120px',
    ':focus': {
      borderTopColor: '#6366f1',
      borderRightColor: '#6366f1',
      borderBottomColor: '#6366f1',
      borderLeftColor: '#6366f1',
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
    },
    '::placeholder': {
      color: tokens.colorNeutralForeground4,
    },
  },
  dropZone: {
    ...shorthands.border('2px', 'dashed', 'rgba(99, 102, 241, 0.25)'),
    ...shorthands.borderRadius('16px'),
    ...shorthands.padding('40px'),
    textAlign: 'center' as const,
    cursor: 'pointer',
    backgroundColor: 'rgba(99, 102, 241, 0.02)',
    transitionDuration: '0.2s',
    transitionProperty: 'border-color, background-color',
    ':hover': {
      borderTopColor: 'rgba(99, 102, 241, 0.4)',
      borderRightColor: 'rgba(99, 102, 241, 0.4)',
      borderBottomColor: 'rgba(99, 102, 241, 0.4)',
      borderLeftColor: 'rgba(99, 102, 241, 0.4)',
      backgroundColor: 'rgba(99, 102, 241, 0.04)',
    },
  },
  dropZoneIcon: {
    width: '48px',
    height: '48px',
    ...shorthands.borderRadius('14px'),
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.1))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.margin('0', 'auto', '12px'),
    color: '#6366f1',
  },
  dropZoneText: {
    fontSize: '15px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground2,
  },
  dropZoneHint: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground4,
    marginTop: '4px',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    ...shorthands.padding('12px', '16px'),
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', 'rgba(99, 102, 241, 0.1)'),
  },
  fileIcon: {
    width: '36px',
    height: '36px',
    ...shorthands.borderRadius('10px'),
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
  },
  fileDetails: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: '14px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground1,
    ...shorthands.overflow('hidden'),
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileSize: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  removeBtn: {
    width: '28px',
    height: '28px',
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('0'),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    ':hover': {
      backgroundColor: 'rgba(244, 63, 94, 0.1)',
      color: '#f43f5e',
    },
  },
  addScreenshotsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    ...shorthands.padding('10px', '20px'),
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.08)'),
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    color: tokens.colorNeutralForeground2,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    fontFamily: 'inherit',
    ':hover': {
      borderTopColor: 'rgba(99, 102, 241, 0.3)',
      borderRightColor: 'rgba(99, 102, 241, 0.3)',
      borderBottomColor: 'rgba(99, 102, 241, 0.3)',
      borderLeftColor: 'rgba(99, 102, 241, 0.3)',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
  },
  screenshotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '10px',
    marginTop: '12px',
  },
  screenshotPreview: {
    position: 'relative' as const,
    ...shorthands.borderRadius('12px'),
    ...shorthands.overflow('hidden'),
    aspectRatio: '16/10',
    ...shorthands.border('1px', 'solid', 'rgba(0, 0, 0, 0.06)'),
  },
  screenshotImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  screenshotRemove: {
    position: 'absolute' as const,
    top: '6px',
    right: '6px',
    width: '24px',
    height: '24px',
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('0'),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    transitionDuration: '0.2s',
    transitionProperty: 'background-color',
    ':hover': {
      backgroundColor: '#f43f5e',
    },
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('0'),
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
    backgroundSize: '200% auto',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transitionDuration: '0.3s',
    transitionProperty: 'all',
    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
    ':hover': {
      backgroundPosition: 'right center',
      boxShadow: '0 8px 28px rgba(99, 102, 241, 0.45)',
      transform: 'translateY(-2px)',
    },
  },
  submitBtnDisabled: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('0'),
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    opacity: 0.5,
    cursor: 'default',
    fontFamily: 'inherit',
    letterSpacing: '-0.01em',
  },
  loginCard: {
    textAlign: 'center' as const,
    ...shorthands.padding('60px', '32px'),
  },
  loginIcon: {
    width: '64px',
    height: '64px',
    ...shorthands.borderRadius('50%'),
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.1))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.margin('0', 'auto', '20px'),
    color: '#6366f1',
  },
  loginTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  loginSubtitle: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    marginBottom: '24px',
  },
  loginBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    ...shorthands.padding('14px', '28px'),
    ...shorthands.borderRadius('50px'),
    ...shorthands.border('0'),
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    color: 'white',
    fontSize: '15px',
    fontWeight: '600',
    textDecoration: 'none',
    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    ':hover': {
      boxShadow: '0 6px 24px rgba(99, 102, 241, 0.4)',
      transform: 'translateY(-1px)',
    },
  },
  successCard: {
    textAlign: 'center' as const,
    ...shorthands.padding('60px', '32px'),
  },
  successIcon: {
    width: '64px',
    height: '64px',
    ...shorthands.borderRadius('50%'),
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(52, 211, 153, 0.12))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.margin('0', 'auto', '20px'),
    color: '#10b981',
  },
  successTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  successSubtitle: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
  },
});

export default function UploadPage() {
  const styles = useStyles();
  const navigate = useNavigate();

  const [user, setUser] = useState<SwaUser | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAuthInfo().then((info) => setUser(info.clientPrincipal));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['zip', 'html', 'htm'].includes(ext || '');
    });
    if (valid.length !== selected.length) {
      setError(new Error('Seuls les fichiers .zip, .html ou .htm sont acceptés'));
    }
    if (files.length + valid.length > 20) {
      setError(new Error('Maximum 20 fichiers autorisés'));
      return;
    }
    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
      setError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScreenshotsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const validImages = selected.filter((f) => f.type.startsWith('image/'));

    if (screenshots.length + validImages.length > 10) {
      setError(new Error('Maximum 10 screenshots autorisés'));
      return;
    }

    const newPreviews = validImages.map((f) => URL.createObjectURL(f));
    setScreenshots((prev) => [...prev, ...validImages]);
    setScreenshotPreviews((prev) => [...prev, ...newPreviews]);
    setError(null);
  };

  const removeScreenshot = (index: number) => {
    URL.revokeObjectURL(screenshotPreviews[index]);
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setScreenshotPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    const valid = droppedFiles.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['zip', 'html', 'htm'].includes(ext || '');
    });
    if (valid.length === 0) {
      setError(new Error('Seuls les fichiers .zip, .html ou .htm sont acceptés'));
      return;
    }
    if (files.length + valid.length > 20) {
      setError(new Error('Maximum 20 fichiers autorisés'));
      return;
    }
    setFiles((prev) => [...prev, ...valid]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError(new Error('Le titre est requis')); return; }
    if (!description.trim()) { setError(new Error('La description est requise')); return; }
    if (files.length === 0) { setError(new Error('Au moins un fichier source est requis')); return; }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('tags', JSON.stringify(selectedTags));
      files.forEach((f) => formData.append('files', f));
      screenshots.forEach((s) => formData.append('screenshots', s));

      const result = await createComponent(formData);
      setSuccess(true);
      setTimeout(() => navigate(`/component/${result.id}`), 1500);
    } catch (err: any) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.loginCard} fade-in-up`}>
          <div className={styles.loginIcon}>
            <PersonRegular fontSize={28} />
          </div>
          <div className={styles.loginTitle}>Connexion requise</div>
          <div className={styles.loginSubtitle}>
            Connectez-vous avec votre compte Microsoft pour publier un composant.
          </div>
          <a href={loginUrl()} className={styles.loginBtn}>
            Se connecter avec Microsoft
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.successCard} fade-in-up`}>
          <div className={styles.successIcon}>
            <CheckmarkCircleRegular fontSize={32} />
          </div>
          <div className={styles.successTitle}>Composant publié avec succès !</div>
          <div className={styles.successSubtitle}>Redirection en cours...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Publier un <span className={styles.pageTitleGradient}>composant</span></h1>
      <p className={styles.pageSubtitle}>Partagez votre composant avec les équipes SE</p>

      {error ? (
        <div style={{ marginBottom: '24px' }}>
          <ErrorBar error={error} fallbackMessage="Erreur lors de la publication" />
        </div>
      ) : null}

      <div className={`${styles.card} fade-in-up`}>
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              Titre du composant <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              placeholder="Ex: DatePicker personnalisé, Navbar responsive..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Description <span className={styles.required}>*</span>
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Décrivez votre composant : fonctionnalités, cas d'usage, dépendances..."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setTagsOpen((v) => !v)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '50px',
                  border: selectedTags.length > 0 ? '1px solid #6366f1' : '1px solid rgba(0,0,0,0.08)',
                  backgroundColor: selectedTags.length > 0 ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.6)',
                  color: selectedTags.length > 0 ? '#6366f1' : '#666',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                <TagRegular fontSize={14} />
                Sélectionner des tags
                {selectedTags.length > 0 && (
                  <span style={{
                    backgroundColor: '#6366f1',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>{selectedTags.length}</span>
                )}
                {tagsOpen ? <ChevronUpRegular fontSize={12} /> : <ChevronDownRegular fontSize={12} />}
              </button>
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
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
              {selectedTags.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedTags([])}
                  style={{ border: 'none', background: 'none', color: '#f43f5e', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px' }}
                >Tout effacer</button>
              )}
            </div>
            {tagsOpen && (
              <div style={{
                marginTop: '8px',
                padding: '14px 18px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                animation: 'slideDown 0.2s ease-out',
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>Secteur</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {SECTOR_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTags((prev) => active ? prev.filter((t) => t !== tag) : [...prev, tag])}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '50px',
                            border: active ? '1px solid #6366f1' : '1px solid rgba(0,0,0,0.06)',
                            backgroundColor: active ? 'rgba(99,102,241,0.1)' : 'transparent',
                            color: active ? '#6366f1' : '#666',
                            fontSize: '12px',
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
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '6px' }}>Table Dataverse</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {TABLE_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedTags((prev) => active ? prev.filter((t) => t !== tag) : [...prev, tag])}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '50px',
                            border: active ? '1px solid #8b5cf6' : '1px solid rgba(0,0,0,0.06)',
                            backgroundColor: active ? 'rgba(139,92,246,0.1)' : 'transparent',
                            color: active ? '#8b5cf6' : '#666',
                            fontSize: '12px',
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

          <div className={styles.field}>
            <label className={styles.label}>
              Fichiers source <span className={styles.required}>*</span>
            </label>
            <span className={styles.hint}>
              Formats acceptés : .zip, .html, .htm (max 50 Mo chacun, jusqu'à 20 fichiers)
            </span>

            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map((f, index) => (
                  <div key={index} className={styles.fileInfo}>
                    <div className={styles.fileIcon}>
                      <DocumentRegular fontSize={16} />
                    </div>
                    <div className={styles.fileDetails}>
                      <div className={styles.fileName}>{f.name}</div>
                      <div className={styles.fileSize}>
                        {(f.size / 1024 / 1024).toFixed(1)} Mo
                      </div>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeFile(index)}
                    >
                      <DismissRegular fontSize={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {files.length < 20 && (
              <div
                className={styles.dropZone}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={dragOver ? {
                  borderColor: 'rgba(0, 120, 212, 0.6)',
                  backgroundColor: 'rgba(0, 120, 212, 0.08)',
                } : undefined}
              >
                <div className={styles.dropZoneIcon}>
                  <ArrowUploadRegular fontSize={22} />
                </div>
                <div className={styles.dropZoneText}>
                  {dragOver ? 'Déposez les fichiers ici' : 'Cliquez pour sélectionner des fichiers'}
                </div>
                <div className={styles.dropZoneHint}>ou glissez-déposez ici</div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.html,.htm"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Screenshots</label>
            <span className={styles.hint}>
              Ajoutez jusqu'à 10 captures d'écran de votre composant
            </span>

            <button
              className={styles.addScreenshotsBtn}
              onClick={() => screenshotInputRef.current?.click()}
              disabled={screenshots.length >= 10}
            >
              <ImageRegular fontSize={16} />
              Ajouter des screenshots ({screenshots.length}/10)
            </button>

            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              onChange={handleScreenshotsSelect}
              style={{ display: 'none' }}
            />

            {screenshotPreviews.length > 0 && (
              <div className={styles.screenshotGrid}>
                {screenshotPreviews.map((src, index) => (
                  <div key={index} className={styles.screenshotPreview}>
                    <img src={src} alt={`Screenshot ${index + 1}`} className={styles.screenshotImg} />
                    <button
                      className={styles.screenshotRemove}
                      onClick={() => removeScreenshot(index)}
                    >
                      <DismissRegular fontSize={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            className={submitting ? styles.submitBtnDisabled : styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner size="tiny" appearance="inverted" />
                Publication en cours...
              </>
            ) : (
              <>
                <ArrowUploadRegular fontSize={18} />
                Publier le composant
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
