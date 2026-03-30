<#
.SYNOPSIS
    SEGallery — Script de déploiement automatique sur Azure.
    Provisionne toutes les ressources Azure et configure le projet.

.DESCRIPTION
    Ce script :
    1. Vérifie les prérequis (Azure CLI, Node.js)
    2. Connecte à Azure
    3. Crée le Resource Group
    4. Déploie les ressources via Bicep (Static Web App, Azure SQL, Blob Storage)
    5. Configure les connection strings dans l'application
    6. Initialise la base de données SQL
    7. Configure GitHub pour le déploiement continu

.PARAMETER Suffix
    Suffixe unique pour nommer les ressources Azure (3-12 chars, lowercase).
    Exemple: "team42" donnera swa-segallery-team42, sql-segallery-team42, etc.

.PARAMETER Location
    Azure region. Default: westeurope

.PARAMETER SqlPassword
    Mot de passe admin SQL (sera demandé en interactif si non fourni)

.PARAMETER GitHubRepo
    URL du repo GitHub (ex: https://github.com/user/SEGallery)

.EXAMPLE
    .\deploy.ps1 -Suffix "team42" -GitHubRepo "https://github.com/monuser/SEGallery"
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9]{3,12}$')]
    [string]$Suffix,

    [string]$Location = "westeurope",

    [string]$SqlPassword,

    [string]$GitHubRepo
)

$ErrorActionPreference = "Stop"
$ResourceGroup = "rg-segallery-$Suffix"

# ── Colors ──
function Write-Step { param([string]$msg) Write-Host "`n━━━ $msg ━━━" -ForegroundColor Cyan }
function Write-Ok { param([string]$msg) Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn { param([string]$msg) Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Err { param([string]$msg) Write-Host "  ✗ $msg" -ForegroundColor Red }

# ── 1. Prérequis ──
Write-Step "1/7 — Vérification des prérequis"

# Azure CLI
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Err "Azure CLI non trouvé. Installez-le depuis https://aka.ms/installazurecliwindows"
    Write-Host "  Commande rapide: winget install Microsoft.AzureCLI" -ForegroundColor Yellow
    exit 1
}
Write-Ok "Azure CLI détecté"

# Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js non trouvé. Installez-le: winget install OpenJS.NodeJS.LTS"
    exit 1
}
Write-Ok "Node.js $(node --version) détecté"

# SQL Password
if (-not $SqlPassword) {
    $SecurePassword = Read-Host "Mot de passe admin Azure SQL (min 8 chars, nécessite majuscule+chiffre+spécial)" -AsSecureString
    $SqlPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    )
}

if ($SqlPassword.Length -lt 8) {
    Write-Err "Le mot de passe SQL doit faire au moins 8 caractères"
    exit 1
}

# ── 2. Connexion Azure ──
Write-Step "2/7 — Connexion à Azure"

$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Warn "Pas de session Azure active. Ouverture du navigateur..."
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Ok "Connecté à: $($account.name) (Subscription: $($account.id))"

# ── 3. Resource Group ──
Write-Step "3/7 — Création du Resource Group"

$rgExists = az group exists --name $ResourceGroup | ConvertFrom-Json
if (-not $rgExists) {
    az group create --name $ResourceGroup --location $Location --tags "project=SEGallery" | Out-Null
    Write-Ok "Resource Group '$ResourceGroup' créé dans '$Location'"
} else {
    Write-Ok "Resource Group '$ResourceGroup' existe déjà"
}

# ── 4. Déploiement Bicep ──
Write-Step "4/7 — Déploiement des ressources Azure (Bicep)"
Write-Host "  Cela crée: Static Web App + Azure SQL + Blob Storage..." -ForegroundColor Gray

