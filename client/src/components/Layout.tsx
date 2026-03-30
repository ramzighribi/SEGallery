import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Button,
  Text,
  Avatar,
  Tooltip,
  Divider,
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
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '56px',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    boxShadow: tokens.shadow4,
    position: 'sticky' as const,
    top: 0,
    zIndex: 1000,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    cursor: 'pointer',
  },
  logo: {
    fontWeight: tokens.fontWeightBold,
    fontSize: tokens.fontSizeBase500,
  },
  nav: {
    display: 'flex',
    gap: '8px',
  },
  navButton: {
    color: tokens.colorNeutralForegroundOnBrand,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  content: {
    flex: 1,
    padding: '24px',
    maxWidth: '1400px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box' as const,
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
          <Text className={styles.logo} style={{ color: 'white' }}>
            📦 SEGallery
          </Text>
        </div>

        <nav className={styles.nav}>
          <Button
            appearance="subtle"
            icon={<GridRegular />}
            className={styles.navButton}
            onClick={() => navigate('/')}
            style={location.pathname === '/' ? { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' } : { color: 'white' }}
          >
            Galerie
          </Button>
          <Button
            appearance="subtle"
            icon={<ArrowUploadRegular />}
            className={styles.navButton}
            onClick={() => navigate('/upload')}
            style={location.pathname === '/upload' ? { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' } : { color: 'white' }}
          >
            Publier
          </Button>
        </nav>

        <div className={styles.headerRight}>
          {user ? (
            <>
              <Tooltip content={getUserDisplayName(user)} relationship="label">
                <Avatar name={getUserDisplayName(user)} size={32} color="brand" />
              </Tooltip>
              <Text style={{ color: 'white', fontSize: '13px' }}>
                {getUserDisplayName(user)}
              </Text>
              <Tooltip content="Se déconnecter" relationship="label">
                <a href={logoutUrl()} style={{ display: 'flex' }}>
                  <Button
                    appearance="subtle"
                    icon={<SignOutRegular />}
                    style={{ color: 'white' }}
                    size="small"
                  />
                </a>
              </Tooltip>
            </>
          ) : (
            <a href={loginUrl()} style={{ textDecoration: 'none' }}>
              <Button
                appearance="subtle"
                icon={<PersonRegular />}
                style={{ color: 'white' }}
              >
                Se connecter
              </Button>
            </a>
          )}
        </div>
      </header>

      <Divider />

      <main className={styles.content}>{children}</main>
    </div>
  );
}
