param(
  [string]$BaseUrl,
  [int]$TimeoutSec = 600
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"

if (-not (Test-Path $envFile)) {
  Write-Error ".env.local was not found in the project root."
  exit 1
}

$envContent = Get-Content $envFile

function Get-EnvValue([string]$Key) {
  $line = $envContent | Where-Object { $_ -match "^${Key}=" } | Select-Object -First 1

  if (-not $line) {
    return ""
  }

  return ($line -replace "^${Key}=", "").Trim().Trim('"')
}

$token = Get-EnvValue "DISCOVERY_CRON_TOKEN"

if (-not $token) {
  Write-Error "DISCOVERY_CRON_TOKEN is missing or empty in .env.local."
  exit 1
}

$configuredBaseUrl = $BaseUrl

if (-not $configuredBaseUrl) {
  $configuredBaseUrl = Get-EnvValue "APP_URL"
}

if (-not $configuredBaseUrl) {
  $configuredBaseUrl = Get-EnvValue "NEXT_PUBLIC_APP_URL"
}

if (-not $configuredBaseUrl) {
  $port = Get-EnvValue "PORT"

  if (-not $port) {
    $port = "3000"
  }

  $configuredBaseUrl = "http://localhost:$port"
}

$configuredBaseUrl = $configuredBaseUrl.TrimEnd("/")
$url = "$configuredBaseUrl/api/discovery/run?token=$token"

Write-Host "Triggering hidden discovery at $configuredBaseUrl"
Write-Host "This crawl can take several minutes."

try {
  $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec $TimeoutSec -UseBasicParsing
  $response.Content
} catch {
  if ($_.Exception.Response) {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $statusDescription = $_.Exception.Response.StatusDescription
    Write-Error "Hidden discovery request failed with HTTP $statusCode $statusDescription"

    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.BaseStream.Position = 0
    $reader.DiscardBufferedData()
    $body = $reader.ReadToEnd()

    if ($body) {
      Write-Host $body
    }

    exit 1
  }

  Write-Error "Failed to trigger hidden discovery at $url. Ensure the dev server is running, the token matches, and the request has enough time to complete."
  Write-Host $_.Exception.Message
  exit 1
}
