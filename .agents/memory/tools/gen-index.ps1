<#
.SYNOPSIS
  Rebuilds .agents/memory/index.json from manifest.json (tags + symbols)
  plus the headings of the memory markdown files.
  Run after any manifest or memory-doc update. PowerShell 5.1 compatible.
.USAGE
  powershell -NoProfile -ExecutionPolicy Bypass -File .agents/memory/tools/gen-index.ps1
#>
$ErrorActionPreference = 'Stop'
$MemoryDir = Split-Path -Parent $PSScriptRoot
$Manifest  = Join-Path $MemoryDir 'manifest.json'
$Index     = Join-Path $MemoryDir 'index.json'

$m = Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json

$tags = @{}; $symbols = @{}
foreach ($f in $m.files) {
  foreach ($t in @($f.tags)) {
    $k = $t.ToLower()
    if (-not $tags.ContainsKey($k)) { $tags[$k] = @() }
    if ($tags[$k] -notcontains $f.path) { $tags[$k] += $f.path }
  }
  foreach ($s in @($f.symbols)) {
    if ([string]::IsNullOrWhiteSpace($s)) { continue }
    if (-not $symbols.ContainsKey($s)) { $symbols[$s] = @() }
    if ($symbols[$s] -notcontains $f.path) { $symbols[$s] += $f.path }
  }
}

$docs = @{}
foreach ($md in Get-ChildItem -LiteralPath $MemoryDir -Filter '*.md' -File) {
  $heads = Get-Content -LiteralPath $md.FullName |
    Where-Object { $_ -match '^#{1,3}\s+(.+)' } |
    ForEach-Object { $Matches[1].Trim() }
  $docs[$md.Name] = @($heads)
}

$indexObj = [pscustomobject][ordered]@{
  generatedAt  = (Get-Date).ToString('yyyy-MM-dd')
  trackedFiles = $m.files.Count
  tags         = $tags
  symbols      = $symbols
  docs         = $docs
}
# NOTE: do NOT name this $index — PowerShell variables are case-insensitive,
# so $index would clobber the $Index output path above.
$indexJson = $indexObj | ConvertTo-Json -Depth 5
Set-Content -LiteralPath $Index -Encoding UTF8 -Value $indexJson
Write-Output ("index.json rebuilt: {0} tags, {1} symbols, {2} docs" -f $tags.Count, $symbols.Count, $docs.Count)
