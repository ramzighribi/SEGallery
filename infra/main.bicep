// ================================================================
// SEGallery — Main Bicep orchestrator
// Provisions: Static Web App + Azure SQL + Blob Storage
// ================================================================

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Azure region for SQL (if restricted in primary region)')
param sqlLocation string = 'francecentral'

@description('Unique project suffix (lowercase, no dashes)')
@minLength(3)
@maxLength(12)
param projectSuffix string

@description('SQL Azure AD admin login (UPN)')
param sqlAadAdminLogin string = 'admin@D365DemoTSCE97303239.onmicrosoft.com'

@description('SQL Azure AD admin Object ID')
param sqlAadAdminObjectId string = '9a71df8e-6d43-43f5-b73d-ad50cf4a6980'

@description('Azure AD Tenant ID')
param aadTenantId string = '8ee8670c-e771-4ac2-918d-e76e476c5ef8'

param tags object = {
  project: 'SEGallery'
  environment: 'production'
}

// ─── Names ──────────────────────────────────────────────────────
var staticWebAppName = 'swa-segallery-${projectSuffix}'
var storageAccountName = 'stsg${projectSuffix}'
var sqlServerName = 'sql-segallery-${projectSuffix}'
var sqlDatabaseName = 'SEGalleryDB'

// ─── Static Web App ─────────────────────────────────────────────
module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'deploy-swa'
  params: {
    location: location
    staticWebAppName: staticWebAppName
    tags: tags
  }
}

// ─── Storage Account ────────────────────────────────────────────
module storage 'modules/storage.bicep' = {
  name: 'deploy-storage'
  params: {
    location: location
    storageAccountName: storageAccountName
    tags: tags
  }
}

// ─── Azure SQL ──────────────────────────────────────────────────
module sql 'modules/sql.bicep' = {
  name: 'deploy-sql'
  params: {
    location: sqlLocation
    sqlServerName: sqlServerName
    sqlDatabaseName: sqlDatabaseName
    aadAdminLogin: sqlAadAdminLogin
    aadAdminObjectId: sqlAadAdminObjectId
    aadAdminTenantId: aadTenantId
    tags: tags
  }
}

// ─── Outputs ────────────────────────────────────────────────────
output staticWebAppDefaultHostname string = staticWebApp.outputs.defaultHostname
output staticWebAppDeploymentToken string = staticWebApp.outputs.deploymentToken
output storageAccountName string = storage.outputs.storageAccountName
output blobEndpoint string = storage.outputs.blobEndpoint
output sqlServerFqdn string = sql.outputs.sqlServerFqdn
output sqlDatabaseName string = sql.outputs.sqlDatabaseName
output sqlConnectionString string = sql.outputs.connectionString
