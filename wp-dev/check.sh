#!/usr/bin/env bash
# =============================================================================
# Проверки плагина RVN Compare одной командой.
#
#   bash wp-dev/check.sh static    Без сайта: синтаксис PHP 8.1–8.4, совместимость
#                                  точек входа с PHP 7.0, WordPress Coding Standards
#                                  (включая безопасность), PHPStan, переводы.
#   bash wp-dev/check.sh runtime   На стендах main и min (bash wp-dev/stand.sh up):
#                                  активация, WP_DEBUG, меню в браузере, уведомление
#                                  о требованиях, удаление данных, Plugin Check.
#   bash wp-dev/check.sh stand min Только один стенд (main или min).
#   bash wp-dev/check.sh cache     WP Super Cache: активация, обновление через
#                                  настоящий /wp-admin/, просроченный nonce
#                                  гостя и авторизованного пользователя.
#   bash wp-dev/check.sh table     Браузерная проверка страницы и таблицы 0.4.0.
#   bash wp-dev/check.sh pcp       Только Plugin Check на стенде main.
#   bash wp-dev/check.sh all       Всё вместе (по умолчанию).
#
# Отчёты: /tmp/rvn-check/, скриншоты: /tmp/rvn-check/screens/.
# Код выхода 0 — все проверки пройдены.
# =============================================================================
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="rvn-compare-products-for-woocommerce"
PLUGIN="$ROOT/$SLUG"
TOOLS="${RVN_TOOLS_DIR:-/tmp/wp-tools}"
BIN="$TOOLS/composer/vendor/bin"
OUT="/tmp/rvn-check"
VERSION="$(sed -n "s/^define( 'RVN_COMPARE_VERSION', '\([^']*\)' );/\1/p" "$PLUGIN/$SLUG.php")"
FAILED=0

mkdir -p "$OUT/screens"
: >"$OUT/summary.txt"

# Записывает результат проверки в консоль и в сводку.
record() {
  local status="$1" name="$2" detail="${3:-}"
  [ "$status" = "FAIL" ] && FAILED=1
  printf '%-4s  %s — %s\n' "$status" "$name" "$detail" | tee -a "$OUT/summary.txt"
}

# ---------------------------------------------------------------------------
# Статические проверки.
# ---------------------------------------------------------------------------
run_static() {
  local files count bad v rc

  mapfile -t files < <(find "$PLUGIN" -name '*.php' | sort)
  count="${#files[@]}"
  bad=0
  : >"$OUT/lint.txt"
  for v in 8.1 8.2 8.3 8.4; do
    for f in "${files[@]}"; do
      "php$v" -l "$f" >>"$OUT/lint.txt" 2>&1 || bad=1
    done
  done
  [ "$bad" = 0 ] && record PASS "Синтаксис PHP 8.1–8.4" "$count файлов × 4 версии" \
    || record FAIL "Синтаксис PHP 8.1–8.4" "см. $OUT/lint.txt"

  "$BIN/phpcs" -q --standard=PHPCompatibilityWP --runtime-set testVersion 7.0- \
    "$PLUGIN/$SLUG.php" "$PLUGIN/uninstall.php" "$PLUGIN/rvn-core/bootstrap.php" >"$OUT/phpcompat-entry.txt" 2>&1
  [ $? = 0 ] && record PASS "Точки входа читаются на PHP 7.0+" "главный файл, uninstall.php, bootstrap ядра" \
    || record FAIL "Точки входа читаются на PHP 7.0+" "см. $OUT/phpcompat-entry.txt"

  "$BIN/phpcs" --standard="$ROOT/wp-dev/phpcs.xml.dist" \
    --report-full="$OUT/phpcs.txt" --report-summary="$OUT/phpcs-summary.txt" -q >/dev/null 2>&1
  rc=$?
  [ "$rc" = 0 ] && record PASS "WordPress Coding Standards + безопасность + PHP 8.1+" "0 ошибок, 0 предупреждений" \
    || record FAIL "WordPress Coding Standards + безопасность + PHP 8.1+" "$(grep -E 'A TOTAL OF' "$OUT/phpcs-summary.txt" 2>/dev/null || echo "см. $OUT/phpcs.txt")"

  "$BIN/phpstan" analyse -c "$ROOT/wp-dev/phpstan.neon.dist" --no-progress --memory-limit=2G >"$OUT/phpstan.txt" 2>&1
  [ $? = 0 ] && record PASS "PHPStan (уровень 6, заглушки WordPress и WooCommerce)" "ошибок нет" \
    || record FAIL "PHPStan (уровень 6)" "$(grep -E 'Found [0-9]+ error' "$OUT/phpstan.txt" || echo "см. $OUT/phpstan.txt")"

  bash "$ROOT/wp-dev/i18n.sh" >"$OUT/i18n.txt" 2>&1
  [ $? = 0 ] && record PASS "Переводы: POT актуален, ru_RU полный" "$(grep -c '^msgid "' "$PLUGIN/languages/$SLUG.pot") записей в шаблоне" \
    || record FAIL "Переводы" "см. $OUT/i18n.txt"
}

