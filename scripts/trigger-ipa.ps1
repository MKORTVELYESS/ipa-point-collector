# Dispatch "Submit IPA ratings" on GitHub so the self-hosted runner on this PC picks it up.
# Intended to run at logon/startup (see register-startup.ps1).
#
# Requires a PAT with workflow scope (classic: "workflow", or fine-grained: Actions read/write).
#   setx IPA_GH_TOKEN "ghp_..."
# Repo defaults to this project; override with IPA_GH_REPO / IPA_GH_WORKFLOW / IPA_GH_REF.

$ErrorActionPreference = "Stop"

$token = $env:IPA_GH_TOKEN
if ([string]::IsNullOrWhiteSpace($token)) { $token = $env:GH_TOKEN }
if ([string]::IsNullOrWhiteSpace($token)) {
  throw "Set IPA_GH_TOKEN (or GH_TOKEN) to a GitHub PAT that can dispatch workflows."
}

$repo = if ($env:IPA_GH_REPO) { $env:IPA_GH_REPO } else { "MKORTVELYESS/ipa-point-collector" }
$workflow = if ($env:IPA_GH_WORKFLOW) { $env:IPA_GH_WORKFLOW } else { "submit-ipa.yml" }
$ref = if ($env:IPA_GH_REF) { $env:IPA_GH_REF } else { "main" }

# Give the Actions runner service time to connect after boot/logon
$delaySec = if ($env:IPA_GH_BOOT_DELAY_SEC) { [int]$env:IPA_GH_BOOT_DELAY_SEC } else { 90 }
Write-Host "Waiting $delaySec s for self-hosted runner to come online..."
Start-Sleep -Seconds $delaySec

$uri = "https://api.github.com/repos/$repo/actions/workflows/$workflow/dispatches"
$headers = @{
  Accept                 = "application/vnd.github+json"
  Authorization          = "Bearer $token"
  "X-GitHub-Api-Version" = "2022-11-28"
  "User-Agent"           = "ipa-point-collector-boot-trigger"
}
$body = @{ ref = $ref } | ConvertTo-Json

Write-Host "POST $uri (ref=$ref)"
Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $body -ContentType "application/json"
Write-Host "Dispatched workflow '$workflow' on $repo — self-hosted runner should pick it up."
