# ipa-point-collector

Minimal Java CLI that logs into [egeszsegkonyha.hu](https://egeszsegkonyha.hu/), finds open IPA meal rating forms, rates every dish as **3 stars (good)**, and submits them over plain HTTP (no browser).

## Requirements

- JDK 17+
- Maven 3.9+

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
java -jar target/ipa-point-collector-1.0.0.jar --rating 3
```

Credentials can also be passed as `--username` / `--password`, or via `IPA_USERNAME` / `IPA_PASSWORD`.

## GitHub Actions

1. Add repository secrets:
   - `EK_USERNAME`
   - `EK_PASSWORD`
2. Run **Actions → Submit IPA ratings → Run workflow**, or wait for the weekday schedule.

## How it works

1. GET homepage + CSRF token (`marketingakcio.formToken`)
2. AJAX login (`POST /index.php` with `X-IAL-Login: 1`)
3. GET `/index.php/etlapunk?ipakerdoivek` and collect `ertekelolap=…` links
4. For each form: GET page, parse survey fields, set every `ipa_answer_food[*]=3`, POST submit
