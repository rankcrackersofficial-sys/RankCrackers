$ErrorActionPreference = "Continue"

$testFile = "test\nebula_vs0\nebula_vs1_golden_visual_proof_test.dart"
$goldenDir = "docs\patch_safety\nebula_vs1_fix5_hierarchy_integrity_screenshots_20260807170000"
$outDir = "docs\patch_safety\nebula_vs1_fix5_hierarchy_visual_runner_20260807170000"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
New-Item -ItemType Directory -Force -Path $goldenDir | Out-Null

$screens = @(
  @{ name = "01_mission_landing_mobile.png"; width = 393; height = 873; marker = "JEE Main 2027" },
  @{ name = "02_physics_syllabus_mobile.png"; width = 393; height = 873; marker = "Physics (165)" },
  @{ name = "03_chemistry_syllabus_mobile.png"; width = 393; height = 873; marker = "Chemistry (160)" },
  @{ name = "04_mathematics_syllabus_mobile.png"; width = 393; height = 873; marker = "Mathematics (92)" },
  @{ name = "05_atomic_topic_detail_mobile.png"; width = 393; height = 873; marker = "Atomic Topic Detail" },
  @{ name = "06_crucible_overview_mobile.png"; width = 393; height = 873; marker = "7-phase structure" },
  @{ name = "07_phase_detail_mobile.png"; width = 393; height = 873; marker = "Phase Detail" },
  @{ name = "08_schedule_detail_mobile.png"; width = 393; height = 873; marker = "Schedule Detail" },
  @{ name = "09_rebuild_windows_mobile.png"; width = 393; height = 873; marker = "Revision Window 7" },
  @{ name = "10_macro_test_not_ready_mobile.png"; width = 393; height = 873; marker = "Macro Test - Phase 1 Review" },
  @{ name = "11_major_test_not_ready_mobile.png"; width = 393; height = 873; marker = "Major Test - Full Mission Review" },
  @{ name = "12_digibook_overview_mobile.png"; width = 393; height = 873; marker = "Mechanics Foundations" },
  @{ name = "13_concept_reader_mobile.png"; width = 393; height = 873; marker = "Classical Mechanics" },
  @{ name = "14_formula_register_mobile.png"; width = 393; height = 873; marker = "Formula Register" },
  @{ name = "15_common_misconceptions_mobile.png"; width = 393; height = 873; marker = "Common Misconceptions" },
  @{ name = "16_worked_example_mobile.png"; width = 393; height = 873; marker = "Worked Examples" },
  @{ name = "17_self_check_mobile.png"; width = 393; height = 873; marker = "Reveal explanation" },
  @{ name = "18_assessment_preview_mobile.png"; width = 393; height = 873; marker = "INTERNAL ASSESSMENT PREVIEW" },
  @{ name = "19_coming_soon_content_mobile.png"; width = 393; height = 873; marker = "Content Being Prepared" },
  @{ name = "20_access_denied_state.png"; width = 393; height = 873; marker = "Access Denied" },
  @{ name = "21_fallback_360_mission.png"; width = 360; height = 800; marker = "JEE Main 2027" },
  @{ name = "22_fallback_412_formula.png"; width = 412; height = 915; marker = "Formula Register" },
  @{ name = "23_fallback_1366_crucible.png"; width = 1366; height = 768; marker = "Revision Window 7" }
)

