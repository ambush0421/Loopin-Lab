param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Arguments
)

$ErrorActionPreference = 'Stop'

function Write-Info {
  param([string]$Message)
  Write-Host "[codex-run] $Message" -ForegroundColor Cyan
}

function Resolve-NodeExecutable {
  $candidates = @(
    $env:NODE_EXE,
    "$env:ProgramFiles\nodejs\node.exe",
    "$env:LOCALAPPDATA\nodejs\node.exe",
    "$env:LOCALAPPDATA\nodejs\node20\node.exe",
    "${env:ProgramFiles(x86)}\HncTools\McpServers\Node\node.exe",
    (Get-Command node -ErrorAction SilentlyContinue)?.Source
  ) | Where-Object { $_ } | Select-Object -Unique

  foreach ($candidate in $candidates) {
    if (-not (Test-Path $candidate)) {
      continue
    }

    try {
      $resolved = (Resolve-Path $candidate).Path
      $version = & $resolved -v 2>$null
      if ($LASTEXITCODE -eq 0 -and $version -match '^v\d+') {
        return $resolved
      }
    } catch {
      continue
    }
  }

  return $null
}

function Resolve-CodexEntry {
  param([string]$nodeDir)

  $npmCmd = Join-Path $nodeDir 'npm.cmd'
  $npmPrefix = $null

  if (Test-Path $npmCmd) {
    try {
      $npmPrefix = (& $npmCmd config get prefix 2>$null).Trim()
    } catch {
      $npmPrefix = $null
    }
  }

  $roots = @(
    $npmPrefix,
    "$env:APPDATA\npm",
    "$env:LOCALAPPDATA\npm",
    (Split-Path $nodeDir)
  ) | Where-Object { $_ -and $_.Trim() } | Select-Object -Unique

  $globalCodex = (Get-Command codex -ErrorAction SilentlyContinue).Source
  if ($globalCodex) {
    $roots += Split-Path (Split-Path $globalCodex -Parent) -Parent -ErrorAction SilentlyContinue
  }

  foreach ($root in $roots) {
    $candidate = Join-Path $root 'node_modules\@openai\codex\bin\codex.js'
    if (Test-Path $candidate) {
      return (Resolve-Path $candidate).Path
    }
  }

  return $null
}

$nodeExe = Resolve-NodeExecutable
if (-not $nodeExe) {
  throw "node.exe를 찾지 못했습니다. Node가 설치되어 있는지, 또는 PATH가 살아있는지 확인해주세요."
}

$nodeDir = Split-Path $nodeExe
$codexJs = Resolve-CodexEntry -nodeDir $nodeDir
if (-not $codexJs) {
  throw "Codex 실행 파일을 찾지 못했습니다. '@openai/codex'가 전역 설치되어 있는지 확인하고 재시도해주세요."
}

$npmDir = "$env:APPDATA\npm"
$env:Path = @($nodeDir, $npmDir, (Get-Content Env:Path)) | Where-Object { $_ -and $_.Trim() } | Select-Object -Unique
Set-Item Env:Path ($env:Path -join ';')

Write-Info "node : $nodeExe"
Write-Info "codex.js : $codexJs"
& $nodeExe $codexJs @Arguments
