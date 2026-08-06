$ErrorActionPreference = "Continue"

$testFile = "test\nebula_vs0\nebula_vs1_golden_visual_proof_test.dart"
$goldenDir = "docs\patch_safety\nebula_vs1_fix1_golden_screenshots_20260806150500"
$outDir = "docs\patch_safety\nebula_vs1_fix1_visual_runner_20260806150500"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$screens = @(
  @{ name = "01_mission_landing_mobile.png"; width = 393; height = 873 },
  @{ name = "02_physics_syllabus_mobile.png"; width = 393; height = 873 },
  @{ name = "03_chemistry_syllabus_mobile.png"; width = 393; height = 873 },
  @{ name = "04_mathematics_syllabus_mobile.png"; width = 393; height = 873 },
  @{ name = "05_atomic_topic_detail_mobile.png"; width = 393; height = 873 },
  @{ name = "06_crucible_overview_mobile.png"; width = 393; height = 873 },
  @{ name = "07_phase_detail_mobile.png"; width = 393; height = 873 },
  @{ name = "08_schedule_detail_mobile.png"; width = 393; height = 873 },
  @{ name = "09_rebuild_windows_mobile.png"; width = 393; height = 873 },
  @{ name = "10_macro_test_not_ready_mobile.png"; width = 393; height = 873 },
  @{ name = "11_major_test_not_ready_mobile.png"; width = 393; height = 873 },
  @{ name = "12_digibook_overview_mobile.png"; width = 393; height = 873 },
  @{ name = "13_concept_reader_mobile.png"; width = 393; height = 873 },
  @{ name = "14_formula_register_mobile.png"; width = 393; height = 873 },
  @{ name = "15_common_misconceptions_mobile.png"; width = 393; height = 873 },
  @{ name = "16_worked_example_mobile.png"; width = 393; height = 873 },
  @{ name = "17_self_check_mobile.png"; width = 393; height = 873 },
  @{ name = "18_assessment_preview_mobile.png"; width = 393; height = 873 },
  @{ name = "19_coming_soon_content_mobile.png"; width = 393; height = 873 },
  @{ name = "20_access_denied_state.png"; width = 393; height = 873 },
  @{ name = "21_fallback_360_mission.png"; width = 360; height = 800 },
  @{ name = "22_fallback_412_formula.png"; width = 412; height = 915 },
  @{ name = "23_fallback_1366_crucible.png"; width = 1366; height = 768 }
)

Add-Type -AssemblyName System.Drawing
$results = @()
foreach ($screen in $screens) {
  $testName = "VS1 Golden $($screen.name)"
  $pngPath = Join-Path $goldenDir $screen.name
  $logPath = Join-Path $outDir "$($screen.name).log.txt"
  $errPath = Join-Path $outDir "$($screen.name).err.txt"
  $start = Get-Date
  $flutterArgs = @("test", $testFile, "--update-goldens", "--plain-name", $testName, "--timeout", "35s", "--reporter", "compact", "--no-pub")
  & flutter @flutterArgs *> $logPath
  $exitCode = $LASTEXITCODE
  $end = Get-Date
  $exists = Test-Path $pngPath
  $length = 0
  $width = 0
  $height = 0
  $dimensionsOk = $false
  if ($exists) {
    $item = Get-Item $pngPath
    $length = $item.Length
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
  $log = ""
  if (Test-Path $logPath) {
    $log += Get-Content -Raw $logPath
  }
  if (Test-Path $errPath) {
    $log += "`n"
    $log += Get-Content -Raw $errPath
  }
  $flutterException = ($log -match "EXCEPTION CAUGHT" -or $log -match "TestFailure" -or $log -match "FAILED" -or $log -match "Failed to load" -or $log -match "Some tests failed")
  $logBackedPass = ($log -match "All tests passed!" -and -not $flutterException)
  if (($null -eq $exitCode -or $exitCode -eq "") -and $logBackedPass) {
    $exitCode = 0
  }
  $exitOk = ($exitCode -eq 0 -or $logBackedPass)
  $result = if ($exitOk -and $exists -and $length -gt 0 -and $dimensionsOk -and -not $flutterException) { "PASS" } else { "FAIL" }
  $results += [PSCustomObject]@{
    screen = $screen.name
    testName = $testName
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
    flutterException = $flutterException
    result = $result
    logPath = $logPath
  }
}

$summary = [PSCustomObject]@{
  generatedAt = (Get-Date).ToString("o")
  testFile = $testFile
  goldenDir = $goldenDir
  total = $results.Count
  pass = @($results | Where-Object { $_.result -eq "PASS" }).Count
  fail = @($results | Where-Object { $_.result -ne "PASS" }).Count
  results = $results
}

$summary | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 (Join-Path $outDir "matrix.json")
$md = @("# NEBULA VS1 FIX1 Visual Golden Matrix", "", "Total: $($summary.total)", "PASS: $($summary.pass)", "FAIL: $($summary.fail)", "", "| Screen | Exit | PNG | Dimensions | Result |", "|---|---:|---:|---|---|")
foreach ($r in $results) {
  $md += "| $($r.screen) | $($r.exitCode) | $($r.pngBytes) | $($r.width)x$($r.height) | $($r.result) |"
}
$md | Set-Content -Encoding UTF8 (Join-Path $outDir "matrix.md")
$summary