Add-Type -AssemblyName System.Drawing
$results = @()
foreach ($screen in $screens) {
  $testName = "VS1 FIX5 Golden $($screen.name)"
  $pngPath = Join-Path $goldenDir $screen.name
  $logPath = Join-Path $outDir "$($screen.name).log.txt"
  $start = Get-Date
  $flutterArgs = @("test", $testFile, "--update-goldens", "--plain-name", $testName, "--timeout", "45s", "--reporter", "compact", "--no-pub")
  & flutter @flutterArgs *> $logPath
  $exitCode = $LASTEXITCODE
  $end = Get-Date
  $exists = Test-Path $pngPath
  $length = 0
  $width = 0
  $height = 0
  $dimensionsOk = $false
  $sha256 = ""
  if ($exists) {
    $item = Get-Item $pngPath
    $length = $item.Length
    $sha256 = (Get-FileHash -Algorithm SHA256 $item.FullName).Hash
    try {
      $bmp = [System.Drawing.Bitmap]::new($item.FullName)
      $width = $bmp.Width
      $height = $bmp.Height
      $dimensionsOk = ($width -eq [int]$screen.width -and $height -eq [int]$screen.height)
      $bmp.Dispose()
    } catch {
      $dimensionsOk = $false
    }
  }
  $log = Get-Content -Raw $logPath
  $flutterException = ($log -match "EXCEPTION CAUGHT" -or $log -match "TestFailure" -or $log -match "FAILED" -or $log -match "Failed to load" -or $log -match "Some tests failed")
  $markerAssertion = ($log -match "All tests passed!" -and -not $flutterException)
  $result = if ($exitCode -eq 0 -and $markerAssertion -and $exists -and $length -gt 0 -and $dimensionsOk -and -not $flutterException) { "PASS" } else { "FAIL" }
  $results += [PSCustomObject]@{
    screen = $screen.name
    testName = $testName
    expectedMarker = $screen.marker
    markerAssertion = if ($markerAssertion) { "PASS" } else { "FAIL" }
    exitCode = $exitCode
    durationSeconds = [math]::Round(($end - $start).TotalSeconds, 2)
    pngPath = $pngPath
    pngExists = $exists
    pngBytes = $length
    width = $width
    height = $height
    expectedWidth = [int]$screen.width
    expectedHeight = [int]$screen.height
    dimensionsOk = $dimensionsOk
    sha256 = $sha256
    flutterException = $flutterException
    timeout = ($exitCode -eq 124)
    result = $result
    logPath = $logPath
  }
}

$duplicateGroups = @($results | Where-Object { $_.sha256 } | Group-Object sha256 | Where-Object { $_.Count -gt 1 } | ForEach-Object {
  [PSCustomObject]@{ sha256 = $_.Name; count = $_.Count; screens = @($_.Group | Select-Object -ExpandProperty screen) }
})

if ($duplicateGroups.Count -gt 0) {
  $duplicateNames = @($duplicateGroups | ForEach-Object { $_.screens })
  foreach ($r in $results) {
    if ($duplicateNames -contains $r.screen) {
      $r.result = "FAIL_DUPLICATE_HASH"
    }
  }
}

$summary = [PSCustomObject]@{
  generatedAt = (Get-Date).ToString("o")
  testFile = $testFile
  goldenDir = $goldenDir
  total = $results.Count
  pass = @($results | Where-Object { $_.result -eq "PASS" }).Count
  fail = @($results | Where-Object { $_.result -ne "PASS" }).Count
  unexpectedDuplicateHashGroups = $duplicateGroups.Count
  duplicateGroups = $duplicateGroups
  results = $results
}

$summary | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 (Join-Path $outDir "matrix.json")
$md = @("# NEBULA VS1 FIX5 Hierarchy Integrity Matrix", "", "Total: $($summary.total)", "PASS: $($summary.pass)", "FAIL: $($summary.fail)", "Unexpected duplicate hash groups: $($summary.unexpectedDuplicateHashGroups)", "", "| Screen | Marker | Exit | PNG | Dimensions | SHA-256 | Result |", "|---|---|---:|---:|---|---|---|")
foreach ($r in $results) {
  $shortHash = if ($r.sha256) { $r.sha256.Substring(0, 12) } else { "" }
  $md += "| $($r.screen) | $($r.expectedMarker) | $($r.exitCode) | $($r.pngBytes) | $($r.width)x$($r.height) | $shortHash | $($r.result) |"
}
if ($duplicateGroups.Count -gt 0) {
  $md += ""
  $md += "## Duplicate Hash Groups"
  foreach ($g in $duplicateGroups) {
    $md += "- $($g.sha256): $($g.screens -join ', ')"
  }
}
$md | Set-Content -Encoding UTF8 (Join-Path $outDir "matrix.md")
$summary
