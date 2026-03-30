# SEGallery

**Galerie de composants SE** — Interface web pour uploader, partager et découvrir les composants développés par les équipes SE. Architecture 100% Azure serverless.

---

## Architecture Azure

```
                    ┌─────────────────────────┐
                    │    Azure Entra ID (SSO)  │
                    │    Comptes employés       │
                    └────────────┬──────────────┘
                                 │
                    ┌────────────▼──────────────┐
                    │  Azure Static Web Apps     │
                    │  React + Fluent UI v9       │
                    │  Auth SSO intégrée native   │
                    └────────────┬──────────────┘
                                 │ /api/*
                    ┌────────────▼──────────────┐
                    │    Azure Functions          │
                    │    (Node.js TypeScript)      │
                    │    Intégré à SWA             │
                    └───────┬────────────┬──────┘
                            │            │
               ┌────────────▼──┐  ┌──────▼──────────┐
               │  Azure SQL DB  │  │ Azure Blob       │
               │  Métadonnées   │  │ Storage           │
               │  composants    │  │ .zip .html images │
               └────────────────┘  └──────────────────┘
```

## Stack 100% Microsoft

| Composant | Service Azure |
|---|---|
| **Frontend** | Azure Static Web Apps (React 18 + Fluent UI v9) |
| **API** | Azure Functions v4 (TypeScript, intégré SWA) |
| **Auth SSO** | Azure Entra ID (natif SWA, zéro config MSAL) |
| **Base de données** | Azure SQL Database (tier Basic) |
| **Stockage fichiers** | Azure Blob Storage (containers files + screenshots) |
| **CI/CD** | GitHub Actions |
| **IaC** | Bicep (provisioning automatique) |

## Structure du projet

```
SEGallery/
├── infra/                        # Infrastructure as Code (Bicep)
│   ├── main.bicep                # Orchestrateur principal
│   └── modules/
│       ├── staticwebapp.bicep    # Azure Static Web App
│       ├── sql.bicep             # Azure SQL Database
│       └── storage.bicep         # Azure Blob Storage
│
├── api/                          # Azure Functions (backend)
│   ├── src/
│   │   ├── functions/
│   │   │   ├── getComponents.ts  # GET /api/components (liste + recherche)
│   │   │   ├── getComponentById.ts  # GET /api/components/:id
│   │   │   ├── createComponent.ts   # POST /api/components
│   │   │   └── deleteComponent.ts   # DELETE /api/components/:id
│   │   ├── database.ts           # Azure SQL connection pool
│   │   ├── storage.ts            # Azure Blob upload/delete/SAS
│   │   └── auth.ts               # SWA auth (x-ms-client-principal)
│   ├── host.json
│   └── package.json
│
├── client/                       # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx        # Header nav + login/logout SSO
│   │   │   └── ComponentCard.tsx # Tuile composant avec vignette
│   │   ├── pages/
│   │   │   ├── GalleryPage.tsx   # Galerie : tuiles + recherche + pagination
│   │   │   ├── UploadPage.tsx    # Formulaire publication
│   │   │   └── DetailPage.tsx    # Détail + galerie screenshots + contact
│   │   └── services/
│   │       ├── api.ts            # Client API REST
│   │       └── auth.ts           # SWA auth (/.auth/me)
│   ├── staticwebapp.config.json  # Config SWA (routes, auth)
│   └── package.json
│
├── .github/workflows/deploy.yml  # GitHub Actions CI/CD
├── deploy.ps1                    # Script déploiement one-click
├── .gitignore
└── README.md
```

## Déploiement One-Click

### Prérequis
- **Azure CLI** : `winget install Microsoft.AzureCLI`
- **Node.js 20+** : `winget install OpenJS.NodeJS.LTS`
- Un **abonnement Azure** actif

### Commande de déploiement

```powershell
.\deploy.ps1 -Suffix "monequipe" -GitHubRepo "https://github.com/user/SEGallery"
```

Le script automatise :
1. Connexion à Azure (ouverture navigateur si nécessaire)
2. Création du Resource Group
3. Déploiement Bicep (Static Web App + SQL + Storage)
4. Configuration des connection strings
5. Initialisation de la base de données SQL
6. Génération du token de déploiement SWA pour GitHub

### Après le déploiement

1. **GitHub Secret** : Ajouter `SWA_DEPLOYMENT_TOKEN` dans Settings > Secrets > Actions
2. **Azure AD** : Configurer l'authentification Entra ID dans le portail Azure (Static Web App > Settings > Authentication)
3. **Push & Deploy** : `git push origin main` déclenche le déploiement automatique

## Fonctionnalités

### Galerie (page d'accueil)
- Tuiles avec vignettes des screenshots
- Recherche par titre, description ou auteur
- Pagination automatique

### Publication (formulaire)
- Titre + description
- Upload fichier source (.zip, .html)
- Screenshots multiples (jusqu'à 10, preview galerie)
- Auteur automatique via SSO

### Détail d'un composant
- Galerie screenshots avec lightbox
- Téléchargement fichier source (SAS URL)
- Contact auteur par email
- Suppression par l'auteur uniquement

### Authentification
- SSO Microsoft natif (Azure Entra ID via SWA)
- Zéro code MSAL côté client
- Routes protégées (POST/DELETE nécessitent auth)
- Consultation en lecture libre (GET public)

## API Endpoints

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/components` | Lister + recherche + pagination | Public |
| `GET` | `/api/components/:id` | Détail composant | Public |
| `POST` | `/api/components` | Créer composant (multipart) | SSO |
| `DELETE` | `/api/components/:id` | Supprimer (auteur seul) | SSO |
