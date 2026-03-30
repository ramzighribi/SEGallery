// ================================================================
// SEGallery — Main Bicep orchestrator
// Provisions: Static Web App + Azure SQL + Blob Storage
// ================================================================

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Unique project suffix (lowercase, no dashes)')
@minLength(3)
@maxLength(12)
param projectSuffix string

@description('SQL admin username')
param sqlAdminLogin string = 'segadmin'

@description('SQL admin password')
@secure()
param sqlAdminPassword string

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
    location: location
    sqlServerName: sqlServerName
    sqlDatabaseName: sqlDatabaseName
    sqlAdminLogin: sqlAdminLogin
    sqlAdminPassword: sqlAdminPassword
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
