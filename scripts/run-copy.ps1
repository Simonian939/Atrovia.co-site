$Log = "C:\Users\Administrator\atrovia_run_output.txt"
$Repo = "C:\Users\Administrator\Atrovia.co-site"
$Source = "C:\Users\Administrator\Downloads\Unzipped\atrovia site"
"=== START $(Get-Date) ===" | Out-File $Log -Encoding utf8
try {
  Copy-Item "$Source\index.html" "$Repo\index.html" -Force
  Copy-Item "$Source\signup.html" "$Repo\signup.html" -Force
  Copy-Item "$Source\about.html" "$Repo\about.html" -Force
  Copy-Item "$Source\atrovia-site.html" "$Repo\atrovia-site.html" -Force
  Copy-Item "$Source\preview.html" "$Repo\preview.html" -Force
  "HTML files copied." | Out-File $Log -Append -Encoding utf8

  # Add Beta link to landing page nav if missing
  $idx = Get-Content "$Repo\index.html" -Raw
  if ($idx -notmatch 'href="beta\.html"') {
    $idx = $idx -replace '(<a href="about\.html">About</a>)', '$1<a href="beta.html">Beta</a>'
    Set-Content "$Repo\index.html" $idx -Encoding UTF8 -NoNewline
    "Patched index.html with Beta nav link." | Out-File $Log -Append -Encoding utf8
  }

  $ImagesDir = "$Repo\images"
  New-Item -ItemType Directory -Force -Path $ImagesDir | Out-Null
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $zip = [System.IO.Compression.ZipFile]::OpenRead("$Source\atrovia_main.zip")
  foreach ($entry in $zip.Entries) {
    if ($entry.FullName -match '\.(png|jpg|jpeg|svg|webp)$' -and -not $entry.FullName.EndsWith('/')) {
      $dest = Join-Path $ImagesDir (Split-Path $entry.FullName -Leaf)
      [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $dest, $true)
      "Extracted: $dest" | Out-File $Log -Append -Encoding utf8
    }
  }
  $zip.Dispose()

  "=== REPO FILES ===" | Out-File $Log -Append -Encoding utf8
  Get-ChildItem $Repo -Name | Out-File $Log -Append -Encoding utf8
  "=== IMAGES ===" | Out-File $Log -Append -Encoding utf8
  Get-ChildItem $ImagesDir -Name -ErrorAction SilentlyContinue | Out-File $Log -Append -Encoding utf8
  "=== INDEX SIZE ===" | Out-File $Log -Append -Encoding utf8
  (Get-Item "$Repo\index.html").Length | Out-File $Log -Append -Encoding utf8
  "SUCCESS" | Out-File $Log -Append -Encoding utf8
} catch {
  "ERROR: $_" | Out-File $Log -Append -Encoding utf8
  exit 1
}