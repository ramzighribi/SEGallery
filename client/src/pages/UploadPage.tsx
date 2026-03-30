import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Input,
  Textarea,
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Badge,
} from '@fluentui/react-components';
import {
  ArrowUploadRegular,
  ImageRegular,
  DismissRegular,
  DocumentRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons';
import { createComponent } from '../services/api';
import { getAuthInfo, loginUrl, SwaUser } from '../services/auth';

const useStyles = makeStyles({
  container: {
    maxWidth: '720px',
    margin: '0 auto',
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '24px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  required: {
    color: tokens.colorPaletteRedForeground1,
  },
  dropZone: {
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '32px',
    textAlign: 'center' as const,
    cursor: 'pointer',
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  screenshotGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '8px',
    marginTop: '8px',
  },
  screenshotPreview: {
    position: 'relative' as const,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    aspectRatio: '16/10',
  },
  screenshotImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  removeBtn: {
    position: 'absolute' as const,
    top: '4px',
    right: '4px',
    minWidth: '24px',
    width: '24px',
    height: '24px',
    padding: '0',
  },
  loginCard: {
    textAlign: 'center' as const,
    padding: '48px',
  },
});

export default function UploadPage() {
  const styles = useStyles();
  const navigate = useNavigate();

  const [user, setUser] = useState<SwaUser | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAuthInfo().then((info) => setUser(info.clientPrincipal));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['zip', 'html', 'htm'].includes(ext || '')) {
        setError('Seuls les fichiers .zip, .html ou .htm sont acceptés');
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleScreenshotsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const validImages = selected.filter((f) => f.type.startsWith('image/'));

    if (screenshots.length + validImages.length > 10) {
      setError('Maximum 10 screenshots autorisés');
      return;
    }

    const newPreviews = validImages.map((f) => URL.createObjectURL(f));
    setScreenshots((prev) => [...prev, ...validImages]);
    setScreenshotPreviews((prev) => [...prev, ...newPreviews]);
    setError('');
  };

  const removeScreenshot = (index: number) => {
    URL.revokeObjectURL(screenshotPreviews[index]);
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setScreenshotPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Le titre est requis'); return; }
    if (!description.trim()) { setError('La description est requise'); return; }
    if (!file) { setError('Le fichier du composant est requis'); return; }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('file', file);
      screenshots.forEach((s) => formData.append('screenshots', s));

      const result = await createComponent(formData);
      setSuccess(true);
      setTimeout(() => navigate(`/component/${result.id}`), 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la publication');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <Card className={styles.loginCard}>
          <Text size={500} weight="semibold">Connexion requise</Text>
          <br /><br />
          <Text>Connectez-vous avec votre compte Microsoft pour publier un composant.</Text>
          <br /><br />
          <a href={loginUrl()}>
            <Button appearance="primary" size="large">
              Se connecter avec Microsoft
            </Button>
          </a>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.container}>
        <Card className={styles.loginCard}>
          <CheckmarkCircleRegular fontSize={64} color={tokens.colorPaletteGreenForeground1} />
          <br />
          <Text size={500} weight="semibold">Composant publié avec succès !</Text>
          <br />
          <Text>Redirection en cours...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Text className={styles.title}>Publier un Composant</Text>

      {error && (
        <MessageBar intent="error" style={{ marginBottom: '16px' }}>
          <MessageBarBody>
            <MessageBarTitle>Erreur</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      <Card>
        <div className={styles.form}>
          <div className={styles.field}>
            <Text className={styles.label}>
              Titre du composant <span className={styles.required}>*</span>
            </Text>
            <Input
              placeholder="Ex: DatePicker personnalisé, Navbar responsive..."
              value={title}
              onChange={(_, d) => setTitle(d.value)}
              maxLength={200}
              size="large"
            />
          </div>

          <div className={styles.field}>
            <Text className={styles.label}>
              Description <span className={styles.required}>*</span>
            </Text>
            <Textarea
              placeholder="Décrivez votre composant : fonctionnalités, cas d'usage, dépendances..."
              value={description}
              onChange={(_, d) => setDescription(d.value)}
              rows={5}
              resize="vertical"
            />
          </div>

          <div className={styles.field}>
            <Text className={styles.label}>
              Fichier source <span className={styles.required}>*</span>
            </Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Formats acceptés : .zip, .html, .htm (max 50 Mo)
            </Text>

            {file ? (
              <div className={styles.fileInfo}>
                <DocumentRegular />
                <Text>{file.name}</Text>
                <Badge size="small" appearance="outline">
                  {(file.size / 1024 / 1024).toFixed(1)} Mo
                </Badge>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<DismissRegular />}
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                />
              </div>
            ) : (
              <div className={styles.dropZone} onClick={() => fileInputRef.current?.click()}>
                <ArrowUploadRegular fontSize={32} />
                <br />
                <Text>Cliquez pour sélectionner un fichier</Text>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.html,.htm"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <div className={styles.field}>
            <Text className={styles.label}>Screenshots</Text>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Ajoutez jusqu'à 10 captures d'écran de votre composant
            </Text>

            <Button
              appearance="outline"
              icon={<ImageRegular />}
              onClick={() => screenshotInputRef.current?.click()}
              disabled={screenshots.length >= 10}
            >
              Ajouter des screenshots ({screenshots.length}/10)
            </Button>

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
                    <Button
                      className={styles.removeBtn}
                      appearance="primary"
                      icon={<DismissRegular />}
                      size="small"
                      onClick={() => removeScreenshot(index)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            appearance="primary"
            size="large"
            onClick={handleSubmit}
            disabled={submitting}
            icon={submitting ? <Spinner size="tiny" /> : <ArrowUploadRegular />}
          >
            {submitting ? 'Publication en cours...' : 'Publier le composant'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
