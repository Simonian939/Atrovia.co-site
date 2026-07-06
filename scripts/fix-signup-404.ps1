# Fix /signup 404 on live Vercel (Next.js repo) — adds Austin signup.html to public/ + rewrites
$ErrorActionPreference = "Continue"
$Log = "C:\Users\Administrator\atrovia_signup_fix_output.txt"
$CloneDir = "C:\Users\Administrator\Atrovia.co-site-github"
$Source = "C:\Users\Administrator\Downloads\Unzipped\atrovia site"
$Remote = "https://github.com/mrcarter67/Atrovia.co-site.git"

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    $line | Out-File $Log -Append -Encoding utf8
    Write-Host $line
}

"" | Out-File $Log -Encoding utf8
Log "=== SIGNUP 404 FIX START ==="

# Clone or pull existing repo
if (-not (Test-Path $CloneDir)) {
    Log "Cloning $Remote ..."
    git clone $Remote $CloneDir 2>&1 | ForEach-Object { Log $_ }
} else {
    Set-Location $CloneDir
    Log "Pulling latest..."
    git pull origin main 2>&1 | ForEach-Object { Log $_ }
}
Set-Location $CloneDir

# Copy static HTML assets into public/
$Public = Join-Path $CloneDir "public"
$Images = Join-Path $Public "images"
New-Item -ItemType Directory -Force -Path $Public | Out-Null
New-Item -ItemType Directory -Force -Path $Images | Out-Null

foreach ($f in @("signup.html", "atrovia-site.html", "index.html", "about.html")) {
    $src = Join-Path $Source $f
    if (Test-Path $src) {
        Copy-Item $src (Join-Path $Public $f) -Force
        Log "Copied public/$f"
    } else {
        Log "MISSING source: $src"
    }
}

# Extract images
$ZipPath = Join-Path $Source "atrovia_main.zip"
if (Test-Path $ZipPath) {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    foreach ($entry in $zip.Entries) {
        if ($entry.FullName -match '\.(png|jpg|jpeg|svg|webp)$' -and -not $entry.FullName.EndsWith('/')) {
            $dest = Join-Path $Images (Split-Path $entry.FullName -Leaf)
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
            Log "Extracted public/images/$(Split-Path $entry.FullName -Leaf)"
        }
    }
    $zip.Dispose()
}

# Update next.config.ts with rewrites for clean URLs
$NextConfig = @'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/signup", destination: "/signup.html" },
      { source: "/app", destination: "/atrovia-site.html" },
      { source: "/customer", destination: "/atrovia-site.html" },
    ];
  },
};

export default nextConfig;
'@
Set-Content (Join-Path $CloneDir "next.config.ts") $NextConfig -Encoding UTF8 -NoNewline
Log "Updated next.config.ts with /signup rewrite"

# Git commit + push
$email = git config user.email 2>$null
$name = git config user.name 2>$null
if (-not $email) { git config user.email "deploy@atrovia.co"; git config user.name "Atrovia Deploy" }

git add -A 2>&1 | ForEach-Object { Log $_ }
git status 2>&1 | ForEach-Object { Log $_ }
git commit -m "Fix /signup 404: add Austin signup.html + rewrites for /app" 2>&1 | ForEach-Object { Log $_ }
git push origin main 2>&1 | ForEach-Object { Log $_ }
$pushExit = $LASTEXITCODE
Log "git push exit code: $pushExit"

if ($pushExit -eq 0) {
    Log "SUCCESS — Vercel will auto-redeploy in ~1-2 min"
    Log "Test: https://atrovia.vercel.app/signup"
} else {
    Log "Push failed — run: gh auth login, then re-run this script"
}

Log "=== SIGNUP 404 FIX END ==="