# Проверяет журнал WP_DEBUG стенда: записи, связанные с плагином, — ошибка.
check_debug_log() {
  local stand="$1" log="/tmp/wp-stand-$1/wp-content/debug.log" ours other
  ours=0
  other=0
  if [ -f "$log" ]; then
    ours="$(grep -ciE 'rvn' "$log" || true)"
    other="$(grep -viE 'rvn' "$log" | grep -cE 'PHP (Warning|Notice|Deprecated|Fatal)|called incorrectly' || true)"
    cp "$log" "$OUT/debug-$stand.log"
  fi
  [ "$ours" = 0 ] && record PASS "[$stand] WP_DEBUG: записей от плагина нет" "записей от других компонентов: $other" \
    || record FAIL "[$stand] WP_DEBUG: есть записи от плагина" "см. $OUT/debug-$stand.log"
}

# ---------------------------------------------------------------------------
# Проверки на стенде.
# ---------------------------------------------------------------------------
run_runtime_stand() {
  local stand="$1" port="$2" dir="/tmp/wp-stand-$1"
  local WP=(wp --path="$dir" --quiet)
  local url="http://127.0.0.1:$port" out rc

  if [ ! -d "$dir" ]; then
    record FAIL "[$stand] Стенд" "не поднят: bash wp-dev/stand.sh up --name=$stand"
    return
  fi

  : >"$dir/wp-content/debug.log"

  "${WP[@]}" plugin deactivate "$SLUG" >/dev/null 2>&1
  "${WP[@]}" option delete rvn_compare_version >/dev/null 2>&1
  if "${WP[@]}" plugin activate "$SLUG" >/dev/null 2>&1; then
    record PASS "[$stand] Активация" "$("${WP[@]}" core version) · WooCommerce $("${WP[@]}" plugin get woocommerce --field=version) · PHP $(sed -n 's/^PHP_BIN=//p' "/tmp/wp-stand-$stand.env" 2>/dev/null)"
  else
    record FAIL "[$stand] Активация" "wp plugin activate завершилась с ошибкой"
  fi

  out="$("${WP[@]}" option get rvn_compare_version 2>/dev/null)"
  [ "$out" = "$VERSION" ] && record PASS "[$stand] Версия данных записана при активации" "rvn_compare_version = $out" \
    || record FAIL "[$stand] Версия данных при активации" "получено: '$out'"

  out="$(NODE_PATH="$TOOLS/pw/node_modules" node "$ROOT/wp-dev/e2e/admin-smoke.cjs" "$url" "$stand" "$OUT/screens" menu 2>&1)"
  rc=$?
  echo "$out" >"$OUT/e2e-$stand-menu.json"
  [ "$rc" = 0 ] && record PASS "[$stand] Браузер: меню RVN, страницы, ссылка «Настройки»" "$(python3 "$ROOT/wp-dev/e2e/summary.py" "$OUT/e2e-$stand-menu.json")" \
    || record FAIL "[$stand] Браузер: меню RVN" "$(python3 "$ROOT/wp-dev/e2e/summary.py" "$OUT/e2e-$stand-menu.json" --failed)"

  "${WP[@]}" plugin deactivate woocommerce >/dev/null 2>&1
  out="$(NODE_PATH="$TOOLS/pw/node_modules" node "$ROOT/wp-dev/e2e/admin-smoke.cjs" "$url" "$stand" "$OUT/screens" requirements 2>&1)"
  rc=$?
  echo "$out" >"$OUT/e2e-$stand-requirements.json"
  "${WP[@]}" plugin activate woocommerce >/dev/null 2>&1
  [ "$rc" = 0 ] && record PASS "[$stand] Без WooCommerce: уведомление вместо работы" "$(python3 "$ROOT/wp-dev/e2e/summary.py" "$OUT/e2e-$stand-requirements.json")" \
    || record FAIL "[$stand] Без WooCommerce" "$(python3 "$ROOT/wp-dev/e2e/summary.py" "$OUT/e2e-$stand-requirements.json" --failed)"

  "${WP[@]}" option update rvn_compare_settings '{"delete_data_on_uninstall":false}' --format=json >/dev/null
  "${WP[@]}" plugin uninstall "$SLUG" --deactivate --skip-delete >/dev/null 2>&1
  if "${WP[@]}" option get rvn_compare_version >/dev/null 2>&1; then
    record PASS "[$stand] Удаление с выключенной галочкой сохраняет данные" "rvn_compare_version на месте"
  else
    record FAIL "[$stand] Удаление с выключенной галочкой" "данные удалены, хотя удаление запрещено"
  fi

  "${WP[@]}" option delete rvn_compare_settings >/dev/null 2>&1
  "${WP[@]}" plugin uninstall "$SLUG" --skip-delete >/dev/null 2>&1
  if "${WP[@]}" option get rvn_compare_version >/dev/null 2>&1; then
    record FAIL "[$stand] Удаление по умолчанию" "rvn_compare_version не удалена"
  else
    record PASS "[$stand] Удаление по умолчанию чистит данные" "опции плагина удалены"
  fi

  "${WP[@]}" plugin activate "$SLUG" >/dev/null 2>&1
  check_debug_log "$stand"
}

