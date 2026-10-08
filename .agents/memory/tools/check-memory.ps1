<#
.SYNOPSIS
  EventPulse agent-memory change detector.
  Compares tracked source files against .agents/memory/manifest.json using
  SHA-256 content hashes. Unchanged files are NEVER re-analyzed by agents;
  only NEW / MODIFIED files need analysis. Keeps token usage minimal by
  printing only the diff, never file contents.

.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File .agents/memory/tools/check-memory.ps1
  powershell ... check-memory.ps1 -Sync      # also add NEW entries (pending) + prune DELETED
  powershell ... check-memory.ps1 -Json      # machine-readable output

.EXIT CODES
  0 = everything unchanged (no analysis needed)
  1 = NEW / MODIFIED / DELETED files found (analysis needed)
  2 = error (e.g. manifest missing and -Init not used, invalid JSON)
#>
[CmdletBinding()]
param(
  [switch]$Sync,   # persist NEW (pending) entries and prune DELETED entries in manifest.json
  [switch]$Json    # emit machine-readable JSON instead of human summary
)

$ErrorActionPreference = 'Stop'

$RepoRoot    = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$MemoryDir   = Join-Path $RepoRoot '.agents\memory'
$Manifest    = Join-Path $MemoryDir 'manifest.json'

# Tracked source globs (relative to repo root). Build output, dependency and VCS
# dirs (node_modules, .next, target, dist, build, .git) are always excluded.
$Tracked = @(
  'backend\src\main\java\*.java',
  'backend\src\main\resources\application*.yml',
  'backend\src\main\resources\application*.properties',
  'backend\pom.xml',
  'frontend\app\*.ts', 'frontend\app\*.tsx', 'frontend\app\*.css',
  'frontend\components\*.ts', 'frontend\components\*.tsx',
  'frontend\services\*.ts', 'frontend\services\*.tsx',
  'frontend\hooks\*.ts', 'frontend\hooks\*.tsx',
  'frontend\lib\*.ts', 'frontend\lib\*.tsx',
  'frontend\package.json'
)

function Get-RelativePath([string]$Full) {
  $rel = $Full.Substring($RepoRoot.Length).TrimStart('\', '/')
  return ($rel -replace '\\', '/')
}

function Get-FileHash256([string]$Full) {
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $stream = [System.IO.File]::OpenRead($Full)
    try {
      $bytes = $sha.ComputeHash($stream)
      return (($bytes | ForEach-Object { $_.ToString('x2') }) -join '')
    } finally { $stream.Close() }
  } finally { $sha.Dispose() }
}

# ---- Load manifest ----
if (-not (Test-Path -LiteralPath $Manifest)) {
  if ($Json) { Write-Output '{"error":"manifest.json not found. Run a full analysis first."}' }
  else { Write-Output 'ERROR: .agents/memory/manifest.json not found. Run a full analysis first.' }
  exit 2
}
try {
  $manifestObj = Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json
} catch {
  if ($Json) { Write-Output '{"error":"manifest.json is invalid JSON."}' }
  else { Write-Output 'ERROR: manifest.json is invalid JSON.' }
  exit 2
}
$entries = @{}
foreach ($e in $manifestObj.files) { $entries[$e.path] = $e }

# ---- Scan tracked files ----
$disk = @{}
foreach ($pattern in $Tracked) {
  $pattern = $pattern.Trim()
  if ([string]::IsNullOrWhiteSpace($pattern)) { continue }
  $dirPart  = Split-Path $pattern -Parent
  $filePart = Split-Path $pattern -Leaf
  $base = Join-Path $RepoRoot $dirPart
  if (-not (Test-Path -LiteralPath $base)) { continue }
  Get-ChildItem -LiteralPath $base -Filter $filePart -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '[\\/](node_modules|\.next|\.git|target|dist|build)[\\/]' } |
    ForEach-Object {
      $rel = Get-RelativePath $_.FullName
      $disk[$rel] = $_.FullName
    }
}

$unchanged = 0
$new = @(); $modified = @(); $deleted = @()

foreach ($rel in $disk.Keys) {
  $hash = Get-FileHash256 $disk[$rel]
  if (-not $entries.ContainsKey($rel)) {
    $new += $rel
    if ($Sync) {
      $size = (Get-Item -LiteralPath $disk[$rel]).Length
      $entries[$rel] = [pscustomobject]@{
        path        = $rel
        status      = 'pending'
        currentHash = $hash
        size        = $size
        summary     = ''
        symbols     = @()
        tags        = @()
      }
    }
  } else {
    $e = $entries[$rel]
    $e.currentHash = $hash
    if ($e.status -eq 'analyzed' -and $e.analyzedHash -eq $hash) { $unchanged++ }
    else {
      $modified += $rel
      if ($e.status -eq 'analyzed') { $e.status = 'pending' }  # keep analyzedHash for reference
    }
  }
}

foreach ($rel in @($entries.Keys)) {
  if (-not $disk.ContainsKey($rel)) {
    $deleted += $rel
    if ($Sync) { $entries.Remove($rel) }
  }
}

if ($Sync) {
  $manifestObj.files = @($entries.Values | Sort-Object path)
  $manifestObj.lastChecked = (Get-Date).ToString('yyyy-MM-dd')
  $manifestObj | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $Manifest -Encoding UTF8
}

$needsWork = ($new.Count + $modified.Count + $deleted.Count) -gt 0

if ($Json) {
  $out = [ordered]@{
    unchanged = $unchanged
    new       = @($new | Sort-Object)
    modified  = @($modified | Sort-Object)
    deleted   = @($deleted | Sort-Object)
  }
  Write-Output ($out | ConvertTo-Json -Depth 4)
} else {
  Write-Output '--- agent-memory check ---'
  Write-Output ("UNCHANGED (skip, do NOT re-analyze): {0}" -f $unchanged)
  Write-Output ("NEW (analyze once):                  {0}" -f $new.Count)
  foreach ($p in ($new | Sort-Object)) { Write-Output ("  + {0}" -f $p) }
  Write-Output ("MODIFIED (re-analyze + update):      {0}" -f $modified.Count)
  foreach ($p in ($modified | Sort-Object)) { Write-Output ("  ~ {0}" -f $p) }
  Write-Output ("DELETED (prune from memory):        {0}" -f $deleted.Count)
  foreach ($p in ($deleted | Sort-Object)) { Write-Output ("  - {0}" -f $p) }
  if (-not $needsWork) { Write-Output 'OK: memory is current. No file analysis needed.' }
  elseif (-not $Sync) { Write-Output 'TIP: re-run with -Sync to register NEW / prune DELETED in manifest.json.' }
}

if ($needsWork) { exit 1 } else { exit 0 }
