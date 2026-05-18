# end-trott-gui.ps1
# Popup Windows Forms pour finir une session en 1 clic : choix categorie -> commit + push.
# Lance depuis l'icone bureau "End Trott" avec -WindowStyle Hidden.

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$RepoPath = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# Aller dans le repo
try {
    Set-Location -Path $RepoPath -ErrorAction Stop
} catch {
    [System.Windows.Forms.MessageBox]::Show(
        "Impossible d'acceder au repo :`n$RepoPath",
        "Steedy Dev - Erreur",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
    exit 1
}

# Verifier que c'est un repo git
$null = git rev-parse --is-inside-work-tree 2>$null
if ($LASTEXITCODE -ne 0) {
    [System.Windows.Forms.MessageBox]::Show(
        "Ce dossier n'est pas un repo git :`n$RepoPath",
        "Steedy Dev - Erreur",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
    exit 1
}

# Verifier s'il y a quelque chose a pousser
$dirty = git status --porcelain 2>$null
if (-not $dirty) {
    [System.Windows.Forms.MessageBox]::Show(
        "Rien a pousser - session deja propre.",
        "Steedy Dev - Fin de session",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    ) | Out-Null
    exit 0
}

# -----------------------------------------------------------------------
# Construction de la fenetre
# -----------------------------------------------------------------------

$colorGreen  = [System.Drawing.ColorTranslator]::FromHtml("#4A7C59")
$colorGray   = [System.Drawing.Color]::FromArgb(108, 117, 125)
$colorBg     = [System.Drawing.ColorTranslator]::FromHtml("#F5F0E8")
$colorText   = [System.Drawing.Color]::FromArgb(33, 37, 41)
$fontUI      = New-Object System.Drawing.Font("Segoe UI", 10)
$fontSmall   = New-Object System.Drawing.Font("Segoe UI", 9)
$fontTitle   = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)

$form = New-Object System.Windows.Forms.Form
$form.Text            = "Steedy Dev - Fin de session"
$form.Size            = New-Object System.Drawing.Size(460, 540)
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$form.MaximizeBox     = $false
$form.MinimizeBox     = $false
$form.StartPosition   = [System.Windows.Forms.FormStartPosition]::CenterScreen
$form.BackColor       = $colorBg
$form.Font            = $fontUI

# Titre
$lblTitle = New-Object System.Windows.Forms.Label
$lblTitle.Text      = "Qu'as-tu fait dans cette session ?"
$lblTitle.Location  = New-Object System.Drawing.Point(20, 18)
$lblTitle.Size      = New-Object System.Drawing.Size(410, 26)
$lblTitle.Font      = $fontTitle
$lblTitle.ForeColor = $colorText
$form.Controls.Add($lblTitle)

# Separateur haut
$sepTop = New-Object System.Windows.Forms.Panel
$sepTop.Location  = New-Object System.Drawing.Point(20, 50)
$sepTop.Size      = New-Object System.Drawing.Size(410, 1)
$sepTop.BackColor = [System.Drawing.Color]::FromArgb(200, 195, 185)
$form.Controls.Add($sepTop)

# Categories avec leur prefixe de commit
$categories = @(
    @{ Label = "Modifications design / UI";     Prefix = "design" },
    @{ Label = "Correction de bug";             Prefix = "fix"    },
    @{ Label = "Nouvelle fonctionnalite";       Prefix = "feat"   },
    @{ Label = "Audit / lecture / exploration"; Prefix = "chore: audit" },
    @{ Label = "Ajout de produits / contenu";   Prefix = "content" },
    @{ Label = "Setup / config / automation";   Prefix = "chore: setup" },
    @{ Label = "Session de travail generale";   Prefix = "wip"    }
)

$radioButtons = @()
$yPos = 62

foreach ($cat in $categories) {
    $rb = New-Object System.Windows.Forms.RadioButton
    $rb.Text      = $cat.Label
    $rb.Location  = New-Object System.Drawing.Point(24, $yPos)
    $rb.Size      = New-Object System.Drawing.Size(400, 26)
    $rb.Font      = $fontUI
    $rb.ForeColor = $colorText
    $rb.Tag       = $cat.Prefix
    $rb.BackColor = [System.Drawing.Color]::Transparent
    $form.Controls.Add($rb)
    $radioButtons += $rb
    $yPos += 30
}

# Separateur milieu
$sepMid = New-Object System.Windows.Forms.Panel
$sepMid.Location  = New-Object System.Drawing.Point(20, ($yPos + 4))
$sepMid.Size      = New-Object System.Drawing.Size(410, 1)
$sepMid.BackColor = [System.Drawing.Color]::FromArgb(200, 195, 185)
$form.Controls.Add($sepMid)

$yPos += 16

# Label champ libre
$lblCustom = New-Object System.Windows.Forms.Label
$lblCustom.Text      = "Ou ecris ton propre message (facultatif) :"
$lblCustom.Location  = New-Object System.Drawing.Point(20, $yPos)
$lblCustom.Size      = New-Object System.Drawing.Size(410, 20)
$lblCustom.Font      = $fontSmall
$lblCustom.ForeColor = $colorGray
$form.Controls.Add($lblCustom)

$yPos += 24

# TextBox message custom
$txtCustom = New-Object System.Windows.Forms.TextBox
$txtCustom.Location  = New-Object System.Drawing.Point(20, $yPos)
$txtCustom.Size      = New-Object System.Drawing.Size(410, 28)
$txtCustom.Font      = $fontUI
$txtCustom.BorderStyle = [System.Windows.Forms.BorderStyle]::FixedSingle
$form.Controls.Add($txtCustom)

$yPos += 44

# Separateur bas
$sepBot = New-Object System.Windows.Forms.Panel
$sepBot.Location  = New-Object System.Drawing.Point(20, $yPos)
$sepBot.Size      = New-Object System.Drawing.Size(410, 1)
$sepBot.BackColor = [System.Drawing.Color]::FromArgb(200, 195, 185)
$form.Controls.Add($sepBot)

$yPos += 16

# Bouton Annuler
$btnCancel = New-Object System.Windows.Forms.Button
$btnCancel.Text      = "Annuler"
$btnCancel.Location  = New-Object System.Drawing.Point(200, $yPos)
$btnCancel.Size      = New-Object System.Drawing.Size(110, 36)
$btnCancel.Font      = $fontUI
$btnCancel.BackColor = [System.Drawing.Color]::FromArgb(220, 215, 205)
$btnCancel.ForeColor = $colorText
$btnCancel.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnCancel.FlatAppearance.BorderSize = 0
$btnCancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.Controls.Add($btnCancel)
$form.CancelButton = $btnCancel

# Bouton OK (vert sauge)
$btnOK = New-Object System.Windows.Forms.Button
$btnOK.Text      = "Terminer la session"
$btnOK.Location  = New-Object System.Drawing.Point(320, $yPos)
$btnOK.Size      = New-Object System.Drawing.Size(110, 36)
$btnOK.Font      = New-Object System.Drawing.Font("Segoe UI", 10, [System.Drawing.FontStyle]::Bold)
$btnOK.BackColor = $colorGreen
$btnOK.ForeColor = [System.Drawing.Color]::White
$btnOK.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$btnOK.FlatAppearance.BorderSize = 0
$btnOK.Enabled   = $false
$btnOK.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.Controls.Add($btnOK)
$form.AcceptButton = $btnOK

# Activer OK des qu'une categorie est cochee OU que le champ est non vide
$updateOkState = {
    $anyRadio = ($radioButtons | Where-Object { $_.Checked }) -ne $null
    $hasText   = $txtCustom.Text.Trim() -ne ""
    $btnOK.Enabled = $anyRadio -or $hasText
}

foreach ($rb in $radioButtons) {
    $rb.Add_CheckedChanged($updateOkState)
}
$txtCustom.Add_TextChanged($updateOkState)

# -----------------------------------------------------------------------
# Affichage + traitement
# -----------------------------------------------------------------------

$result = $form.ShowDialog()

if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
    exit 0
}

