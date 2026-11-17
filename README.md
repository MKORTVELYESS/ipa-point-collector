# ipa-point-collector

Minimal Java CLI that logs into [egeszsegkonyha.hu](https://egeszsegkonyha.hu/), finds open IPA meal rating forms, rates every dish as **3 stars (good)**, and submits them over plain HTTP (no browser).

## Requirements

- JDK 17+ to compile (JDK 25 recommended to run, matching CI)
- Maven 3.9+ (point `JAVA_HOME` at a JDK that supports `--release 17`)

## Local run

```bash
mvn -q package
export EK_USERNAME='your-username'
export EK_PASSWORD='your-password'
java -jar target/ipa-point-collector-1.0.0.jar
```

Useful flags:

```bash
java -jar target/ipa-point-collector-1.0.0.jar --dry-run
java -jar target/ipa-point-collector-1.0.0.jar --dump-fields
java -jar target/ipa-point-collector-1.0.0.jar --rating 3
```

Credentials can also be passed as `--username` / `--password`, or via `IPA_USERNAME` / `IPA_PASSWORD`.

## GitHub Actions (boot → dispatch → self-hosted)

There is **no schedule**. Flow:

1. You turn the PC on  
2. Local script calls GitHub to `workflow_dispatch`  
3. Job runs on the **self-hosted** runner on that same PC (home IP → no captcha wall)

### One-time setup

1. **Environment secrets** on GitHub Environment **`prod`**:
   - `EK_USERNAME`
   - `EK_PASSWORD`
2. **Self-hosted runner** on this PC  
   Repo → Settings → Actions → Runners → New self-hosted runner.  
   Prefer installing it as a **Windows service** so it is online at boot.
3. **PAT** that can dispatch workflows (classic scope `workflow`, or fine-grained Actions write).  
   Store as a **user** env var (survives reboots for your account):

   ```powershell
   setx IPA_GH_TOKEN "ghp_..."
   ```

   Open a new terminal after `setx`.
4. **Register logon trigger** (once):

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\register-startup.ps1
   ```

   Or run manually anytime:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\trigger-ipa.ps1
   ```

`trigger-ipa.ps1` waits ~90s for the runner, then `POST`s  
`/repos/.../actions/workflows/submit-ipa.yml/dispatches`.

## How it works

1. GET homepage + CSRF token (`marketingakcio.formToken`)
2. AJAX login (`POST /index.php` with `X-IAL-Login: 1`)
3. GET `/index.php/etlapunk?ipakerdoivek` and collect open `ertekelolap=…` links
4. For each form: GET page, parse survey fields, set every `ipa_answer_food[*]=3`, POST submit
