# sync-trott.ps1
# Synchro rapide en cours de session : fetch + pull rebase, rend la main.

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

$RepoPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

try {
    Set-Location -Path $RepoPath -ErrorAction Stop
} catch {
    Write-Host "[ERREUR] Impossible d'acceder au repo : $RepoPath" -ForegroundColor Red
    exit 1
}

try {
    $null = git rev-parse --is-inside-work-tree 2>$null
    if ($LASTEXITCODE -ne 0) { throw "pas un repo git" }
} catch {
    Write-Host "[ERREUR] Pas un repo git : $RepoPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[i] sync-trott  -  synchro rapide ($env:COMPUTERNAME)" -ForegroundColor Cyan
Write-Host ""

Write-Host "[i] git fetch origin..." -ForegroundColor Cyan
try {
    git fetch origin 2>$null
    if ($LASTEXITCODE -ne 0) { throw "fetch failed" }
} catch {
    Write-Host "[ERREUR] git fetch a echoue (pas de reseau ?)" -ForegroundColor Red
    exit 1
}

$behindRaw = git rev-list --count HEAD..origin/main 2>$null
if (-not $behindRaw) { $behindRaw = "0" }
$behind = [int]$behindRaw

if ($behind -eq 0) {
    Write-Host "[OK] Deja a jour avec origin/main." -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host "[*] $behind commit(s) a recuperer." -ForegroundColor Yellow
Write-Host "    Dernier commit distant :" -ForegroundColor Gray
$lastRemote = git log -1 origin/main --pretty=format:"%h  |  %an  |  %ar%n    %s"
Write-Host "    $lastRemote" -ForegroundColor White
Write-Host ""

Write-Host "[i] git pull --rebase..." -ForegroundColor Cyan
try {
    git pull --rebase
    if ($LASTEXITCODE -ne 0) { throw "pull failed" }
} catch {
    Write-Host "[ERREUR] git pull --rebase a echoue (conflit ?)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] Synchro terminee." -ForegroundColor Green
Write-Host ""