run_plugin_check() {
  local dir="/tmp/wp-stand-main" rc
  wp --path="$dir" plugin check "$SLUG" --format=table \
    --require="$dir/wp-content/plugins/plugin-check/cli.php" >"$OUT/plugin-check.txt" 2>&1
  rc=$?
  if grep -qE '(^|\s)ERROR(\s|$)' "$OUT/plugin-check.txt"; then
    record FAIL "Plugin Check (официальная проверка каталога)" "есть ошибки, см. $OUT/plugin-check.txt"
  elif grep -qE '(^|\s)WARNING(\s|$)' "$OUT/plugin-check.txt"; then
    record WARN "Plugin Check (официальная проверка каталога)" "ошибок нет, есть предупреждения: $(grep -cE '(^|\s)WARNING(\s|$)' "$OUT/plugin-check.txt")"
  elif [ "$rc" = 0 ]; then
    record PASS "Plugin Check (официальная проверка каталога)" "ошибок и предупреждений нет"
  else
    record FAIL "Plugin Check" "код $rc, см. $OUT/plugin-check.txt"
  fi
}

# Автотесты ядра и REST на стенде.
run_tests_stand() {
  local stand="$1" port="$2" dir="/tmp/wp-stand-$1"

  if [ ! -d "$dir" ]; then
    record FAIL "[$stand] Автотесты" "стенд не поднят: bash wp-dev/stand.sh up --name=$stand"
    return
  fi

  wp --path="$dir" eval-file "$ROOT/wp-dev/tests/core-logic.php" >"$OUT/tests-$stand-core.txt" 2>&1
  [ $? = 0 ] && record PASS "[$stand] Автотесты ядра (лимиты, категории, группы, слияние)" \
    "$(grep -E '^Проверок' "$OUT/tests-$stand-core.txt" | tail -1)" \
    || record FAIL "[$stand] Автотесты ядра" "$(grep -E '^  XX|^Проверок' "$OUT/tests-$stand-core.txt" | head -5 | tr '\n' ' ')"

  python3 "$ROOT/wp-dev/tests/rest-smoke.py" "http://127.0.0.1:$port" "$dir" >"$OUT/tests-$stand-rest.txt" 2>&1
  [ $? = 0 ] && record PASS "[$stand] REST API (nonce, лимиты, CRUD, слияние)" \
    "$(grep -E 'проверок' "$OUT/tests-$stand-rest.txt" | tail -1)" \
    || record FAIL "[$stand] REST API" "$(grep -E 'XX|проверок' "$OUT/tests-$stand-rest.txt" | head -5 | tr '\n' ' ')"
}

