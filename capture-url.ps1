param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Url,

  [ValidateSet('png', 'pdf')]
  [string]$Format = 'png',

  [string]$Output,

  [int]$DelaySeconds = 2,

  [int]$TimeoutSeconds = 60,

  [int]$Width = 1440,

  [int]$Height = 2200,

  [switch]$NoAutoScroll
)

$scriptPath = Join-Path $PSScriptRoot 'capture-page.mjs'
$playwrightCorePath = Join-Path $PSScriptRoot 'node_modules\playwright-core'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error 'node is required. Install Node.js first: https://nodejs.org/'
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error 'npm is required. Install Node.js first: https://nodejs.org/'
  exit 1
}

if (-not (Test-Path $playwrightCorePath)) {
  Write-Host 'Installing dependencies...'
  & npm --prefix $PSScriptRoot install

  if ($LASTEXITCODE -ne 0) {
    Write-Error 'Dependency install failed.'
    exit $LASTEXITCODE
  }
}

$nodeArgs = @(
  $scriptPath,
  '--url',
  $Url,
  '--format',
  $Format,
  '--delay',
  $DelaySeconds.ToString(),
  '--timeout',
  $TimeoutSeconds.ToString(),
  '--width',
  $Width.ToString(),
  '--height',
  $Height.ToString()
)

if ($Output) {
  $nodeArgs += @('--output', $Output)
}

if ($NoAutoScroll.IsPresent) {
  $nodeArgs += '--no-auto-scroll'
}

$result = & node @nodeArgs
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
  exit $exitCode
}

$savedPath = ($result | Select-Object -Last 1)
Write-Host "Saved: $savedPath"
