# Static-export KshetraMap web app and publish to GitHub Pages.
# Requires: gh auth login, git
# Usage: from web/:  powershell -File scripts/deploy-gh-pages.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Repo = if ($env:GH_REPO) { $env:GH_REPO } else { "karmacodemeta/kshetramap" }
$Base = if ($env:GH_PAGES_BASE) { $env:GH_PAGES_BASE } else { "kshetramap" }

Write-Host "==> Static export for GitHub Pages ($Repo, base=/$Base)"
$env:GH_PAGES_BASE = $Base
npm run build:static
if ($LASTEXITCODE -ne 0) { throw "build:static failed" }

# .nojekyll so Next _next assets are served
New-Item -ItemType File -Path "out\.nojekyll" -Force | Out-Null

# Ensure remote repo exists
$remoteOk = $false
try {
  $null = git remote get-url origin 2>$null
  if ($LASTEXITCODE -eq 0) { $remoteOk = $true }
} catch {
  $remoteOk = $false
}

if (-not $remoteOk) {
  Write-Host "    ensuring GitHub repo $Repo exists..."
  gh repo view $Repo 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) {
    gh repo create $Repo --public --description "KshetraMap Mokama AC-178 booth map" 2>&1 | Out-Null
  }
  # origin may not exist yet; ignore remove errors
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  git remote remove origin 2>&1 | Out-Null
  $ErrorActionPreference = $prevEap
  git remote add origin "https://github.com/$Repo.git"
}

Write-Host "    publishing out/ to gh-pages..."
$tmp = Join-Path $env:TEMP "kshetramap-gh-pages"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
New-Item -ItemType Directory -Path $tmp | Out-Null
Copy-Item -Recurse -Force "out\*" $tmp\

Push-Location $tmp
try {
  git init -b gh-pages | Out-Null
  git add -A
  git -c user.email="kshetramap@local" -c user.name="KshetraMap Deploy" commit -m "deploy: static KshetraMap history + places" | Out-Null
  git remote add origin "https://github.com/$Repo.git"
  git push -f origin gh-pages
  if ($LASTEXITCODE -ne 0) { throw "git push gh-pages failed" }
} finally {
  Pop-Location
}

$owner = ($Repo -split "/")[0]
$live = "https://$owner.github.io/$Base/ac/178/"
$hist = "https://$owner.github.io/$Base/ac/178/history/"

Write-Host ""
Write-Host "Done. Pages branch: gh-pages (root)"
Write-Host "Map:     $live"
Write-Host "History: $hist"