# Браузерная проверка фронтенда: кнопки, счётчик, уведомления.
run_frontend_stand() {
  local stand="$1" port="$2" dir="/tmp/wp-stand-$1" rc

  if [ ! -d "$dir" ]; then
    record FAIL "[$stand] Фронтенд в браузере" "стенд не поднят"
    return
  fi

  NODE_PATH="$TOOLS/pw/node_modules" node "$ROOT/wp-dev/e2e/frontend-smoke.cjs" \
    "http://127.0.0.1:$port" "$stand" "$OUT/screens" >"$OUT/e2e-$stand-frontend.json" 2>&1
  rc=$?
  [ "$rc" = 0 ] && record PASS "[$stand] Фронтенд: кнопка, счётчик, уведомление, повторное нажатие" \
    "$(python3 "$ROOT/wp-dev/e2e/summary.py" "$OUT/e2e-$stand-frontend.json")" \
    || record FAIL "[$stand] Фронтенд в браузере" "$(python3 "$ROOT/wp-dev/e2e/summary.py" "$OUT/e2e-$stand-frontend.json" --failed)"
}

# Браузерная проверка итерации 3: оболочка, REST-данные и статический shortcode.
run_table_stand() {
  local stand="$1" port="$2" dir="/tmp/wp-stand-$1" rc

  if [ ! -d "$dir" ]; then
    record FAIL "[$stand] Таблица 0.4.0" "стенд не поднят"
    return
  fi

  NODE_PATH="$TOOLS/pw/node_modules" node "$ROOT/wp-dev/e2e/table-smoke.cjs" \
    "http://127.0.0.1:$port" "$stand" "$OUT/screens" >"$OUT/e2e-$stand-table.json" 2>&1
  rc=$?
  [ "$rc" = 0 ] && record PASS "[$stand] Таблица 0.4.0: страница, поля, static shortcode" \
    "$(python3 "$ROOT/wp-dev/e2e/summary.py" "$OUT/e2e-$stand-table.json")" \
    || record FAIL "[$stand] Таблица 0.4.0" "$(python3 "$ROOT/wp-dev/e2e/summary.py" "$OUT/e2e-$stand-table.json" --failed)"
}

# Проверяет настоящий cache HIT, сброс на активации/обновлении и восстановление nonce.
run_cache_regression() {
  local dir="/tmp/wp-stand-main" result="$OUT/e2e-main-cache.json" rc

  if [ ! -d "$dir" ]; then
    record FAIL "Кэш и просроченный nonce" "стенд main не поднят"
    return
  fi

  NODE_PATH="$TOOLS/pw/node_modules" node "$ROOT/wp-dev/e2e/cache-regression.cjs" \
    'http://127.0.0.1:8080' "$dir" >"$result" 2>&1
  rc=$?

  if [ "$rc" = 0 ]; then
    record PASS "Кэш, обновление и просроченный nonce (гость/аккаунт)" \
      "$(python3 "$ROOT/wp-dev/e2e/summary.py" "$result")"
  else
    record FAIL "Кэш, обновление и просроченный nonce" \
      "$(python3 "$ROOT/wp-dev/e2e/summary.py" "$result" --failed)"
  fi
}

MODE="${1:-all}"
case "$MODE" in
  static) run_static ;;
  runtime) run_runtime_stand main 8080; run_runtime_stand min 8081; run_plugin_check ;;
  stand) if [ "${2:-main}" = "min" ]; then run_runtime_stand min 8081; else run_runtime_stand main 8080; fi ;;
  tests) if [ "${2:-min}" = "min" ]; then run_tests_stand min 8081; else run_tests_stand main 8080; fi ;;
  front) if [ "${2:-main}" = "min" ]; then run_frontend_stand min 8081; else run_frontend_stand main 8080; fi ;;
  table) if [ "${2:-main}" = "min" ]; then run_table_stand min 8081; else run_table_stand main 8080; fi ;;
  cache) run_cache_regression ;;
  pcp) run_plugin_check ;;
  all) run_static; run_tests_stand main 8080; run_tests_stand min 8081; run_frontend_stand main 8080; run_frontend_stand min 8081; run_table_stand main 8080; run_table_stand min 8081; run_cache_regression; run_runtime_stand main 8080; run_runtime_stand min 8081; run_plugin_check ;;
  *) sed -n '2,18p' "$0"; exit 1 ;;
esac

echo
[ "$FAILED" = 0 ] && echo "ИТОГ: все проверки пройдены" || echo "ИТОГ: есть проваленные проверки"
exit "$FAILED"
