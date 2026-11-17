package hu.egeszsegkonyha.ipa;

import java.io.IOException;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Minimal HTTP-only CLI: log in to egeszsegkonyha.hu, find open IPA rating forms,
 * rate every food item as 3 (good), and submit.
 */
public final class IpaPointCollector {

  private static final String BASE = "https://egeszsegkonyha.hu";
  private static final String HOME = BASE + "/";
  private static final String LOGIN_ACTION = BASE + "/index.php";
  private static final String TOKEN_URL =
      BASE + "/index.php?option=com_etlap&task=marketingakcio.formToken";
  private static final String IPA_LIST = BASE + "/index.php/etlapunk?ipakerdoivek";
  private static final String USER_AGENT =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
          + "Chrome/120.0.0.0 Safari/537.36";

  private static final Pattern HIDDEN_TOKEN =
      Pattern.compile(
          "<input[^>]*type=[\"']hidden[\"'][^>]*name=[\"']([a-f0-9]{32})[\"'][^>]*value=[\"']1[\"'][^>]*/?>",
          Pattern.CASE_INSENSITIVE);
  private static final Pattern HIDDEN_TOKEN_ALT =
      Pattern.compile(
          "<input[^>]*name=[\"']([a-f0-9]{32})[\"'][^>]*type=[\"']hidden[\"'][^>]*value=[\"']1[\"'][^>]*/?>",
          Pattern.CASE_INSENSITIVE);
  private static final Pattern JSON_TOKEN =
      Pattern.compile("\"token\"\\s*:\\s*\"([a-f0-9]{32})\"");
  private static final Pattern JOOMLA_CSRF_TOKEN =
      Pattern.compile("\"csrf\\.token\"\\s*:\\s*\"([a-f0-9]{32})\"");
  private static final Pattern RATING_LINK =
      Pattern.compile(
          "href=[\"']([^\"']*ertekelolap=[a-f0-9]+[^\"']*)[\"']",
          Pattern.CASE_INSENSITIVE);
  /** Single table row — must not span rows (DOTALL across rows paired wrong links with close icons). */
  private static final Pattern TABLE_ROW =
      Pattern.compile("<tr\\b[^>]*>(.*?)</tr>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
  private static final Pattern JSON_REDIRECT =
      Pattern.compile("\"redirect\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
  private static final Pattern JSON_ERROR =
      Pattern.compile("\"error\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
  private static final Pattern INPUT_TAG =
      Pattern.compile("<input\\b([^>]*)/?>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
  private static final Pattern TEXTAREA_TAG =
      Pattern.compile(
          "<textarea\\b([^>]*)>(.*?)</textarea>",
          Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
  private static final Pattern ATTR =
      Pattern.compile("([a-zA-Z_:][\\w:.-]*)\\s*=\\s*([\"'])(.*?)\\2", Pattern.DOTALL);
  private static final Pattern SELECT_TAG =
      Pattern.compile(
          "<select\\b([^>]*)>(.*?)</select>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
  private static final Pattern OPTION_SELECTED =
      Pattern.compile(
          "<option\\b([^>]*\\bselected\\b[^>]*)>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
  private static final Pattern OPTION_VALUE =
      Pattern.compile("value\\s*=\\s*([\"'])(.*?)\\1", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);

  private final HttpClient client;
  private final boolean dryRun;
  private final boolean dumpFields;
  private final int rating;

  private IpaPointCollector(HttpClient client, boolean dryRun, boolean dumpFields, int rating) {
    this.client = client;
    this.dryRun = dryRun;
    this.dumpFields = dumpFields;
    this.rating = rating;
  }

  public static void main(String[] args) throws Exception {
    Args parsed = Args.parse(args);
    String username = firstNonBlank(parsed.username, env("EK_USERNAME"), env("IPA_USERNAME"));
    String password = firstNonBlank(parsed.password, env("EK_PASSWORD"), env("IPA_PASSWORD"));
    if (isBlank(username) || isBlank(password)) {
      System.err.println(
          "Missing credentials. Set EK_USERNAME/EK_PASSWORD (or pass --username/--password).");
      System.exit(2);
    }

    CookieManager cookies = new CookieManager();
    cookies.setCookiePolicy(CookiePolicy.ACCEPT_ALL);
    HttpClient http =
        HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(30))
            .cookieHandler(cookies)
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    IpaPointCollector app =
        new IpaPointCollector(http, parsed.dryRun, parsed.dumpFields, parsed.rating);
    int exit = app.run(username, password);
    System.exit(exit);
  }

  private int run(String username, String password) throws IOException, InterruptedException {
    log("Fetching homepage…");
    String homeHtml = get(HOME);

    log("Refreshing CSRF token…");
    String token = fetchCsrfToken(homeHtml);

    log("Logging in as " + username + "…");
    login(username, password, token, homeHtml);

    log("Listing open IPA forms…");
    String listHtml = get(IPA_LIST);
    if (!looksLoggedIn(listHtml)) {
      throw new IllegalStateException(
          "IPA list page is not a logged-in session (missing logged_in / isGuest:0). "
              + "Login cookies were not accepted.");
    }
    List<String> forms = discoverRatingUrls(listHtml);
    if (forms.isEmpty()) {
      int anyLinks = countMatches(RATING_LINK, listHtml);
      boolean hasContainer = listHtml.contains("ipa-kerdoivek-container");
      log(
          "No open IPA rating forms found."
              + " (kitoltheto-container="
              + hasContainer
              + ", ertekelolap-links="
              + anyLinks
              + "; open = Kitölthető row with close icon)");
      return 0;
    }
    log("Found " + forms.size() + " form(s).");

    int ok = 0;
    int failed = 0;
    for (String formUrl : forms) {
      try {
        log("Processing " + formUrl);
        submitRating(formUrl);
        ok++;
      } catch (Exception e) {
        failed++;
        System.err.println("FAILED " + formUrl + ": " + e.getMessage());
      }
    }

    log("Done. submitted=" + ok + " failed=" + failed + (dryRun ? " (dry-run)" : ""));
    return failed == 0 ? 0 : 1;
  }

  private String fetchCsrfToken(String homeHtml) throws IOException, InterruptedException {
    Optional<String> fromHome = extractCsrfToken(homeHtml);
    HttpResponse<String> resp =
        client.send(
            requestBuilder(TOKEN_URL)
                .GET()
                .header("Accept", "application/json, text/javascript, */*; q=0.01")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Referer", HOME)
                .build(),
            HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    String tokenBody = resp.body() == null ? "" : resp.body();
    if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
      Matcher m = JSON_TOKEN.matcher(tokenBody);
      if (m.find()) {
        return m.group(1);
      }
    }
    if (fromHome.isPresent()) {
      log("formToken unavailable (HTTP " + resp.statusCode() + "); using homepage CSRF.");
      return fromHome.get();
    }
    throw new IllegalStateException(
        "Could not obtain CSRF token. formToken HTTP "
            + resp.statusCode()
            + " body="
            + truncate(tokenBody.replaceAll("\\s+", " "), 200)
            + "; homepage ialLogin="
            + homeHtml.contains("ialLogin")
            + " csrf.token="
            + JOOMLA_CSRF_TOKEN.matcher(homeHtml).find()
            + " title="
            + extractTitle(homeHtml)
            + " (GitHub-hosted runners are often blocked by the site — use a self-hosted runner)");
  }

  private static Optional<String> extractCsrfToken(String html) {
    Optional<String> hidden = extractHiddenToken(html);
    if (hidden.isPresent()) {
      return hidden;
    }
    Matcher m = JOOMLA_CSRF_TOKEN.matcher(html);
    if (m.find()) {
      return Optional.of(m.group(1));
    }
    return Optional.empty();
  }

  private static String extractTitle(String html) {
    Matcher m =
        Pattern.compile("<title[^>]*>(.*?)</title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL)
            .matcher(html);
    if (!m.find()) {
      return "(none)";
    }
    return truncate(m.group(1).replaceAll("\\s+", " ").trim(), 80);
  }

  private void login(String username, String password, String token, String homeHtml)
      throws IOException, InterruptedException {
    String returnValue =
        extractInputValue(homeHtml, "return")
            .orElse(
                java.util.Base64.getEncoder()
                    .encodeToString(IPA_LIST.getBytes(StandardCharsets.UTF_8)));
    String lang = extractInputValue(homeHtml, "lang").orElse("hu-HU");

    String body = postLogin(username, password, token, returnValue, lang);
    String error = jsonString(body, JSON_ERROR).orElse(null);
    if ("JINVALID_TOKEN".equals(error)) {
      log("CSRF rejected; refreshing token and retrying login…");
      token = fetchCsrfToken(homeHtml);
      body = postLogin(username, password, token, returnValue, lang);
      error = jsonString(body, JSON_ERROR).orElse(null);
    }
    if (error != null && !error.isBlank()) {
      throw new IllegalStateException(
          "Login failed (" + error + "): " + truncate(body.replaceAll("\\s+", " "), 400));
    }
    if (looksLikeLoginFailure(body)) {
      throw new IllegalStateException("Login failed: " + truncate(body.replaceAll("\\s+", " "), 400));
    }

    Optional<String> redirect = jsonString(body, JSON_REDIRECT);
    if (redirect.isEmpty()) {
      throw new IllegalStateException(
          "Login response had no redirect (session likely not created): "
              + truncate(body.replaceAll("\\s+", " "), 400));
    }
    String redirectUrl = htmlDecode(unescapeJson(redirect.get()));
    log("Login OK, following redirect…");
    get(absolutize(redirectUrl));
  }

  private String postLogin(
      String username, String password, String token, String returnValue, String lang)
      throws IOException, InterruptedException {
    Map<String, String> form = new LinkedHashMap<>();
    form.put("username", username);
    form.put("password", password);
    form.put("option", "com_users");
    form.put("task", "user.login");
    form.put("return", returnValue);
    form.put("lang", lang);
    form.put(token, "1");
    form.put("ialCheck", "ialLogin");

    HttpResponse<String> resp =
        client.send(
            requestBuilder(LOGIN_ACTION)
                .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                .header("X-IAL-Login", "1")
                .header("Accept", "application/json, text/javascript, */*; q=0.01")
                .header("X-Requested-With", "XMLHttpRequest")
                .header("Origin", BASE)
                .header("Referer", HOME)
                .POST(HttpRequest.BodyPublishers.ofString(encodeForm(form)))
                .build(),
            HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

    String body = resp.body() == null ? "" : resp.body();
    if (resp.statusCode() >= 400) {
      throw new IllegalStateException("Login HTTP " + resp.statusCode() + ": " + truncate(body, 300));
    }
    // IAL sometimes wraps JSON in an HTML error document; extract trailing object.
    Matcher embedded = Pattern.compile("\\{\\s*\"\\w+\"\\s*:.*\\}\\s*$", Pattern.DOTALL).matcher(body);
    if (embedded.find() && !body.trim().startsWith("{")) {
      return embedded.group();
    }
    return body;
  }

  private static boolean looksLikeLoginFailure(String body) {
    String lower = body.toLowerCase();
    if (lower.contains("\"error\"") || lower.contains("hibás") || lower.contains("invalid")) {
      String err = jsonString(body, JSON_ERROR).orElse("");
      if (err.isBlank() && (lower.contains("\"ok\":true") || lower.contains("\"success\":true"))) {
        return false;
      }
      if (!err.isBlank() && !"null".equalsIgnoreCase(err) && !"false".equalsIgnoreCase(err)) {
        return true;
      }
      if (lower.contains("hibás") || lower.contains("jinvalid")) {
        return true;
      }
    }
    return false;
  }

  private static boolean looksLoggedIn(String html) {
    return html.contains("\"customerState\":\"logged_in\"")
        || html.contains("isGuest: 0")
        || html.contains("isGuest:0");
  }

  private List<String> discoverRatingUrls(String html) {
    Set<String> urls = new LinkedHashSet<>();
    String kitoltheto = extractKitolthetoSection(html);
    Matcher rows = TABLE_ROW.matcher(kitoltheto);
    while (rows.find()) {
      String row = rows.group(1);
      // Open = red close icon in Beküldött column (same row only)
      if (!row.toLowerCase().contains("icon: close") && !row.toLowerCase().contains("icon:close")) {
        continue;
      }
      Matcher link = RATING_LINK.matcher(row);
      if (link.find()) {
        urls.add(absolutize(htmlDecode(link.group(1))));
      }
    }
    return new ArrayList<>(urls);
  }

  /** Prefer the "Kitölthető Kérdőívek" table; fall back to full HTML. */
  private static String extractKitolthetoSection(String html) {
    int start = indexOfIgnoreCase(html, "Kitölthető Kérdőívek");
    if (start < 0) {
      start = indexOfIgnoreCase(html, "Kitolthet");
    }
    if (start < 0) {
      return html;
    }
    int end = indexOfIgnoreCase(html, "Beküldött Kérdőívek", start + 1);
    if (end < 0) {
      end = indexOfIgnoreCase(html, "Bekuldott", start + 1);
    }
    if (end < 0) {
      end = html.length();
    }
    return html.substring(start, end);
  }

  private static int indexOfIgnoreCase(String haystack, String needle) {
    return indexOfIgnoreCase(haystack, needle, 0);
  }

  private static int indexOfIgnoreCase(String haystack, String needle, int fromIndex) {
    return haystack.toLowerCase().indexOf(needle.toLowerCase(), fromIndex);
  }

  private static int countMatches(Pattern p, String s) {
    int n = 0;
    Matcher m = p.matcher(s);
    while (m.find()) {
      n++;
    }
    return n;
  }

  private static Optional<String> jsonString(String body, Pattern pattern) {
    Matcher m = pattern.matcher(body);
    if (!m.find()) {
      return Optional.empty();
    }
    return Optional.of(m.group(1));
  }

  private static String unescapeJson(String s) {
    return s.replace("\\/", "/")
        .replace("\\n", "\n")
        .replace("\\\"", "\"")
        .replace("\\\\", "\\");
  }

  private void submitRating(String formUrl) throws IOException, InterruptedException {
    String html = get(formUrl);
    Map<String, String> fields = parseSurveyFields(html);
    if (fields.isEmpty() || !fields.containsKey("postsurvey")) {
      // Already submitted or not a rating page
      if (!html.contains("ipa_answer_food") && !html.contains("name=\"postsurvey\"")) {
        log("  Skipping (no open survey form).");
        return;
      }
      throw new IllegalStateException("Could not parse survey form fields");
    }

    fillMissingFromUrl(formUrl, fields);

    // Force every food answer to the configured rating (default 3 = good)
    for (String key : new ArrayList<>(fields.keySet())) {
      if (key.startsWith("ipa_answer_food[")) {
        fields.put(key, Integer.toString(rating));
      }
      if (key.startsWith("ipa_comment_food[") || "ipa_comment_hosszu".equals(key)) {
        fields.put(key, "");
      }
      if (key.startsWith("ipa_szolg[")) {
        fields.putIfAbsent(key, "0");
      }
    }

    // Ensure service questions exist as in the HAR (unchecked => 0)
    fields.putIfAbsent("ipa_szolg[5]", "0");
    fields.putIfAbsent("ipa_szolg[6]", "0");
    fields.putIfAbsent("ipa_comment_hosszu", "");

    // Submit button must be present (name+value); keep it last like a browser
    fields.remove("postsurvey");
    fields.put("postsurvey", "Értékelés beküldése");

    long foodCount =
        fields.keySet().stream().filter(k -> k.startsWith("ipa_answer_food[")).count();
    if (foodCount == 0) {
      throw new IllegalStateException("No ipa_answer_food fields found on survey page");
    }
    for (String key : new ArrayList<>(fields.keySet())) {
      if (!key.startsWith("ipa_answer_food[")) {
        continue;
      }
      String suffix = key.substring("ipa_answer_food".length()); // [4_123]
      if (!fields.containsKey("ipa_food_id" + suffix)) {
        throw new IllegalStateException("Missing ipa_food_id" + suffix + " for " + key);
      }
      if (!fields.containsKey("ipa_etlap_no" + suffix)) {
        throw new IllegalStateException("Missing ipa_etlap_no" + suffix + " for " + key);
      }
      fields.putIfAbsent("ipa_etel_nap" + suffix, queryParam(formUrl, "ertekelesnap").orElse(""));
      fields.putIfAbsent("ipa_comment_food" + suffix, "");
    }

    log("  Foods to rate: " + foodCount + " → " + rating + " stars");
    String body = encodeForm(fields);
    if (dumpFields || dryRun) {
      log("  Fields:");
      for (Map.Entry<String, String> e : fields.entrySet()) {
        log("    " + e.getKey() + "=" + e.getValue());
      }
      log("  POST body: " + body);
    }

    if (dryRun) {
      log("  Dry-run: not posting.");
      return;
    }

    // Match browser HAR: no charset suffix on Content-Type
    HttpResponse<String> resp =
        client.send(
            requestBuilder(formUrl)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Origin", BASE)
                .header("Referer", formUrl)
                .header("Cache-Control", "max-age=0")
                .header("Upgrade-Insecure-Requests", "1")
                .header(
                    "Accept",
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build(),
            HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

    String out = resp.body() == null ? "" : resp.body();
    if (resp.statusCode() >= 400) {
      throw new IllegalStateException(
          "Submit HTTP " + resp.statusCode() + " title=" + extractTitle(out));
    }
    String ertekelolap =
        queryParam(formUrl, "ertekelolap")
            .orElseThrow(() -> new IllegalStateException("form URL missing ertekelolap"));

    // Confirm on the IPA list page: row should flip from close (✗) to check (✓)
    boolean accepted = false;
    for (int attempt = 1; attempt <= 4; attempt++) {
      try {
        Thread.sleep(attempt == 1 ? 1500 : 2000);
      } catch (InterruptedException ie) {
        Thread.currentThread().interrupt();
        break;
      }
      String listHtml = get(IPA_LIST);
      Optional<FormRowStatus> status = findFormRowStatus(listHtml, ertekelolap);
      if (status.isPresent() && status.get() == FormRowStatus.SUBMITTED) {
        accepted = true;
        break;
      }
      log(
          "  Waiting for list checkmark (try "
              + attempt
              + "/4, status="
              + status.map(Enum::name).orElse("MISSING")
              + ")…");
    }
    if (!accepted) {
      throw new IllegalStateException(
          "POST returned HTTP "
              + resp.statusCode()
              + " but list page still shows no checkmark for ertekelolap="
              + ertekelolap
              + "; POST title="
              + extractTitle(out));
    }
    log("  Submitted.");
  }

  private enum FormRowStatus {
    OPEN,
    SUBMITTED
  }

  /** Status of a Kitölthető row identified by ertekelolap id (check vs close icon). */
  private static Optional<FormRowStatus> findFormRowStatus(String listHtml, String ertekelolap) {
    String kitoltheto = extractKitolthetoSection(listHtml);
    Matcher rows = TABLE_ROW.matcher(kitoltheto);
    while (rows.find()) {
      String row = rows.group(1);
      if (!row.contains(ertekelolap)) {
        continue;
      }
      String lower = row.toLowerCase();
      if (lower.contains("icon: check") || lower.contains("icon:check")) {
        return Optional.of(FormRowStatus.SUBMITTED);
      }
      if (lower.contains("icon: close") || lower.contains("icon:close")) {
        return Optional.of(FormRowStatus.OPEN);
      }
      return Optional.empty();
    }
    return Optional.empty();
  }

  /** HAR always sends ertekelolap + week=YYYYWW even if easy to miss in HTML parsing. */
  private static void fillMissingFromUrl(String formUrl, Map<String, String> fields) {
    queryParam(formUrl, "ertekelolap").ifPresent(v -> fields.putIfAbsent("ertekelolap", v));
    if (!fields.containsKey("week")) {
      Optional<String> year = queryParam(formUrl, "ertekelesev");
      Optional<String> week = queryParam(formUrl, "ertekeleshet");
      if (year.isPresent() && week.isPresent()) {
        fields.put("week", year.get() + week.get());
      }
    }
  }

  private static Optional<String> queryParam(String url, String name) {
    int q = url.indexOf('?');
    if (q < 0) {
      return Optional.empty();
    }
    for (String part : url.substring(q + 1).split("&")) {
      int eq = part.indexOf('=');
      if (eq <= 0) {
        continue;
      }
      String key = part.substring(0, eq);
      if (key.equals(name)) {
        return Optional.of(htmlDecode(part.substring(eq + 1)));
      }
    }
    return Optional.empty();
  }

  /**
   * Collects name/value pairs from inputs/textareas/selects that belong to the IPA survey.
   * Only keeps survey-related fields to avoid posting unrelated page controls.
   */
  private static Map<String, String> parseSurveyFields(String html) {
    Map<String, String> fields = new LinkedHashMap<>();

    Matcher inputs = INPUT_TAG.matcher(html);
    while (inputs.find()) {
      Map<String, String> attrs = parseAttrs(inputs.group(1));
      String name = attrs.get("name");
      if (name == null || !isSurveyField(name)) {
        continue;
      }
      String type = attrs.getOrDefault("type", "text").toLowerCase();
      if ("submit".equals(type) || "button".equals(type) || "image".equals(type)) {
        if (!"postsurvey".equals(name)) {
          continue;
        }
      }
      if ("checkbox".equals(type) || "radio".equals(type)) {
        // Boolean HTML attrs may be bare `checked` (no =value) — ATTR regex misses those.
        String raw = inputs.group(1);
        boolean isChecked =
            attrs.containsKey("checked") || raw.matches("(?i).*\\bchecked\\b.*");
        if (!isChecked) {
          // Still record radio group names so we can force a rating later
          if ("radio".equals(type) && name.startsWith("ipa_answer_food[")) {
            fields.putIfAbsent(name, "");
          }
          continue;
        }
      }
      fields.put(name, attrs.getOrDefault("value", ""));
    }

    Matcher areas = TEXTAREA_TAG.matcher(html);
    while (areas.find()) {
      Map<String, String> attrs = parseAttrs(areas.group(1));
      String name = attrs.get("name");
      if (name == null || !isSurveyField(name)) {
        continue;
      }
      fields.put(name, htmlDecode(areas.group(2)).trim());
    }

    Matcher selects = SELECT_TAG.matcher(html);
    while (selects.find()) {
      Map<String, String> attrs = parseAttrs(selects.group(1));
      String name = attrs.get("name");
      if (name == null || !isSurveyField(name)) {
        continue;
      }
      String body = selects.group(2);
      Matcher selected = OPTION_SELECTED.matcher(body);
      if (selected.find()) {
        Matcher val = OPTION_VALUE.matcher(selected.group(1));
        fields.put(name, val.find() ? val.group(2) : "");
      } else {
        Matcher first = OPTION_VALUE.matcher(body);
        if (first.find()) {
          fields.put(name, first.group(2));
        }
      }
    }

    return fields;
  }

  private static boolean isSurveyField(String name) {
    return name.equals("ertekelolap")
        || name.equals("week")
        || name.equals("postsurvey")
        || name.equals("ipa_comment_hosszu")
        || name.startsWith("ipa_food_id[")
        || name.startsWith("ipa_etlap_no[")
        || name.startsWith("ipa_answer_food[")
        || name.startsWith("ipa_etel_nap[")
        || name.startsWith("ipa_comment_food[")
        || name.startsWith("ipa_szolg[");
  }

  private String get(String url) throws IOException, InterruptedException {
    HttpResponse<String> resp =
        client.send(
            requestBuilder(url)
                .GET()
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                .build(),
            HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    if (resp.statusCode() >= 400) {
      throw new IllegalStateException("GET " + url + " → HTTP " + resp.statusCode());
    }
    return resp.body() == null ? "" : resp.body();
  }

  private static HttpRequest.Builder requestBuilder(String url) {
    return HttpRequest.newBuilder(URI.create(url))
        .timeout(Duration.ofSeconds(60))
        .header("User-Agent", USER_AGENT)
        .header("Accept-Language", "hu-HU,hu;q=0.9,en;q=0.8");
  }

  private static Optional<String> extractHiddenToken(String html) {
    Matcher m = HIDDEN_TOKEN.matcher(html);
    if (m.find()) {
      return Optional.of(m.group(1));
    }
    m = HIDDEN_TOKEN_ALT.matcher(html);
    if (m.find()) {
      return Optional.of(m.group(1));
    }
    return Optional.empty();
  }

  private static Optional<String> extractInputValue(String html, String name) {
    Pattern p =
        Pattern.compile(
            "<input[^>]*name=[\"']" + Pattern.quote(name) + "[\"'][^>]*>",
            Pattern.CASE_INSENSITIVE);
    Matcher m = p.matcher(html);
    if (!m.find()) {
      return Optional.empty();
    }
    Map<String, String> attrs = parseAttrs(m.group());
    return Optional.ofNullable(attrs.get("value"));
  }

  private static Map<String, String> parseAttrs(String attrBlob) {
    Map<String, String> map = new LinkedHashMap<>();
    Matcher m = ATTR.matcher(attrBlob);
    while (m.find()) {
      map.put(m.group(1).toLowerCase(), m.group(3));
    }
    return map;
  }

  private static String encodeForm(Map<String, String> fields) {
    StringBuilder sb = new StringBuilder();
    for (Map.Entry<String, String> e : fields.entrySet()) {
      if (sb.length() > 0) {
        sb.append('&');
      }
      sb.append(URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8));
      sb.append('=');
      sb.append(URLEncoder.encode(Objects.toString(e.getValue(), ""), StandardCharsets.UTF_8));
    }
    return sb.toString();
  }

  private static String absolutize(String href) {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      return href;
    }
    if (href.startsWith("//")) {
      return "https:" + href;
    }
    if (href.startsWith("/")) {
      return BASE + href;
    }
    return BASE + "/" + href;
  }

  private static String htmlDecode(String s) {
    return s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&apos;", "'");
  }

  private static String truncate(String s, int max) {
    if (s == null) {
      return "";
    }
    return s.length() <= max ? s : s.substring(0, max) + "…";
  }

  private static void log(String msg) {
    System.out.println(msg);
  }

  private static String env(String key) {
    return System.getenv(key);
  }

  private static boolean isBlank(String s) {
    return s == null || s.isBlank();
  }

  private static String firstNonBlank(String... values) {
    for (String v : values) {
      if (!isBlank(v)) {
        return v;
      }
    }
    return null;
  }

  private static final class Args {
    final String username;
    final String password;
    final boolean dryRun;
    final boolean dumpFields;
    final int rating;

    Args(String username, String password, boolean dryRun, boolean dumpFields, int rating) {
      this.username = username;
      this.password = password;
      this.dryRun = dryRun;
      this.dumpFields = dumpFields;
      this.rating = rating;
    }

    static Args parse(String[] args) {
      String user = null;
      String pass = null;
      boolean dry = false;
      boolean dump = false;
      int rating = 3;
      for (int i = 0; i < args.length; i++) {
        switch (args[i]) {
          case "--username", "-u" -> user = requireValue(args, ++i, args[i - 1]);
          case "--password", "-p" -> pass = requireValue(args, ++i, args[i - 1]);
          case "--dry-run" -> dry = true;
          case "--dump-fields" -> dump = true;
          case "--rating" -> rating = Integer.parseInt(requireValue(args, ++i, "--rating"));
          case "--help", "-h" -> {
            printHelp();
            System.exit(0);
          }
          default -> throw new IllegalArgumentException("Unknown argument: " + args[i]);
        }
      }
      if (rating < 1 || rating > 5) {
        throw new IllegalArgumentException("--rating must be 1..5");
      }
      return new Args(user, pass, dry, dump, rating);
    }

    private static String requireValue(String[] args, int idx, String flag) {
      if (idx >= args.length) {
        throw new IllegalArgumentException("Missing value for " + flag);
      }
      return args[idx];
    }

    private static void printHelp() {
      System.out.println(
          """
          Usage: java -jar ipa-point-collector.jar [options]

          Options:
            -u, --username   Site username (or EK_USERNAME / IPA_USERNAME)
            -p, --password   Site password (or EK_PASSWORD / IPA_PASSWORD)
            --rating N       Star rating for every food (default: 3)
            --dry-run        Discover forms and build payload, do not POST
            --dump-fields    Print parsed fields + POST body
            -h, --help       Show this help
          """);
    }
  }
}
