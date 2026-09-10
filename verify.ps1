$ErrorActionPreference = 'Stop'

function Invoke-Gate {
  param([string]$Name, [string]$Directory, [string]$Command)
  Write-Host "`n=== $Name ==="
  Push-Location $Directory
  try {
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" }
  } finally {
    Pop-Location
  }
}

$root = $PSScriptRoot
Invoke-Gate 'Frontend format' "$root/frontend" 'npm run format:check'
Invoke-Gate 'Frontend typecheck' "$root/frontend" 'npm run typecheck'
Invoke-Gate 'Frontend build' "$root/frontend" 'npm run build -- --configuration production'
Invoke-Gate 'Frontend unit tests' "$root/frontend" 'npm test -- --watch=false'
Invoke-Gate 'Frontend browser E2E' "$root/frontend" 'npm run test:e2e'

Write-Host "`nAll repository verification gates passed."
