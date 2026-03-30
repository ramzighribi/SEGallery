import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  Tooltip,
} from '@fluentui/react-components';
import { PersonRegular, CalendarRegular } from '@fluentui/react-icons';
import type { ComponentSummary } from '../services/api';

const useStyles = makeStyles({
  card: {
    cursor: 'pointer',
    width: '100%',
    maxWidth: '320px',
    transitionDuration: '0.2s',
    transitionProperty: 'box-shadow, transform',
    ':hover': {
      boxShadow: tokens.shadow8,
    },
  },
  preview: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  placeholder: {
    fontSize: '48px',
    opacity: 0.3,
  },
  description: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '8px',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
});

interface Props {
  component: ComponentSummary;
}

export default function ComponentCard({ component }: Props) {
  const styles = useStyles();
  const navigate = useNavigate();

  const formattedDate = new Date(component.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card
      className={styles.card}
      onClick={() => navigate(`/component/${component.id}`)}
    >
      <CardPreview className={styles.preview}>
        {component.thumbnail ? (
          <img
            src={component.thumbnail}
            alt={component.title}
            className={styles.thumbnail}
          />
        ) : (
          <span className={styles.placeholder}>📦</span>
        )}
      </CardPreview>

      <CardHeader
        header={
          <Text weight="semibold" size={400}>
            {component.title}
          </Text>
        }
        description={
          <>
            <Text className={styles.description}>{component.description}</Text>
            <div className={styles.meta}>
              <Tooltip content={component.author_email} relationship="label">
                <Badge appearance="outline" size="small" icon={<PersonRegular />}>
                  {component.author_name}
                </Badge>
              </Tooltip>
              <span className={styles.metaItem}>
                <CalendarRegular fontSize={12} />
                {formattedDate}
              </span>
            </div>
          </>
        }
      />
    </Card>
  );
}
