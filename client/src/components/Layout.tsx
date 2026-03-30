import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
  Avatar,
  Tooltip,
  shorthands,
} from '@fluentui/react-components';
import {
  GridRegular,
  ArrowUploadRegular,
  PersonRegular,
  SignOutRegular,
} from '@fluentui/react-icons';
import { getAuthInfo, getUserDisplayName, loginUrl, logoutUrl, SwaUser } from '../services/auth';

const useStyles = makeStyles({
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('0', '32px'),
    height: '64px',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.04)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 1000,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('10px'),
    background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: tokens.fontWeightBold,
    flexShrink: 0,
  },
  logoText: {
    fontWeight: '700',
    fontSize: '18px',
    letterSpacing: '-0.02em',
    background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  nav: {
    display: 'flex',
    gap: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    ...shorthands.borderRadius('12px'),
    ...shorthands.padding('4px'),
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    ...shorthands.padding('8px', '16px'),
    ...shorthands.borderRadius('10px'),
    fontSize: '14px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    ...shorthands.border('0'),
    backgroundColor: 'transparent',
    ':hover': {
      color: tokens.colorNeutralForeground1,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    ...shorthands.padding('8px', '16px'),
    ...shorthands.borderRadius('10px'),
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    cursor: 'pointer',
    ...shorthands.border('0'),
    background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
    boxShadow: '0 2px 8px rgba(0, 120, 212, 0.3)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    ...shorthands.padding('6px', '12px', '6px', '6px'),
    ...shorthands.borderRadius('50px'),
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    transitionDuration: '0.2s',
    transitionProperty: 'background-color',
    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.06)',
    },
  },
  userName: {
    fontSize: '13px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground2,
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    ...shorthands.border('0'),
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    ':hover': {
      backgroundColor: 'rgba(209, 52, 56, 0.1)',
      color: '#d13438',
    },
  },
  loginBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    ...shorthands.padding('8px', '20px'),
    ...shorthands.borderRadius('50px'),
    ...shorthands.border('0'),
    background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'all',
    textDecoration: 'none',
    boxShadow: '0 2px 8px rgba(0, 120, 212, 0.3)',
    ':hover': {
      boxShadow: '0 4px 16px rgba(0, 120, 212, 0.4)',
      transform: 'translateY(-1px)',
    },
  },
  content: {
    flex: 1,
    ...shorthands.padding('32px'),
    maxWidth: '1400px',
    width: '100%',
    ...shorthands.margin('0', 'auto'),
  },
});

export default function Layout({ children }: { children: ReactNode }) {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<SwaUser | null>(null);

  useEffect(() => {
    getAuthInfo().then((info) => setUser(info.clientPrincipal));
  }, []);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerLeft} onClick={() => navigate('/')}>
          <div className={styles.logoIcon}>SE</div>
          <span className={styles.logoText}>Gallery</span>
        </div>

        <nav className={styles.nav}>
          <button
            className={location.pathname === '/' ? styles.navItemActive : styles.navItem}
            onClick={() => navigate('/')}
          >
            <GridRegular fontSize={16} />
            Galerie
          </button>
          <button
            className={location.pathname === '/upload' ? styles.navItemActive : styles.navItem}
            onClick={() => navigate('/upload')}
          >
            <ArrowUploadRegular fontSize={16} />
            Publier
          </button>
        </nav>

        <div className={styles.headerRight}>
          {user ? (
            <div className={styles.userPill}>
              <Avatar name={getUserDisplayName(user)} size={28} color="colorful" />
              <Text className={styles.userName}>{getUserDisplayName(user)}</Text>
              <Tooltip content="Se déconnecter" relationship="label">
                <a href={logoutUrl()} style={{ display: 'flex' }}>
                  <button className={styles.logoutBtn}>
                    <SignOutRegular fontSize={16} />
                  </button>
                </a>
              </Tooltip>
            </div>
          ) : (
            <a href={loginUrl()} className={styles.loginBtn}>
              <PersonRegular fontSize={16} />
              Se connecter
            </a>
          )}
        </div>
      </header>

      <main className={styles.content}>{children}</main>
    </div>
  );
}
