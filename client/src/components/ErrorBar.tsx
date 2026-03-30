import { useState } from 'react';
import {
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Button,
  Text,
} from '@fluentui/react-components';
import {
  ChevronDownRegular,
  ChevronUpRegular,
} from '@fluentui/react-icons';
import { ApiError, ApiErrorDetail } from '../services/api';

const useStyles = makeStyles({
  details: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
    maxHeight: '300px',
    overflowY: 'auto',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  row: {
    display: 'flex',
    gap: '8px',
    padding: '2px 0',
  },
  label: {
    color: tokens.colorNeutralForeground3,
    minWidth: '90px',
    fontWeight: tokens.fontWeightSemibold,
  },
  value: {
    color: tokens.colorNeutralForeground1,
    flex: 1,
  },
  toggleBtn: {
    marginTop: '6px',
  },
});

interface ErrorBarProps {
  error: unknown;
  fallbackMessage?: string;
}

function extractDetail(error: unknown): ApiErrorDetail | null {
  if (error instanceof ApiError) return error.detail;
  return null;
}

export default function ErrorBar({ error, fallbackMessage = 'Une erreur est survenue' }: ErrorBarProps) {
  const styles = useStyles();
  const [showDetails, setShowDetails] = useState(false);

  const detail = extractDetail(error);
  const message = detail?.message || (error instanceof Error ? error.message : fallbackMessage);

  return (
    <MessageBar intent="error">
      <MessageBarBody>
        <MessageBarTitle>Erreur</MessageBarTitle>
        {message}
        {detail && (
          <>
            <br />
            <Button
              className={styles.toggleBtn}
              appearance="subtle"
              size="small"
              icon={showDetails ? <ChevronUpRegular /> : <ChevronDownRegular />}
              onClick={() => setShowDetails((v) => !v)}
            >
              {showDetails ? 'Masquer les détails' : 'Afficher les détails'}
            </Button>
            {showDetails && (
              <div className={styles.details}>
                {detail.status && (
                  <div className={styles.row}>
                    <Text className={styles.label}>Status:</Text>
                    <Text className={styles.value}>{detail.status}</Text>
                  </div>
                )}
                {detail.function && (
                  <div className={styles.row}>
                    <Text className={styles.label}>Fonction:</Text>
                    <Text className={styles.value}>{detail.function}</Text>
                  </div>
                )}
                {detail.code && (
                  <div className={styles.row}>
                    <Text className={styles.label}>Code:</Text>
                    <Text className={styles.value}>{detail.code}</Text>
                  </div>
                )}
                {detail.message && (
                  <div className={styles.row}>
                    <Text className={styles.label}>Message:</Text>
                    <Text className={styles.value}>{detail.message}</Text>
                  </div>
                )}
                {detail.timestamp && (
                  <div className={styles.row}>
                    <Text className={styles.label}>Timestamp:</Text>
                    <Text className={styles.value}>{detail.timestamp}</Text>
                  </div>
                )}
                {detail.method && detail.url && (
                  <div className={styles.row}>
                    <Text className={styles.label}>Requête:</Text>
                    <Text className={styles.value}>{detail.method} {detail.url}</Text>
                  </div>
                )}
                {detail.stack && (
                  <div className={styles.row}>
                    <Text className={styles.label}>Stack:</Text>
                    <Text className={styles.value}>{detail.stack}</Text>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </MessageBarBody>
    </MessageBar>
  );
}