$deployment = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file ./infra/main.bicep `
    --parameters projectSuffix=$Suffix sqlAdminPassword=$SqlPassword `
    --query "properties.outputs" `
    --output json | ConvertFrom-Json

if (-not $deployment) {
    Write-Err "Le déploiement Bicep a échoué. Vérifiez les erreurs ci-dessus."
    exit 1
}

$swaHostname = $deployment.staticWebAppDefaultHostname.value
$swaToken = $deployment.staticWebAppDeploymentToken.value
$storageAccount = $deployment.storageAccountName.value
$blobEndpoint = $deployment.blobEndpoint.value
$sqlFqdn = $deployment.sqlServerFqdn.value
$sqlDbName = $deployment.sqlDatabaseName.value
$sqlConnStr = $deployment.sqlConnectionString.value

Write-Ok "Static Web App:   https://$swaHostname"
Write-Ok "Blob Storage:     $blobEndpoint"
Write-Ok "SQL Server:       $sqlFqdn"
Write-Ok "SQL Database:     $sqlDbName"

# ── 5. Configuration des app settings ──
Write-Step "5/7 — Configuration des app settings"

# Get storage connection string
$storageConnStr = az storage account show-connection-string `
    --resource-group $ResourceGroup `
    --name $storageAccount `
    --query connectionString --output tsv

# Full SQL connection string with credentials
$fullSqlConnStr = "${sqlConnStr}User ID=segadmin;Password=${SqlPassword};"

# Set function app settings on the Static Web App
$swaName = "swa-segallery-$Suffix"
az staticwebapp appsettings set `
    --name $swaName `
    --resource-group $ResourceGroup `
    --setting-names `
        "SQL_CONNECTION_STRING=$fullSqlConnStr" `
        "AZURE_STORAGE_CONNECTION_STRING=$storageConnStr" `
        "AZURE_STORAGE_ACCOUNT_NAME=$storageAccount" | Out-Null

Write-Ok "App settings configurés (SQL + Storage)"

# ── 6. Initialisation de la base SQL ──
Write-Step "6/7 — Initialisation de la base de données SQL"

# Allow current IP through firewall temporarily
$myIp = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 10)
$sqlServerName = "sql-segallery-$Suffix"

az sql server firewall-rule create `
    --resource-group $ResourceGroup `
    --server $sqlServerName `
    --name "DeployScript" `
    --start-ip-address $myIp `
    --end-ip-address $myIp | Out-Null

Write-Ok "Règle firewall temporaire ajoutée pour $myIp"

# Run the DB init via the API code
Write-Host "  Exécution des migrations de base de données..." -ForegroundColor Gray
Push-Location ./api
$env:SQL_CONNECTION_STRING = $fullSqlConnStr
$env:AZURE_STORAGE_CONNECTION_STRING = $storageConnStr
npx ts-node -e "import { initDatabase } from './src/database'; initDatabase().then(() => { console.log('DB initialized'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); })"
Pop-Location

# Remove temporary firewall rule
az sql server firewall-rule delete `
    --resource-group $ResourceGroup `
    --server $sqlServerName `
    --name "DeployScript" --yes | Out-Null

Write-Ok "Base de données initialisée, règle firewall temporaire supprimée"

# ── 7. GitHub ──
Write-Step "7/7 — Configuration GitHub"

if ($GitHubRepo) {
    Write-Host "  Configurez ce secret dans GitHub > Settings > Secrets > Actions:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    Nom:    SWA_DEPLOYMENT_TOKEN" -ForegroundColor White
    Write-Host "    Valeur: $swaToken" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Warn "Aucun repo GitHub spécifié. Vous pourrez configurer le CI/CD plus tard."
    Write-Host "    Token de déploiement SWA: $swaToken" -ForegroundColor Gray
}

# ── Done ──
Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           SEGallery — Déploiement terminé !                 ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║  URL:  https://$swaHostname" -ForegroundColor Green -NoNewline
Write-Host "$(' ' * (39 - $swaHostname.Length))║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║  Prochaines étapes:                                          ║" -ForegroundColor Green
Write-Host "║  1. Configurez Azure AD auth dans le portail Azure           ║" -ForegroundColor Green
Write-Host "║  2. Ajoutez SWA_DEPLOYMENT_TOKEN dans GitHub Secrets         ║" -ForegroundColor Green
Write-Host "║  3. Poussez le code: git push origin main                    ║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
