# Synthesizes each narration line to WAV with the local Windows OneCore voices (offline, no account).
# Usage (from media/): powershell -ExecutionPolicy Bypass -File explainer/tts.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Get-Content "$here\script.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$outDir = Join-Path $here 'audio'
New-Item -ItemType Directory -Force $outDir | Out-Null

# WinRT interop from Windows PowerShell 5.1
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]
function Await($op, [Type]$type) {
  $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
  $t.Wait() | Out-Null
  $t.Result
}

$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$all = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices

foreach ($line in $script.lines) {
  $voiceName = $script.voices.($line.voice)
  $voice = $all | Where-Object { $_.DisplayName -like "*$voiceName*" } | Select-Object -First 1
  if (-not $voice) { throw "Voice $voiceName not installed" }
  $synth.Voice = $voice
  $text = [System.Security.SecurityElement]::Escape($line.text)
  # Say the product name the way it's meant: "aa-vaaz form".
  $text = $text -replace 'AwaazForm', '<sub alias="Aavaaz form">AwaazForm</sub>'
  $rate = '1.0'
  # OneCore voices largely ignore SSML prosody rate; the synthesizer option works.
  $synth.Options.SpeakingRate = if ($line.voice -eq 'user') { 0.95 } else { 1.2 }
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='$($voice.Language)'><prosody rate='$rate'>$text</prosody></speak>"
  $stream = Await ($synth.SynthesizeSsmlToStreamAsync($ssml)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  $size = [uint32]$stream.Size
  Await ($reader.LoadAsync($size)) ([uint32]) | Out-Null
  $bytes = New-Object byte[] $size
  $reader.ReadBytes($bytes)
  [System.IO.File]::WriteAllBytes((Join-Path $outDir "$($line.id).wav"), $bytes)
  Write-Output ("{0,-10} {1,-6} {2} bytes" -f $line.id, $voiceName, $size)
}


