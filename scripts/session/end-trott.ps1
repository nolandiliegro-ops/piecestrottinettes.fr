# end-trott.ps1
# Fin de session : commit + push vers origin/main (JAMAIS --force)
# Usage : end-trott                       -> demande le message
#         end-trott "mon message"         -> utilise l'argument direct

param([string]$Message)

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
    Write-Host "  STEEDY DEV  -  FIN DE SESSION" -ForegroundColor Cyan
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

# --- Arret propre du serveur Vite (port 8080) ---
Write-Host "[i] Arret propre du serveur Vite (port 8080)..." -ForegroundColor Cyan
$viteConns = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue |
             Where-Object { $_.State -eq 'Listen' }
if ($viteConns) {
    $pidList = $viteConns | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique
    foreach ($p in $pidList) {
        if ($p -eq 0 -or $p -eq 4) { continue }
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 1
    Write-Host "[OK] Serveur Vite arrete proprement" -ForegroundColor Green
} else {
    Write-Host "[i] Aucun serveur Vite a arreter" -ForegroundColor DarkGray
}
Write-Host ""

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

# Status
Write-Host "[i] Etat du repo :" -ForegroundColor Cyan
Write-Host ""
git status
Write-Host ""

$dirty = git status --porcelain
if (-not $dirty) {
    Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "[OK] Rien a pousser, session propre." -ForegroundColor Green
    Write-Host ""
    exit 0
}

# Diff stat
Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "[i] Modifications a commit :" -ForegroundColor Cyan
Write-Host ""
git diff --stat HEAD
foreach ($line in $dirty) {
    if ($line -match '^\?\?') {
        $f = $line.Substring(3)
        Write-Host "  (nouveau) $f" -ForegroundColor Yellow
    }
}
Write-Host ""

# Message de commit
if (-not $Message -or $Message.Trim() -eq '') {
    $Message = Read-Host "Message de commit"
    if (-not $Message -or $Message.Trim() -eq '') {
        Write-Host ""
        Write-Host "[X] Message vide, annulation." -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "    Message : " -NoNewline -ForegroundColor Gray
Write-Host "$Message" -ForegroundColor White
Write-Host ""

# Confirmation
$rep = Read-Host "Push vers origin/main ? (o/n)"
if ($rep -notmatch '^(o|oui|y|yes)$') {
    Write-Host ""
    Write-Host "[X] Annule. Aucun commit cree." -ForegroundColor Red
    exit 0
}

# Add
Write-Host ""
Write-Host "[i] git add ." -ForegroundColor Cyan
try {
    git add .
    if ($LASTEXITCODE -ne 0) { throw "add failed" }
} catch {
    Write-Host "[ERREUR] git add a echoue." -ForegroundColor Red
    exit 1
}

# Commit
Write-Host "[i] git commit..." -ForegroundColor Cyan
try {
    git commit -m "$Message"
    if ($LASTEXITCODE -ne 0) { throw "commit failed" }
} catch {
    Write-Host "[ERREUR] git commit a echoue." -ForegroundColor Red
    exit 1
}

# Push (JAMAIS --force)
Write-Host "[i] git push..." -ForegroundColor Cyan
try {
    git push
    if ($LASTEXITCODE -ne 0) { throw "push failed" }
} catch {
    Write-Host ""
    Write-Host "[ERREUR] git push a echoue." -ForegroundColor Red
    Write-Host "         Cause probable : un nouveau commit existe sur origin/main" -ForegroundColor Yellow
    Write-Host "         (toi sur l'autre ordi, ou Lovable)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "         A faire :  sync-trott  puis  end-trott (sans nouveau commit)" -ForegroundColor Yellow
    Write-Host "         NE JAMAIS faire push --force (Lovable serait casse)." -ForegroundColor Yellow
    exit 1
}

# Recap
$commitId = git log -1 HEAD --pretty=format:"%h"
$commitMsg = git log -1 HEAD --pretty=format:"%s"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  [OK] PUSH REUSSI" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Commit  : " -NoNewline -ForegroundColor Gray
Write-Host "$commitId" -ForegroundColor Yellow
Write-Host "  Message : " -NoNewline -ForegroundColor Gray
Write-Host "$commitMsg" -ForegroundColor White
Write-Host "  Remote  : " -NoNewline -ForegroundColor Gray
Write-Host "origin/main" -ForegroundColor White
Write-Host ""
