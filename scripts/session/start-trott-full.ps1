# start-trott-full.ps1
# Identique a start-trott.ps1 mais lance Vite (npm run dev) en parallele
# dans une seconde fenetre PowerShell avant de demarrer Claude Code.

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

$RepoPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

function Write-Header {
    $machine = $env:COMPUTERNAME
    $date = Get-Date -Format "dddd dd MMMM yyyy"
    $heure = Get-Date -Format "HH:mm:ss"

    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  STEEDY DEV  -  DEMARRAGE SESSION + VITE" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  >> ORDI  : " -NoNewline -ForegroundColor Gray
    Write-Host "$machine" -ForegroundColor Yellow
    Write-Host "  >> DATE  : " -NoNewline -ForegroundColor Gray
    Write-Host "$date" -ForegroundColor White
    Write-Host "  >> HEURE : " -NoNewline -ForegroundColor Gray
    Write-Host "$heure" -ForegroundColor White
    Write-Host ""
    Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
}

Write-Header

try {
    Set-Location -Path $RepoPath -ErrorAction Stop
} catch {
    Write-Host "[ERREUR] Impossible d'acceder au repo :" -ForegroundColor Red
    Write-Host "         $RepoPath" -ForegroundColor Red
    exit 1
}

try {
    $null = git rev-parse --is-inside-work-tree 2>$null
    if ($LASTEXITCODE -ne 0) { throw "pas un repo git" }
} catch {
    Write-Host "[ERREUR] Ce dossier n'est pas un repo git :" -ForegroundColor Red
    Write-Host "         $RepoPath" -ForegroundColor Red
    exit 1
}

$dirty = git status --porcelain
if ($dirty) {
    Write-Host "[!] Fichiers modifies non commit :" -ForegroundColor Yellow
    Write-Host ""
    foreach ($line in $dirty) {
        Write-Host "    $line" -ForegroundColor Yellow
    }
    Write-Host ""
    $rep = Read-Host "Continuer quand meme ? (o/n)"
    if ($rep -notmatch '^(o|oui|y|yes)$') {
        Write-Host ""
        Write-Host "[X] Session annulee." -ForegroundColor Red
        exit 0
    }
    Write-Host ""
}

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

if ($behind -gt 0) {
    Write-Host ""
    Write-Host "[*] $behind commit(s) en retard sur origin/main" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    Dernier commit distant :" -ForegroundColor Gray
    $lastRemote = git log -1 origin/main --pretty=format:"%h  |  %an  |  %ar%n    %s"
    Write-Host "    $lastRemote" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "[OK] Deja a jour avec origin/main" -ForegroundColor Green
    Write-Host ""
}

Write-Host "[i] git pull --rebase..." -ForegroundColor Cyan
try {
    git pull --rebase
    if ($LASTEXITCODE -ne 0) { throw "pull failed" }
} catch {
    Write-Host ""
    Write-Host "[ERREUR] git pull --rebase a echoue (conflit ?)" -ForegroundColor Red
    Write-Host "         Resous le conflit puis relance start-trott-full." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] HEAD local apres pull :" -ForegroundColor Green
$lastLocal = git log -1 HEAD --pretty=format:"%h  |  %an  |  %ar%n    %s"
Write-Host "    $lastLocal" -ForegroundColor White
Write-Host ""

# Lancer Vite dans une nouvelle fenetre
Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "[>] Lancement de Vite (npm run dev) dans une nouvelle fenetre..." -ForegroundColor Cyan
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoPath'; npm run dev"
    Write-Host "[OK] Vite lance." -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Impossible de lancer Vite : $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "[>] Lancement de Claude Code dans une nouvelle fenetre..." -ForegroundColor Cyan
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoPath'; claude"
    Write-Host "[OK] Claude Code lance." -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Impossible de lancer Claude Code : $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "[OK] 2 terminaux ouverts. Fermeture du lanceur dans 3s..." -ForegroundColor Green
Start-Sleep -Seconds 3
