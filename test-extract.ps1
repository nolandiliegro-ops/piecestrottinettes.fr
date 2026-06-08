# test-extract.ps1
# Teste l'Edge Function extract-product sur 3 fiches fournisseurs.
# Charge ADMIN_BULK_SECRET depuis le .env du repo, ecrit le resultat dans extract-test-results.txt.

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# 1. Localiser le repo (fixe ou portable)
$repo = $null
foreach ($p in @("C:\Users\User\piecestrottinettes.fr", "C:\Users\nolan\Documents\piecestrottinettes.fr")) {
  if (Test-Path $p) { $repo = $p; break }
}
if (-not $repo) { Write-Host "X Repo introuvable"; pause; exit }
Set-Location $repo
Write-Host "Repo : $repo"

# 2. Charger le secret depuis .env (racine ou scripts\)
$envFile = $null
foreach ($f in @(".env", "scripts\.env")) { if (Test-Path $f) { $envFile = $f; break } }
if (-not $envFile) { Write-Host "X .env introuvable"; pause; exit }
$secret = ((Get-Content $envFile | Where-Object { $_ -match '^ADMIN_BULK_SECRET=' }) -replace '^ADMIN_BULK_SECRET=', '').Trim().Trim('"').Trim("'")
if (-not $secret) { Write-Host "X ADMIN_BULK_SECRET absent de $envFile"; pause; exit }
Write-Host "Secret charge depuis $envFile (longueur $($secret.Length))  <- doit etre 32, pas 34"

# 3. Lancer les 3 tests
$endpoint = "https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/extract-product"
$urls = @(
  "https://www.wattiz.fr/fr/pneus-gonflables/53595-pneu-10x3-00-6-cst-tubeless-3760351013667.html",
  "https://volt-corp.com/shop/teverunfighterq52v13ah-trottinette-electrique-teverun-fighter-mini-q-52v-13ah-12028",
  "https://ewheel.es/fr/products/chargeurs-avec-connecteur-gx16"
)
$out = Join-Path $repo "extract-test-results.txt"
"Test extract-product - $(Get-Date)" | Out-File $out -Encoding UTF8

foreach ($u in $urls) {
  $sep = "`n========== $u =========="
  Write-Host $sep
  Add-Content $out $sep
  try {
    $body = @{ url = $u } | ConvertTo-Json -Compress
    $resp = Invoke-RestMethod -Method Post -Uri $endpoint -Headers @{ "x-admin-secret" = $secret } -ContentType "application/json" -Body $body
    $json = $resp | ConvertTo-Json -Depth 8
    Write-Host $json
    Add-Content $out $json
  }
  catch {
    $err = "X HTTP: $($_.Exception.Message)"
    Write-Host $err
    Add-Content $out $err
    if ($_.Exception.Response) {
      $b = (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()
      Write-Host "Corps: $b"
      Add-Content $out "Corps: $b"
    }
  }
}

Write-Host "`n==> Resultats ecrits dans : $out"
Write-Host "Ouvre ce fichier et upload-le dans le chat."
