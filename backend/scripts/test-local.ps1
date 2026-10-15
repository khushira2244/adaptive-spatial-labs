param([string]$PostgresBin = 'C:\Program Files\PostgreSQL\16\bin', [ValidateSet('test','dev','smoke')][string]$Mode = 'test')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$clusterPath = Join-Path $projectRoot 'work\postgres\data'
$logPath = Join-Path $projectRoot 'work\postgres\server.log'
if (-not (Test-Path -LiteralPath (Join-Path $clusterPath 'PG_VERSION'))) {
  & (Join-Path $PostgresBin 'initdb.exe') -D $clusterPath -U asl_local -A trust --encoding=UTF8 --no-locale
  if ($LASTEXITCODE -ne 0) { throw 'Local cluster initialization failed' }
}
& (Join-Path $PostgresBin 'pg_ctl.exe') -D $clusterPath -l $logPath -o '-p 55432 -h 127.0.0.1' -w start
if ($LASTEXITCODE -ne 0) { throw 'Could not start isolated local PostgreSQL cluster' }
try {
  foreach ($databaseName in @('adaptive_spatial_labs','adaptive_spatial_labs_test')) {
    $exists = & (Join-Path $PostgresBin 'psql.exe') -h 127.0.0.1 -p 55432 -U asl_local -d postgres -At -c "SELECT 1 FROM pg_database WHERE datname = '$databaseName'"
    if ($LASTEXITCODE -ne 0) { throw 'Database connectivity failed' }
    if ($exists -ne '1') {
      & (Join-Path $PostgresBin 'createdb.exe') -h 127.0.0.1 -p 55432 -U asl_local $databaseName
      if ($LASTEXITCODE -ne 0) { throw 'Database creation failed' }
    }
  }
  Push-Location (Split-Path -Parent $PSScriptRoot)
  try {
    if (-not (Test-Path -LiteralPath '.env')) { & npx.cmd tsx scripts/local-config.ts; if ($LASTEXITCODE -ne 0) { throw 'Local configuration failed' } }
    & npm.cmd run db:migrate; if ($LASTEXITCODE -ne 0) { throw 'Migration failed' }
    if ($Mode -eq 'dev') {
      & npm.cmd run dev; if ($LASTEXITCODE -ne 0) { throw 'Development backend failed' }
    } else {
      if ($Mode -eq 'test') {
        & npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { throw 'Type check failed' }
        & npm.cmd test; if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
      }
      & npm.cmd run build; if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
      & npx.cmd tsx scripts/smoke.ts; if ($LASTEXITCODE -ne 0) { throw 'Compiled-server smoke check failed' }
    }
  } finally { Pop-Location }
} finally {
  & (Join-Path $PostgresBin 'pg_ctl.exe') -D $clusterPath -m fast -w stop
}