# Determiner le message
$customText = $txtCustom.Text.Trim()

if ($customText -ne "") {
    $commitMsg = $customText
} else {
    $selected = $radioButtons | Where-Object { $_.Checked } | Select-Object -First 1
    if (-not $selected) {
        [System.Windows.Forms.MessageBox]::Show(
            "Choisis une categorie ou ecris un message.",
            "Steedy Dev",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Warning
        ) | Out-Null
        exit 0
    }
    $prefix    = $selected.Tag
    $dateStr   = Get-Date -Format "dd/MM/yyyy HH\hmm"
    # Les prefixes "chore: audit" et "chore: setup" contiennent deja le ":"
    if ($prefix -match ":") {
        $commitMsg = "$prefix session du $dateStr"
    } else {
        $commitMsg = "${prefix}: session du $dateStr"
    }
}

# -----------------------------------------------------------------------
# git add / commit / push
# -----------------------------------------------------------------------

try {
    # 2>$null evite que PowerShell wrape les warnings stderr en NativeCommandError
    git add . 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "git add a echoue (code $LASTEXITCODE)" }

    git commit -m "$commitMsg" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "git commit a echoue (code $LASTEXITCODE)" }

    # Pour push : capturer stderr dans un fichier temp pour pouvoir filtrer
    # les warnings benins (LF/CRLF, etc.) des vraies erreurs (rejected, fatal)
    $pushErrFile = [System.IO.Path]::GetTempFileName()
    git push 2>$pushErrFile | Out-Null
    $pushExit = $LASTEXITCODE
    if ($pushExit -ne 0) {
        $rawErr  = Get-Content $pushErrFile -Raw -ErrorAction SilentlyContinue
        $realErr = ($rawErr -split "`n" |
                    Where-Object { $_ -match '(error:|fatal:|rejected|conflict)' }) -join "`n"
        $detail  = if ($realErr.Trim()) { "`n`n$($realErr.Trim())" } else { " (code $pushExit)" }
        throw "git push a echoue.$detail`n`nCause probable : un commit existe sur origin/main que tu n'as pas.`nFais sync-trott puis relance End Trott."
    }
    Remove-Item $pushErrFile -ErrorAction SilentlyContinue

    $sha = git log -1 --pretty=format:"%h" 2>$null
    $msg = git log -1 --pretty=format:"%s" 2>$null

    [System.Windows.Forms.MessageBox]::Show(
        "Push reussi !`n`nCommit : $sha`nMessage : $msg",
        "Steedy Dev - Session terminee",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Information
    ) | Out-Null

} catch {
    [System.Windows.Forms.MessageBox]::Show(
        "Erreur lors du push :`n`n$_",
        "Steedy Dev - Erreur",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
    exit 1
}
