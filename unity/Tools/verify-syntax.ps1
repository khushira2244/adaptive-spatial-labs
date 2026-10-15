param([string]$UnityEditorData = 'C:\Program Files\Unity\Hub\Editor\6000.5.6f1\Editor\Data')
$ErrorActionPreference = 'Stop'
$unityRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $unityRoot
$outputRoot = Join-Path $workspaceRoot 'work\csharp-syntax'
New-Item -ItemType Directory -Force $outputRoot | Out-Null
$sdkRoot = Join-Path $UnityEditorData 'DotNetSdk'
$sdkVersion = Get-ChildItem -LiteralPath (Join-Path $sdkRoot 'sdk') -Directory | Sort-Object Name -Descending | Select-Object -First 1
$referenceVersion = Get-ChildItem -LiteralPath (Join-Path $sdkRoot 'packs\Microsoft.NETCore.App.Ref') -Directory | Sort-Object Name -Descending | Select-Object -First 1
$compilerRoot = Join-Path $sdkVersion.FullName 'Roslyn\bincore'
$roslyn = @((Join-Path $compilerRoot 'Microsoft.CodeAnalysis.dll'), (Join-Path $compilerRoot 'Microsoft.CodeAnalysis.CSharp.dll'))
$references = Get-ChildItem -LiteralPath (Join-Path $referenceVersion.FullName 'ref\net8.0') -Filter '*.dll'
$assembly = Join-Path $outputRoot 'SyntaxRunner.dll'
$lines = @('/nologo','/target:exe',"/out:`"$assembly`"")
foreach ($reference in ($references.FullName + $roslyn)) { $lines += "/reference:`"$reference`"" }
$lines += '"' + (Join-Path $PSScriptRoot 'SyntaxVerification\SyntaxRunner.cs') + '"'
$response = Join-Path $outputRoot 'compile.rsp'
$lines | Set-Content -LiteralPath $response -Encoding utf8
$dotnet = Join-Path $sdkRoot 'dotnet.exe'
& $dotnet (Join-Path $compilerRoot 'csc.dll') "@$response"
if ($LASTEXITCODE -ne 0) { throw 'Syntax checker compilation failed' }
Copy-Item -LiteralPath $roslyn -Destination $outputRoot -Force
'{"runtimeOptions":{"tfm":"net8.0","framework":{"name":"Microsoft.NETCore.App","version":"8.0.0"}}}' | Set-Content -LiteralPath (Join-Path $outputRoot 'SyntaxRunner.runtimeconfig.json') -Encoding utf8
& $dotnet $assembly (Join-Path $unityRoot 'Assets\AdaptiveSpatialLabs')
if ($LASTEXITCODE -ne 0) { throw 'C# syntax validation failed' }
