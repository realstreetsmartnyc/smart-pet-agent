param(
  [string]$BuildDir = "apps/electron/build"
)

$ErrorActionPreference = "Stop"

$installer = Get-ChildItem -Path $BuildDir -Filter "*.exe" -File |
  Where-Object { $_.Name -notmatch "uninstaller|uninstall" } |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $installer) {
  throw "No NSIS installer exe found in $BuildDir"
}

if ($installer.Length -lt 50MB) {
  throw "NSIS installer is unexpectedly small: $($installer.FullName) $($installer.Length) bytes"
}

$unpackedExe = Join-Path $BuildDir "win-unpacked/Smart Pet Agent.exe"
if (-not (Test-Path $unpackedExe)) {
  throw "win-unpacked executable missing: $unpackedExe"
}

$icon = "apps/electron/assets/icon.ico"
if (-not (Test-Path $icon)) {
  throw "Windows icon missing: $icon"
}

Write-Output "windows nsis artifact OK: $($installer.FullName)"
Write-Output "windows unpacked executable OK: $unpackedExe"
