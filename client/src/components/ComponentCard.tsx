import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  shorthands,
} from '@fluentui/react-components';
import {
  DataTrendingRegular,
  ArrowTrendingRegular,
  PersonRegular,
  CalendarRegular,
  HeartRegular,
  StarFilled,
  OpenRegular,
} from '@fluentui/react-icons';
import type { ComponentSummary } from '../services/api';
import { formatAuthorName } from '../services/api';
import { stripHtml } from './RichTextEditor';

const useStyles = makeStyles({
  card: {
    cursor: 'pointer',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    ...shorthands.borderRadius('20px'),
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.6)'),
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
    ...shorthands.overflow('hidden'),
    transitionDuration: '0.4s',
    transitionProperty: 'transform, box-shadow, border-color',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    ':hover': {
      transform: 'translateY(-6px) scale(1.01)',
      boxShadow: '0 20px 60px rgba(99, 102, 241, 0.15), 0 8px 24px rgba(0, 0, 0, 0.06)',
      borderTopColor: 'rgba(99, 102, 241, 0.35)',
      borderRightColor: 'rgba(99, 102, 241, 0.35)',
      borderBottomColor: 'rgba(99, 102, 241, 0.35)',
      borderLeftColor: 'rgba(99, 102, 241, 0.35)',
    },
  },
  imageWrapper: {
    position: 'relative' as const,
    height: '220px',
    ...shorthands.overflow('hidden'),
    backgroundColor: '#f0f2f8',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    transitionDuration: '0.5s',
    transitionProperty: 'transform',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  imageHoverZoom: {
    transform: 'scale(1.08)',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #e8edf5 0%, #dfe3f0 50%, #d4daf0 100%)',
  },
  placeholderContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  placeholderText: {
    fontSize: '48px',
    opacity: 0.5,
  },
  placeholderLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.3)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
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
    ...shorthands.padding('5px', '10px'),
    ...shorthands.borderRadius('50px'),
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
  },
  ratingPill: {
    backgroundColor: 'rgba(255, 185, 0, 0.9)',
    color: 'white',
  },
  descriptionOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    ...shorthands.padding('20px', '20px', '16px'),
    background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 60%, transparent 100%)',
    color: 'white',
    transitionDuration: '0.35s',
    transitionProperty: 'opacity, transform',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  overlayHidden: {
    opacity: 0,
    transform: 'translateY(8px)',
    pointerEvents: 'none' as const,
  },
  overlayVisible: {
    opacity: 1,
    transform: 'translateY(0)',
  },
  overlayTitle: {
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    opacity: 0.9,
  },
  overlayDesc: {
    fontSize: '13px',
    lineHeight: '1.6',
    opacity: 0.85,
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical' as const,
    ...shorthands.overflow('hidden'),
  },
  body: {
    ...shorthands.padding('18px', '20px', '14px'),
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  title: {
    fontWeight: '650',
    fontSize: '16px',
    color: tokens.colorNeutralForeground1,
    letterSpacing: '-0.01em',
    lineHeight: '1.35',
  },
  descriptionText: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    ...shorthands.overflow('hidden'),
    fontSize: '13px',
    lineHeight: '1.55',
    color: tokens.colorNeutralForeground3,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('0', '20px', '18px'),
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground2,
  },
  authorIcon: {
    width: '26px',
    height: '26px',
    ...shorthands.borderRadius('50%'),
    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '11px',
    fontWeight: '700',
    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
  },
  date: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
    fontWeight: '500',
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
  const [hovered, setHovered] = useState(false);

  const formattedDate = new Date(component.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const displayName = formatAuthorName(component.author_name);
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/component/${component.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.imageWrapper}>
        {component.thumbnail ? (
          <img
            src={component.thumbnail}
            alt={component.title}
            className={`${styles.thumbnail} ${hovered ? styles.imageHoverZoom : ''}`}
          />
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.placeholderContent}>
              <span className={styles.placeholderText}>&#x1F4E6;</span>
              <span className={styles.placeholderLabel}>Composant</span>
            </div>
          </div>
        )}
        <div className={styles.statsOverlay}>
          <div className={styles.statPill}>
            <DataTrendingRegular fontSize={13} />
            {formatCount(component.view_count || 0)}
          </div>
          <div className={styles.statPill}>
            <ArrowTrendingRegular fontSize={13} />
            {formatCount(component.download_count || 0)}
          </div>
          {(component.rating_count || 0) > 0 && (
            <div className={`${styles.statPill} ${styles.ratingPill}`}>
              <HeartRegular fontSize={13} />
              {(component.average_rating || 0).toFixed(1)}
            </div>
          )}
        </div>
        {/* Description hover overlay */}
        <div className={`${styles.descriptionOverlay} ${hovered ? styles.overlayVisible : styles.overlayHidden}`}>
          <div className={styles.overlayTitle}>
            <OpenRegular fontSize={14} />
            Aperçu
          </div>
          <div className={styles.overlayDesc}>
            {stripHtml(component.description) || 'Aucune description disponible.'}
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <Text className={styles.title}>{component.title}</Text>
        <Text className={styles.descriptionText}>{stripHtml(component.description)}</Text>
      </div>

      <div className={styles.footer}>
        <div className={styles.author}>
          <div className={styles.authorIcon}>{initials}</div>
          {displayName}
        </div>
        <div className={styles.date}>
          <CalendarRegular fontSize={12} />
          {formattedDate}
        </div>
      </div>
    </div>
  );
}
