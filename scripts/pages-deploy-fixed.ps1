param(
  [string]$NodeExe = '',
  [string]$FallbackNodeExe = '',
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path,
  [switch]$SkipDeploy
)

$ErrorActionPreference = 'Stop'

function Get-CommandLine {
  param([string]$label, [string]$command)
  try {
    $resolved = (Get-Command $command -ErrorAction Stop).Source
    if ($resolved) {
      return $resolved
    }
  } catch {
    return ''
  }
  return ''
}

function Get-NodeVersionMajor {
  param([string]$exePath)

  try {
    $version = & $exePath -v
    if ($version -match '^v(?<major>\d+)') {
      return [int]$Matches.major
    }
  } catch {
    return 0
  }
  return 0
}

function Resolve-NodeExecutable {
  $candidates = @(
    $NodeExe,
    $FallbackNodeExe,
    "$env:ProgramFiles\nodejs\node.exe",
    "$env:LOCALAPPDATA\nodejs\node.exe",
    "$env:LOCALAPPDATA\nodejs\node20\node.exe",
    "${env:ProgramFiles(x86)}\HncTools\McpServers\Node\node.exe",
    (Get-CommandLine 'node-path' 'node')
  ) | Where-Object { $_ -and $_.Trim() }

  $attempts = @()
  foreach ($candidate in $candidates) {
    if (-not (Test-Path -Path $candidate)) {
      $attempts += [pscustomobject]@{ Path = $candidate; Status = 'missing' }
      continue
    }

    $candidatePath = (Resolve-Path $candidate).Path
    try {
      $version = & $candidatePath -v 2>$null
      if ($LASTEXITCODE -eq 0 -and $version -match '^v?\d+') {
        $attempts += [pscustomobject]@{ Path = $candidatePath; Status = "ok:$version" }
        return $candidatePath
      }
      $attempts += [pscustomobject]@{ Path = $candidatePath; Status = "invocation_failed" }
    } catch {
      $attempts += [pscustomobject]@{ Path = $candidatePath; Status = "invocation_error" }
    }
  }

  Write-Host "[deploy] Node candidate scan result:"
  $attempts | ForEach-Object { Write-Host " - $($_.Path) => $($_.Status)" }
  return $null
}

function Resolve-NpmCommand {
  param([string]$nodeDir)

  $npmCmd = Join-Path $nodeDir 'npm.cmd'
  if (Test-Path -Path $npmCmd) {
    return $npmCmd
  }

  $npmSh = Join-Path $nodeDir 'npm'
  if (Test-Path -Path $npmSh) {
    return $npmSh
  }

  $pmCli = Join-Path $nodeDir 'node_modules\npm\bin\npm-cli.js'
  if (Test-Path -Path $pmCli) {
    return "node|$pmCli"
  }

  return ''
}

function Invoke-WhereLike {
  param([string]$command)

  try {
    if (Get-Command where.exe -ErrorAction SilentlyContinue) {
      return (where.exe $command | Out-String).Trim()
    }
  } catch {
    return ''
  }

  return ''
}

$resolvedNode = Resolve-NodeExecutable
if (-not $resolvedNode) {
  Write-Host "[deploy] NODE candidates not found."
  Write-Host "[deploy] checked: $(@(
    $NodeExe,
    $FallbackNodeExe,
    "$env:ProgramFiles\nodejs\node.exe",
    "$env:LOCALAPPDATA\nodejs\node.exe",
    "$env:LOCALAPPDATA\nodejs\node20\node.exe",
    "${env:ProgramFiles(x86)}\HncTools\McpServers\Node\node.exe"
  ) -join '; ')"
  Write-Host "[deploy] Suggest using CI path: npm run pages:deploy:ci (GitHub Actions)"
  throw "Node executable not found or not invokable in this session"
}

$nodeMajor = Get-NodeVersionMajor $resolvedNode
if ($nodeMajor -ne 0) {
  if ($nodeMajor -lt 20 -or $nodeMajor -ge 24) {
    Write-Host "[deploy] 경고: 현재 Node 메이저 버전이 v$nodeMajor 입니다. project는 Node >=20 <24 권장."
  }
}

$nodeDir = Split-Path -Path $resolvedNode
$npmCmd = Resolve-NpmCommand $nodeDir

if (-not $npmCmd) {
  throw "npm command not found under node directory: $nodeDir"
}

$npmCommandDisplay = $npmCmd
if ($npmCmd -like 'node|*') {
  $npmCommandDisplay = 'node + npm-cli.js'
}

# 현재 세션에서만 적용되는 Node/npm 경로 고정
$existingPath = @()
if ($env:Path) {
  $existingPath = $env:Path -split ';' | Where-Object { $_ -and $_.Trim() }
}

$pathItems = @($nodeDir, "${env:APPDATA}\npm") + $existingPath | Where-Object { $_ -and $_.Trim() }
$env:Path = ($pathItems | Select-Object -Unique) -join ';'

# Turbopack wasm 회피 플래그 고정
$env:NEXT_DISABLE_TURBOPACK = '1'
if (Test-Path Env:TURBOPACK) {
  Remove-Item Env:TURBOPACK
}

Write-Host "[deploy] node : $resolvedNode"
& $resolvedNode -v
if ($npmCmd -like 'node|*') {
  $npmCli = $npmCmd.Substring(5)
  & $resolvedNode $npmCli -v
} else {
  & $npmCmd -v
}

Write-Host "[deploy] where node: $(Invoke-WhereLike node)"
Write-Host "[deploy] where npm : $(Invoke-WhereLike npm)"
Write-Host "[deploy] where git : $(Invoke-WhereLike git)"

Set-Location $ProjectRoot

function Invoke-Npm {
  param([string[]]$Args)
  if ($npmCmd -like 'node|*') {
    $npmCli = $npmCmd.Substring(5)
    & $resolvedNode $npmCli @Args
  } else {
    & $npmCmd @Args
  }
}

Write-Host "[deploy] npm install"
Invoke-Npm @('install')

Write-Host "[deploy] npm run pages:build"
Invoke-Npm @('run', 'pages:build')

if ($SkipDeploy) {
  Write-Host "[deploy] SkipDeploy enabled - skipping pages:deploy"
  return
}

Write-Host "[deploy] npm run pages:deploy"
Invoke-Npm @('run', 'pages:deploy')
