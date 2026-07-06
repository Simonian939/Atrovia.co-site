# Atrovia.co-site — copy Austin HTML, extract images, push to GitHub, deploy Vercel
# Run from repo root: powershell -ExecutionPolicy Bypass -File .\scripts\setup-and-deploy.ps1

$ErrorActionPreference = "Stop"

$RepoRoot   = Split-Path $PSScriptRoot -Parent
$SourceDir  = "C:\Users\Administrator\Downloads\Unzipped\atrovia site"
$ZipPath    = Join-Path $SourceDir "atrovia_main.zip"
$ImagesDir  = Join-Path $RepoRoot "images"
$GitRemote  = "https://github.com/mrcarter67/Atrovia.co-site.git"

Write-Host "`n=== Atrovia Site Deploy — $(Get-Date -Format 'yyyy-MM-dd HH:mm') ===" -ForegroundColor Cyan
Set-Location $RepoRoot

# ── 1. Verify source files ──────────────────────────────────────────────────
if (-not (Test-Path $SourceDir)) {
    throw "Source folder not found: $SourceDir"
}

$HtmlFiles = @("index.html", "signup.html", "about.html", "atrovia-site.html", "preview.html")
foreach ($f in $HtmlFiles) {
    $src = Join-Path $SourceDir $f
    if (-not (Test-Path $src)) { throw "Missing source file: $src" }
    Copy-Item $src (Join-Path $RepoRoot $f) -Force
    Write-Host "  Copied $f" -ForegroundColor Green
}

# beta.html is maintained in-repo (not in Austin zip)
if (-not (Test-Path (Join-Path $RepoRoot "beta.html"))) {
    Write-Host "  WARNING: beta.html missing — create it before deploy" -ForegroundColor Yellow
}

# ── 2. Extract images from zip ──────────────────────────────────────────────
if (Test-Path $ZipPath) {
    New-Item -ItemType Directory -Force -Path $ImagesDir | Out-Null
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    $imageEntries = $zip.Entries | Where-Object { $_.FullName -match '^images/' -and -not $_.FullName.EndsWith('/') }
    if ($imageEntries.Count -eq 0) {
        # try flat structure inside zip
        $imageEntries = $zip.Entries | Where-Object { $_.Name -match '\.(png|jpg|jpeg|svg|webp)$' }
    }
    foreach ($entry in $imageEntries) {
        $destName = Split-Path $entry.FullName -Leaf
        $destPath = Join-Path $ImagesDir $destName
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destPath, $true)
        Write-Host "  Extracted images/$destName" -ForegroundColor Green
    }
    $zip.Dispose()
} else {
    Write-Host "  WARNING: $ZipPath not found — images may be broken on site" -ForegroundColor Yellow
}

# ── 3. Git setup ────────────────────────────────────────────────────────────
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is not installed. Install from https://git-scm.com"
}

if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
    Write-Host "`nInitializing git repo..." -ForegroundColor Cyan
    git init
    git remote add origin $GitRemote
}

$gitUser = git config user.name 2>$null
$gitEmail = git config user.email 2>$null
if (-not $gitUser -or -not $gitEmail) {
    Write-Host "`nGit user not configured. Set it now:" -ForegroundColor Yellow
    $name  = Read-Host "  Your name (for commits)"
    $email = Read-Host "  Your email"
    git config user.name $name
    git config user.email $email
}

git add -A
$status = git status --porcelain
if ($status) {
    git commit -m "Deploy Austin HTML site: landing, beta, signup, customer app ($(Get-Date -Format 'yyyy-MM-dd'))"
    Write-Host "`nCommitted changes." -ForegroundColor Green
} else {
    Write-Host "`nNo changes to commit." -ForegroundColor Yellow
}

Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
git branch -M main 2>$null
git push -u origin main --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nPush failed — you may need to authenticate:" -ForegroundColor Red
    Write-Host "  gh auth login" -ForegroundColor Yellow
    Write-Host "  OR use a GitHub Personal Access Token when prompted" -ForegroundColor Yellow
    Write-Host "`nAfter auth, re-run: git push -u origin main --force" -ForegroundColor Yellow
} else {
    Write-Host "Pushed to $GitRemote" -ForegroundColor Green
}

# ── 4. Vercel deploy ────────────────────────────────────────────────────────
Write-Host "`nDeploying to Vercel..." -ForegroundColor Cyan
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Link to existing project: atrovia-landing-page/atrovia
# Dashboard: https://vercel.com/atrovia-landing-page/atrovia
vercel link --yes --project atrovia --scope atrovia-landing-page 2>&1
vercel --prod --yes 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`nVercel deploy needs login. Run manually:" -ForegroundColor Yellow
    Write-Host "  cd `"$RepoRoot`"" -ForegroundColor White
    Write-Host "  vercel login" -ForegroundColor White
    Write-Host "  vercel link    # select: atrovia-landing-page / atrovia" -ForegroundColor White
    Write-Host "  vercel --prod" -ForegroundColor White
} else {
    Write-Host "`nDeployed to Vercel production!" -ForegroundColor Green
}

Write-Host "`n=== DONE ===" -ForegroundColor Cyan
Write-Host "Pages:" -ForegroundColor White
Write-Host "  /          Landing page (index.html)" -ForegroundColor Gray
Write-Host "  /beta      Beta signup" -ForegroundColor Gray
Write-Host "  /signup    Plan selection + account creation" -ForegroundColor Gray
Write-Host "  /app       Customer landing (atrovia-site.html)" -ForegroundColor Gray
Write-Host "  /about     About page" -ForegroundColor Gray
Write-Host "`nPreview locally: npx serve . -p 3000" -ForegroundColor Gray