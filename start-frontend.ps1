$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Frontend = Join-Path $Root "frontend"

Set-Location $Frontend
if (-not (Test-Path -LiteralPath (Join-Path $Frontend "node_modules"))) {
    npm install
}

npm run dev

