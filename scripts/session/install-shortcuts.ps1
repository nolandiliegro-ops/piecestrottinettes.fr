# install-shortcuts.ps1
# Installe les alias PowerShell globaux + cree l'icone bureau "Steedy Dev".
# A lancer UNE SEULE FOIS sur chaque poste (fixe + portable).

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

$SessionDir = $PSScriptRoot
$RepoPath = Split-Path -Parent (Split-Path -Parent $SessionDir)

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  STEEDY DEV  -  INSTALLATION DES RACCOURCIS" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Repo    : $RepoPath" -ForegroundColor Gray
Write-Host "  Scripts : $SessionDir" -ForegroundColor Gray
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# 1. Profil PowerShell --------------------------------------------------------
$profilePath = $PROFILE
$profileDir = Split-Path -Parent $profilePath

if (-not (Test-Path $profileDir)) {
    Write-Host "[i] Creation du dossier profil PowerShell..." -ForegroundColor Cyan
    try {
        New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    } catch {
        Write-Host "[ERREUR] Impossible de creer $profileDir" -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path $profilePath)) {
    Write-Host "[i] Creation du fichier profil PowerShell..." -ForegroundColor Cyan
    try {
        New-Item -ItemType File -Path $profilePath -Force | Out-Null
    } catch {
        Write-Host "[ERREUR] Impossible de creer $profilePath" -ForegroundColor Red
        exit 1
    }
}

$existing = ""
try {
    $existing = Get-Content -Path $profilePath -Raw -ErrorAction SilentlyContinue
    if (-not $existing) { $existing = "" }
} catch {
    $existing = ""
}

$marker = "# === Steedy Dev - piecestrottinettes.fr ==="

if ($existing -match [regex]::Escape($marker)) {
    Write-Host "[OK] Alias deja presents dans le profil :" -ForegroundColor Green
    Write-Host "     $profilePath" -ForegroundColor Gray
} else {
    $block = @"

$marker
function start-trott { & "$SessionDir\start-trott.ps1" }
function start-trott-full { & "$SessionDir\start-trott-full.ps1" }
function end-trott { param([string]`$msg) & "$SessionDir\end-trott.ps1" `$msg }
function sync-trott { & "$SessionDir\sync-trott.ps1" }
# === Fin Steedy Dev ===

"@
    try {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::AppendAllText($profilePath, $block, $utf8NoBom)
        Write-Host "[OK] Alias ajoutes au profil PowerShell :" -ForegroundColor Green
        Write-Host "     $profilePath" -ForegroundColor Gray
    } catch {
        Write-Host "[ERREUR] Impossible d'ecrire dans le profil : $_" -ForegroundColor Red
        exit 1
    }
}

# 2. Icone bureau "Steedy Dev" ------------------------------------------------
Write-Host ""
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "Steedy Dev.lnk"

try {
    $WshShell = New-Object -ComObject WScript.Shell
    $shortcut = $WshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = '-NoExit -Command "start-trott-full"'
    $shortcut.WorkingDirectory = $RepoPath
    $shortcut.IconLocation = "powershell.exe,0"
    $shortcut.Description = "Steedy Dev - demarre une session sur piecestrottinettes.fr"
    $shortcut.Save()
    Write-Host "[OK] Icone bureau creee :" -ForegroundColor Green
    Write-Host "     $shortcutPath" -ForegroundColor Gray
} catch {
    Write-Host "[ERREUR] Creation du raccourci Steedy Dev echouee : $_" -ForegroundColor Red
}

# 3. Icone bureau "End Trott" -------------------------------------------------
$guiScriptPath  = Join-Path $SessionDir "end-trott-gui.ps1"
$shortcutEndPath = Join-Path $desktopPath "End Trott.lnk"

try {
    $WshShell2 = New-Object -ComObject WScript.Shell
    $shortcutEnd = $WshShell2.CreateShortcut($shortcutEndPath)
    $shortcutEnd.TargetPath = "powershell.exe"
    $shortcutEnd.Arguments = "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$guiScriptPath`""
    $shortcutEnd.WorkingDirectory = $RepoPath
    $shortcutEnd.IconLocation = "powershell.exe,0"
    $shortcutEnd.Description = "Steedy Dev - termine la session avec une popup de commit"
    $shortcutEnd.Save()
    Write-Host "[OK] Icone bureau creee :" -ForegroundColor Green
    Write-Host "     $shortcutEndPath" -ForegroundColor Gray
} catch {
    Write-Host "[ERREUR] Creation du raccourci End Trott echouee : $_" -ForegroundColor Red
}

# 4. Recap final ---------------------------------------------------------------
Write-Host ""
Write-Host "----------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Commandes disponibles (apres redemarrage de PowerShell) :" -ForegroundColor Cyan
Write-Host ""
Write-Host "    start-trott           " -NoNewline -ForegroundColor Yellow
Write-Host "-> pull + Claude Code" -ForegroundColor Gray
Write-Host "    start-trott-full      " -NoNewline -ForegroundColor Yellow
Write-Host "-> pull + Vite + Claude Code" -ForegroundColor Gray
Write-Host "    end-trott `"msg`"       " -NoNewline -ForegroundColor Yellow
Write-Host "-> commit + push (terminal)" -ForegroundColor Gray
Write-Host "    sync-trott            " -NoNewline -ForegroundColor Yellow
Write-Host "-> git pull rapide" -ForegroundColor Gray
Write-Host ""
Write-Host "  Icones bureau :" -ForegroundColor Cyan
Write-Host "    " -NoNewline
Write-Host "Steedy Dev  " -ForegroundColor Yellow -NoNewline
Write-Host "-> demarre une session (start-trott)" -ForegroundColor Gray
Write-Host "    " -NoNewline
Write-Host "End Trott   " -ForegroundColor Yellow -NoNewline
Write-Host "-> popup de fin de session (commit + push en 1 clic)" -ForegroundColor Gray
Write-Host ""
Write-Host "  Pour activer SANS redemarrer :" -ForegroundColor Cyan
Write-Host "    . `$PROFILE" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  [OK] Installation terminee." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
