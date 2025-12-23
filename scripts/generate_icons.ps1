$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot '..\public\icon-new.png'
$outDir = Join-Path $PSScriptRoot '..\public\icons'

if (!(Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

function Resize-Png {
  param(
    [int]$Size,
    [string]$Dest
  )

  $img = [System.Drawing.Image]::FromFile($src)
  try {
    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    try {
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      try {
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.Clear([System.Drawing.Color]::Transparent)
        $g.DrawImage($img, 0, 0, $Size, $Size)
        $bmp.Save($Dest, [System.Drawing.Imaging.ImageFormat]::Png)
      } finally {
        $g.Dispose()
      }
    } finally {
      $bmp.Dispose()
    }
  } finally {
    $img.Dispose()
  }
}

Resize-Png -Size 192 -Dest (Join-Path $outDir 'icon-192x192.png')
Resize-Png -Size 512 -Dest (Join-Path $outDir 'icon-512x512.png')

Get-Item (Join-Path $outDir 'icon-192x192.png'), (Join-Path $outDir 'icon-512x512.png') |
  Select-Object FullName, Length


