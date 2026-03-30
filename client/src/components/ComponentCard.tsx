import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  shorthands,
} from '@fluentui/react-components';
import {
  EyeRegular,
  ArrowDownloadRegular,
  PersonRegular,
  CalendarRegular,
  StarFilled,
} from '@fluentui/react-icons';
import type { ComponentSummary } from '../services/api';

const useStyles = makeStyles({
  card: {
    cursor: 'pointer',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    ...shorthands.borderRadius('16px'),
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.5)'),
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
    ...shorthands.overflow('hidden'),
    transitionDuration: '0.3s',
    transitionProperty: 'transform, box-shadow, border-color',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 40px rgba(0, 120, 212, 0.12)',
      borderTopColor: 'rgba(0, 120, 212, 0.3)',
      borderRightColor: 'rgba(0, 120, 212, 0.3)',
      borderBottomColor: 'rgba(0, 120, 212, 0.3)',
      borderLeftColor: 'rgba(0, 120, 212, 0.3)',
    },
  },
  imageWrapper: {
    position: 'relative' as const,
    height: '200px',
    ...shorthands.overflow('hidden'),
    backgroundColor: '#f0f2f8',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    transitionDuration: '0.4s',
    transitionProperty: 'transform',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f2f8 0%, #e8eaf6 100%)',
  },
  placeholderText: {
    fontSize: '48px',
    opacity: 0.4,
  },
  statsOverlay: {
    position: 'absolute' as const,
    top: '12px',
    right: '12px',
    display: 'flex',
    gap: '6px',
  },
  statPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    ...shorthands.padding('4px', '10px'),
    ...shorthands.borderRadius('50px'),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
  },
  body: {
    ...shorthands.padding('16px', '20px', '20px'),
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  title: {
    fontWeight: '600',
    fontSize: '16px',
    color: tokens.colorNeutralForeground1,
    letterSpacing: '-0.01em',
    lineHeight: '1.3',
  },
  description: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    ...shorthands.overflow('hidden'),
    fontSize: '13px',
    lineHeight: '1.5',
    color: tokens.colorNeutralForeground3,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('0', '20px', '16px'),
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground2,
  },
  authorIcon: {
    width: '22px',
    height: '22px',
    ...shorthands.borderRadius('50%'),
    background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '11px',
  },
  date: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
  },
});

interface Props {
  component: ComponentSummary;
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

export default function ComponentCard({ component }: Props) {
  const styles = useStyles();
  const navigate = useNavigate();

  const formattedDate = new Date(component.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });

  const initials = component.author_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/component/${component.id}`)}
    >
      <div className={styles.imageWrapper}>
        {component.thumbnail ? (
          <img
            src={component.thumbnail}
            alt={component.title}
            className={styles.thumbnail}
          />
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.placeholderText}>&#x1F4E6;</span>
          </div>
        )}
        <div className={styles.statsOverlay}>
          <div className={styles.statPill}>
            <EyeRegular fontSize={13} />
            {formatCount(component.view_count || 0)}
          </div>
          <div className={styles.statPill}>
            <ArrowDownloadRegular fontSize={13} />
            {formatCount(component.download_count || 0)}
          </div>
          {(component.rating_count || 0) > 0 && (
            <div className={styles.statPill}>
              <StarFilled fontSize={13} style={{ color: '#ffb900' }} />
              {(component.average_rating || 0).toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <div className={styles.body}>
        <Text className={styles.title}>{component.title}</Text>
        <Text className={styles.description}>{component.description}</Text>
      </div>

      <div className={styles.footer}>
        <div className={styles.author}>
          <div className={styles.authorIcon}>{initials}</div>
          {component.author_name}
        </div>
        <div className={styles.date}>
          <CalendarRegular fontSize={12} />
          {formattedDate}
        </div>
      </div>
    </div>
  );
}
