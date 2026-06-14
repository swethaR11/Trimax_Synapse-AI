param(
    [switch]$Reload,
    [switch]$Restart,
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $Python)) {
    Write-Host "Creating Python environment..."
    python -m venv (Join-Path $Root ".venv")
    & $Python -m pip install -r (Join-Path $Root "backend\requirements.txt")
}

function Get-PortOwner {
    param([int]$LocalPort)

    return Get-NetTCPConnection `
        -LocalAddress "127.0.0.1" `
        -LocalPort $LocalPort `
        -State Listen `
        -ErrorAction SilentlyContinue |
        Select-Object -First 1
}

$Listener = Get-PortOwner -LocalPort $Port
if ($Listener) {
    $OwnerProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($Listener.OwningProcess)"
    $IsSynapse = $OwnerProcess.CommandLine -match "uvicorn\s+backend\.main:app"

    if ($IsSynapse -and $Restart) {
        Write-Host "Restarting Synapse backend on http://127.0.0.1:$Port ..."
        Stop-Process -Id $Listener.OwningProcess -Force
        Start-Sleep -Milliseconds 500
    }
    elseif ($IsSynapse) {
        Write-Host "Synapse backend is already running on http://127.0.0.1:$Port"
        Write-Host "API docs: http://127.0.0.1:$Port/docs"
        Write-Host "Use .\start-backend.ps1 -Restart to restart it."
        exit 0
    }
    else {
        throw "Port $Port is already used by $($OwnerProcess.Name) (PID $($Listener.OwningProcess)). Use -Port with another port or stop that process."
    }
}

Set-Location $Root
$UvicornArgs = @(
    "-m", "uvicorn",
    "backend.main:app",
    "--host", "127.0.0.1",
    "--port", "$Port"
)

if ($Reload) {
    $UvicornArgs += @(
        "--reload",
        "--reload-dir", (Join-Path $Root "backend")
    )
}

& $Python @UvicornArgs
