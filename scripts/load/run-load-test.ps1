param(
  [string]$BaseUrl = "http://localhost:3001",
  [string]$OutDir = "reports/load",
  [switch]$StartServer,
  [switch]$IncludeWrites
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force $OutDir | Out-Null
$OutDir = (Resolve-Path $OutDir).Path
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$summaryPath = Join-Path $OutDir "k6-summary-$timestamp.json"
$rawPath = Join-Path $OutDir "k6-raw-$timestamp.json"
$processPath = Join-Path $OutDir "process-metrics-$timestamp.csv"
$k6LogPath = Join-Path $OutDir "k6-output-$timestamp.log"
$k6ErrorPath = Join-Path $OutDir "k6-error-$timestamp.log"
$serverProcess = $null
$startedServer = $false

try {
  if ($StartServer) {
    $existingPid = Get-PortOwnerPid -Port 3001
    if ($existingPid) {
      Write-Host "Using existing API process on port 3001: PID $existingPid"
      $serverProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    } else {
      npm run build
      $serverProcess = Start-Process -FilePath "node" -ArgumentList "dist/main" -PassThru -WindowStyle Hidden
      $startedServer = $true
      Start-Sleep -Seconds 5
    }
  }

  "timestamp,pid,cpu_seconds,working_set_mb,private_memory_mb" | Set-Content $processPath
  $targetPid = if ($serverProcess) { $serverProcess.Id } else { $null }

  $env:BASE_URL = $BaseUrl
  $env:INCLUDE_WRITES = if ($IncludeWrites) { "true" } else { "false" }
  $k6Args = @(
    "run",
    "--summary-export", $summaryPath,
    "--out", "json=$rawPath",
    "scripts/load/rating-api.k6.js"
  )
  $k6Process = Start-Process -FilePath "k6" -ArgumentList $k6Args -RedirectStandardOutput $k6LogPath -RedirectStandardError $k6ErrorPath -PassThru -WindowStyle Hidden

  while (-not $k6Process.HasExited) {
    $processes = if ($targetPid) {
      Get-Process -Id $targetPid -ErrorAction SilentlyContinue
    } else {
      Get-Process node -ErrorAction SilentlyContinue
    }

    foreach ($process in $processes) {
      "$((Get-Date).ToString("o")),$($process.Id),$([Math]::Round($process.CPU, 2)),$([Math]::Round($process.WorkingSet64 / 1MB, 2)),$([Math]::Round($process.PrivateMemorySize64 / 1MB, 2))" |
        Add-Content $processPath
    }

    Start-Sleep -Seconds 5
    $k6Process.Refresh()
  }

  $k6Process.WaitForExit()
  if ($null -ne $k6Process.ExitCode -and $k6Process.ExitCode -ne 0) {
    Get-Content $k6ErrorPath -ErrorAction SilentlyContinue
    throw "k6 exited with code $($k6Process.ExitCode)"
  }

  Get-Content $k6LogPath -ErrorAction SilentlyContinue
}
finally {
  if ($startedServer -and $serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force
  }

  Write-Host "k6 summary: $summaryPath"
  Write-Host "k6 raw metrics: $rawPath"
  Write-Host "process metrics: $processPath"
  Write-Host "k6 console log: $k6LogPath"
}

function Get-PortOwnerPid {
  param([int]$Port)

  $line = netstat -ano |
    Select-String "LISTENING\s+(\d+)$" |
    Where-Object { $_.Line -match "[:.]$Port\s+" } |
    Select-Object -First 1

  if ($line -and $line.Line -match "LISTENING\s+(\d+)$") {
    return [int]$Matches[1]
  }

  return $null
}
