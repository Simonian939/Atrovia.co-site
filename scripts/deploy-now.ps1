$ErrorActionPreference = "Continue"
$Log = "C:\Users\Administrator\atrovia_deploy_full_output.txt"
$Repo = "C:\Users\Administrator\Atrovia.co-site"
$Source = "C:\Users\Administrator\Downloads\Unzipped\atrovia site"
$Remote = "https://github.com/mrcarter67/Atrovia.co-site.git"

function Log($msg) {
    $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
    $line | Out-File $Log -Append -Encoding utf8
    Write-Output $line
}

"" | Out-File $Log -Encoding utf8
Log "=== DEPLOY START ==="

Set-Location $Repo
Log "CWD: $(Get-Location)"

# Step 1: Copy from run-copy.ps1
try {
    Copy-Item "$Source\index.html" "$Repo\index.html" -Force
    Copy-Item "$Source\signup.html" "$Repo\signup.html" -Force
    Copy-Item "$Source\about.html" "$Repo\about.html" -Force
    Copy-Item "$Source\atrovia-site.html" "$Repo\atrovia-site.html" -Force
    Copy-Item "$Source\preview.html" "$Repo\preview.html" -Force
    Log "HTML files copied."

    $idx = Get-Content "$Repo\index.html" -Raw
    if ($idx -notmatch 'href="beta\.html"') {
        $idx = $idx -replace '(<a href="about\.html">About</a>)', '$1<a href="beta.html">Beta</a>'
        Set-Content "$Repo\index.html" $idx -Encoding UTF8 -NoNewline
        Log "Patched index.html with Beta nav link."
    }

    $ImagesDir = "$Repo\images"
    New-Item -ItemType Directory -Force -Path $ImagesDir | Out-Null
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead("$Source\atrovia_main.zip")
    foreach ($entry in $zip.Entries) {
        if ($entry.FullName -match '\.(png|jpg|jpeg|svg|webp)$' -and -not $entry.FullName.EndsWith('/')) {
            $dest = Join-Path $ImagesDir (Split-Path $entry.FullName -Leaf)
            [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
            Log "Extracted: $dest"
        }
    }
    $zip.Dispose()
    Log "COPY SUCCESS"
} catch {
    Log "COPY ERROR: $_"
}

Log "=== REPO FILES ==="
Get-ChildItem $Repo -Name | ForEach-Object { Log $_ }
Log "=== IMAGES ==="
Get-ChildItem "$Repo\images" -Name -ErrorAction SilentlyContinue | ForEach-Object { Log $_ }
Log "=== INDEX SIZE ==="
Log (Get-Item "$Repo\index.html").Length

# Step 2: Git
if (-not (Test-Path "$Repo\.git")) {
    Log "git init output:"
    git init 2>&1 | ForEach-Object { Log $_ }
}

$remotes = git remote 2>&1
Log "git remote list: $remotes"
if ($remotes -notmatch 'origin') {
    Log "git remote add origin:"
    git remote add origin $Remote 2>&1 | ForEach-Object { Log $_ }
} else {
    Log "git remote set-url origin:"
    git remote set-url origin $Remote 2>&1 | ForEach-Object { Log $_ }
}

$email = git config user.email 2>$null
$name = git config user.name 2>$null
Log "git user.email before: $email"
Log "git user.name before: $name"
if (-not $email) {
    git config user.email "deploy@atrovia.co" 2>&1 | ForEach-Object { Log $_ }
    Log "Set user.email to deploy@atrovia.co"
}
if (-not $name) {
    git config user.name "Atrovia Deploy" 2>&1 | ForEach-Object { Log $_ }
    Log "Set user.name to Atrovia Deploy"
}

Log "git add -A:"
git add -A 2>&1 | ForEach-Object { Log $_ }

Log "git status:"
git status 2>&1 | ForEach-Object { Log $_ }

Log "git commit:"
git commit -m "Deploy Austin HTML site: landing, beta, signup, customer app" 2>&1 | ForEach-Object { Log $_ }

Log "git branch -M main:"
git branch -M main 2>&1 | ForEach-Object { Log $_ }

Log "git push -u origin main --force:"
git push -u origin main --force 2>&1 | ForEach-Object { Log $_ }
$pushExit = $LASTEXITCODE
Log "git push exit code: $pushExit"

if ($pushExit -ne 0) {
    Log "Push failed - checking gh:"
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        gh auth status 2>&1 | ForEach-Object { Log $_ }
        gh repo sync 2>&1 | ForEach-Object { Log $_ }
        git push -u origin main --force 2>&1 | ForEach-Object { Log $_ }
        Log "git push retry exit code: $LASTEXITCODE"
    } else {
        Log "gh not available"
    }
}

# Step 3: Vercel (atrovia-landing-page / atrovia)
if ($pushExit -eq 0) {
    Log "=== VERCEL DEPLOY ==="
    if (Get-Command vercel -ErrorAction SilentlyContinue) {
        Log "vercel link:"
        vercel link --yes --project atrovia --scope atrovia-landing-page 2>&1 | ForEach-Object { Log $_ }
        Log "vercel --prod:"
        vercel --prod --yes 2>&1 | ForEach-Object { Log $_ }
        Log "vercel deploy exit code: $LASTEXITCODE"
    } else {
        Log "vercel CLI not installed — run: npm install -g vercel"
        Log "Then: vercel login && vercel link --project atrovia --scope atrovia-landing-page && vercel --prod"
    }
} else {
    Log "Skipping Vercel — GitHub push did not succeed"
}

Log "=== DEPLOY END ==="