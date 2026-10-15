param([string]$UnityEditorData = 'C:\Program Files\Unity\Hub\Editor\6000.5.6f1\Editor\Data')
$ErrorActionPreference = 'Stop'
$unityRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $unityRoot
$verificationRoot = Join-Path $workspaceRoot 'work\csharp-verification'
New-Item -ItemType Directory -Force $verificationRoot | Out-Null
# Direct Roslyn + NUnitLite runner avoids NuGet's user-profile configuration and all Unity IPC.
foreach ($packageName in @('nunit','nunitlite')) {
  $packageFolder = Join-Path $verificationRoot $packageName
  $zipPath = Join-Path $verificationRoot ($packageName + '.zip')
  if (-not (Test-Path -LiteralPath $packageFolder)) {
    Invoke-WebRequest -Uri "https://api.nuget.org/v3-flatcontainer/$packageName/3.14.0/$packageName.3.14.0.nupkg" -OutFile $zipPath
    Expand-Archive -LiteralPath $zipPath -DestinationPath $packageFolder
  }
}
$jsonPackage = Get-ChildItem -LiteralPath (Join-Path $unityRoot 'Library\PackageCache') -Directory | Where-Object Name -Like 'com.unity.nuget.newtonsoft-json*' | Select-Object -First 1
if (-not $jsonPackage) { throw 'Resolve Unity packages first for the actual Unity Newtonsoft.Json assembly.' }
$jsonAssembly = Join-Path $jsonPackage.FullName 'Runtime\Newtonsoft.Json.dll'
$frameworkAssembly = Join-Path $verificationRoot 'nunit\lib\netstandard2.0\nunit.framework.dll'
$runnerAssembly = Join-Path $verificationRoot 'nunitlite\lib\net7.0\nunitlite.dll'
if (-not (Test-Path -LiteralPath $runnerAssembly)) { $runnerAssembly = Join-Path $verificationRoot 'nunitlite\lib\net6.0\nunitlite.dll' }
if (-not (Test-Path -LiteralPath $runnerAssembly)) { $runnerAssembly = Join-Path $verificationRoot 'nunitlite\lib\netstandard2.0\nunitlite.dll' }
$sdkRoot = Join-Path $UnityEditorData 'DotNetSdk'
$sdkVersion = Get-ChildItem -LiteralPath (Join-Path $sdkRoot 'sdk') -Directory | Sort-Object Name -Descending | Select-Object -First 1
$referenceVersion = Get-ChildItem -LiteralPath (Join-Path $sdkRoot 'packs\Microsoft.NETCore.App.Ref') -Directory | Sort-Object Name -Descending | Select-Object -First 1
$references = Get-ChildItem -LiteralPath (Join-Path $referenceVersion.FullName 'ref\net8.0') -Filter '*.dll'
$sourceRoot = Join-Path $unityRoot 'Assets\AdaptiveSpatialLabs'
$sources = @()
foreach ($domain in @('Core','Models')) { $sources += Get-ChildItem -LiteralPath (Join-Path $sourceRoot $domain) -Recurse -Filter '*.cs' | Where-Object Name -NE 'ApiConfiguration.cs' }
$sources += Get-Item -LiteralPath (Join-Path $sourceRoot 'Services\Api\ApiClient.cs')
foreach ($folder in @('Services\Session','Services\Storage')) { $sources += Get-ChildItem -LiteralPath (Join-Path $sourceRoot $folder) -Filter '*.cs' }
foreach ($test in @('RouterTests','DraftStateTests','DtoContractTests','SessionStateTests','ApiClientTests')) { $sources += Get-Item -LiteralPath (Join-Path $sourceRoot "Tests\EditMode\$test.cs") }
$sources += Get-Item -LiteralPath (Join-Path $PSScriptRoot 'CoreVerification\StandaloneRunner.cs')
$outputAssembly = Join-Path $verificationRoot 'CoreVerification.dll'
$responseLines = @('/nologo','/target:exe','/langversion:9.0',"/out:`"$outputAssembly`"")
foreach ($reference in ($references.FullName + @($jsonAssembly,$frameworkAssembly,$runnerAssembly))) { $responseLines += "/reference:`"$reference`"" }
foreach ($source in $sources) { $responseLines += '"' + $source.FullName + '"' }
$responseFile = Join-Path $verificationRoot 'compile.rsp'
$responseLines | Set-Content -LiteralPath $responseFile -Encoding utf8
$dotnet = Join-Path $sdkRoot 'dotnet.exe'
& $dotnet (Join-Path $sdkVersion.FullName 'Roslyn\bincore\csc.dll') "@$responseFile"
if ($LASTEXITCODE -ne 0) { throw 'Core C# compilation failed' }
Copy-Item -LiteralPath $frameworkAssembly,$runnerAssembly,$jsonAssembly -Destination $verificationRoot -Force
'{"runtimeOptions":{"tfm":"net8.0","framework":{"name":"Microsoft.NETCore.App","version":"8.0.0"}}}' | Set-Content -LiteralPath (Join-Path $verificationRoot 'CoreVerification.runtimeconfig.json') -Encoding utf8
$results = Join-Path $workspaceRoot 'outputs\frontend-core-test-results.xml'
& $dotnet $outputAssembly "--result=$results" --workers=0
if ($LASTEXITCODE -ne 0) { throw 'Core C# tests failed' }
