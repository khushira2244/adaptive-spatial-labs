param([string]$Editor = 'C:\Program Files\Unity\Hub\Editor\6000.5.6f1\Editor\Unity.exe')
$ErrorActionPreference = 'Stop'
$unityRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $unityRoot
$buildLog = Join-Path $workspaceRoot 'work\unity-foundation-build.log'
$testLog = Join-Path $workspaceRoot 'work\unity-editmode-tests.log'
$testResults = Join-Path $workspaceRoot 'outputs\frontend-unity-editmode-results.xml'
function Invoke-UnityRun([string]$arguments) {
  $unityProcess = Start-Process -FilePath $Editor -ArgumentList $arguments -WindowStyle Hidden -PassThru
  $deadline = [DateTime]::UtcNow.AddMinutes(8)
  while (-not $unityProcess.WaitForExit(30000)) {
    if ([DateTime]::UtcNow -ge $deadline) { $unityProcess.Kill(); throw 'Unity timed out. Inspect the project log for licensing/compiler IPC failures; run this script from a normal Windows terminal if the sandbox blocks Unity.' }
  }
  if ($unityProcess.ExitCode -ne 0) { throw "Unity failed with exit code $($unityProcess.ExitCode). Inspect its log." }
}
Invoke-UnityRun "-batchmode -nographics -projectPath `"$unityRoot`" -executeMethod AdaptiveSpatialLabs.Editor.FoundationBuilder.Build -quit -logFile `"$buildLog`""
Invoke-UnityRun "-batchmode -nographics -projectPath `"$unityRoot`" -runTests -testPlatform EditMode -testResults `"$testResults`" -logFile `"$testLog`""
if (-not (Test-Path -LiteralPath $testResults)) { throw 'Unity did not write an EditMode result file.' }
[xml]$result = Get-Content -LiteralPath $testResults -Raw
if ($result.'test-run'.result -ne 'Passed') { throw 'Unity EditMode tests did not all pass.' }
Write-Output "Unity EditMode verification passed: $($result.'test-run'.passed) tests."
