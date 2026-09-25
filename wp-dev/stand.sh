#!/usr/bin/env bash
# =============================================================================
# Тестовый стенд RVN Compare: WordPress + WooCommerce на настоящих PHP и MariaDB.
#
# Песочница разработки пересоздаётся между сессиями: системные пакеты, кэши и
# сам сайт пропадают, сохраняются только файлы проекта. Поэтому стенд целиком
# описан этим скриптом и восстанавливается двумя командами.
#
# Использование:
#   bash wp-dev/stand.sh install        Системные пакеты и инструменты (один раз за сессию, ~2 мин)
#   bash wp-dev/stand.sh up [опции]     Поднять чистый сайт (~20–30 с)
#       --wp=7.1.2      версия WordPress (latest — последняя)
#       --wc=latest     версия WooCommerce (например 8.2.0)
#       --php=8.3       версия PHP для веб-сервера (8.1 | 8.2 | 8.3 | 8.4)
#       --port=8080     порт встроенного веб-сервера PHP
#       --locale=en_US  язык сайта (например ru_RU)
#       --name=main     имя стенда: разные имена = параллельные сайты и базы
#   bash wp-dev/stand.sh down [--name=main]   Остановить веб-сервер стенда
#   bash wp-dev/stand.sh status               Что установлено и что запущено
#
# Если рядом лежит папка плагина rvn-compare-products-for-woocommerce/,
# она подключается симлинком и активируется.
# Если есть wp-dev/seed.php — он наполняет магазин данными.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_SLUG="rvn-compare-products-for-woocommerce"
PLUGIN_SRC="$ROOT/$PLUGIN_SLUG"
TOOLS="${RVN_TOOLS_DIR:-/tmp/wp-tools}"
PHP_VERSIONS=(8.1 8.2 8.3 8.4)
PHP_EXT=(cli mysql xml mbstring curl zip intl gd sqlite3 bcmath)

# Печать шага с отметкой времени от старта команды.
T0=$(date +%s)
step() { printf '[%3ss] %s\n' "$(($(date +%s) - T0))" "$*"; }
die() { printf 'Ошибка: %s\n' "$*" >&2; exit 1; }

# Разбор опций вида --key=value в переменные OPT_key.
parse_opts() {
  OPT_wp="7.1.2"; OPT_wc="latest"; OPT_php="8.3"; OPT_port="8080"; OPT_locale="en_US"; OPT_name="main"
  for arg in "$@"; do
    case "$arg" in
      --*=*) key="${arg%%=*}"; key="${key#--}"; printf -v "OPT_${key}" '%s' "${arg#*=}" ;;
      *) die "неизвестный аргумент: $arg" ;;
    esac
  done
}

# Установка системных пакетов, WP-CLI, инструментов проверки кода и браузеров.
cmd_install() {
  sudo -n true 2>/dev/null || die "нужен sudo без пароля"
  local pkgs=(mariadb-server zip unzip subversion)
  for v in "${PHP_VERSIONS[@]}"; do for e in "${PHP_EXT[@]}"; do pkgs+=("php$v-$e"); done; done

  if [ ! -f /etc/apt/sources.list.d/sury-php.list ]; then
    sudo -n curl -sSLo /usr/share/keyrings/sury-php.gpg https://packages.sury.org/php/apt.gpg
    echo "deb [signed-by=/usr/share/keyrings/sury-php.gpg] https://packages.sury.org/php/ bookworm main" \
      | sudo -n tee /etc/apt/sources.list.d/sury-php.list >/dev/null
  fi
  sudo -n apt-get update -qq
  sudo -n DEBIAN_FRONTEND=noninteractive apt-get install -y -qq "${pkgs[@]}" >/tmp/stand-apt.log 2>&1 \
    || { tail -20 /tmp/stand-apt.log; die "apt-get install"; }
  # По умолчанию команда php указывает на минимальную поддерживаемую версию плагина.
  sudo -n update-alternatives --set php /usr/bin/php8.1 >/dev/null
  step "PHP ${PHP_VERSIONS[*]} и MariaDB установлены"

  if ! command -v wp >/dev/null; then
    sudo -n curl -sSLo /usr/local/bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
    sudo -n chmod +x /usr/local/bin/wp
  fi
  if ! command -v composer >/dev/null; then
    sudo -n curl -sSLo /usr/local/bin/composer https://getcomposer.org/download/latest-stable/composer.phar
    sudo -n chmod +x /usr/local/bin/composer
  fi
  step "WP-CLI $(wp --version --allow-root | awk '{print $2}'), Composer"

  export COMPOSER_HOME="$TOOLS/composer"
  composer global config --no-interaction allow-plugins.dealerdirect/phpcodesniffer-composer-installer true >/dev/null
  composer global require --no-interaction -q \
    wp-coding-standards/wpcs:"^3.1" phpcompatibility/phpcompatibility-wp:"*" \
    dealerdirect/phpcodesniffer-composer-installer phpstan/phpstan \
    szepeviktor/phpstan-wordpress php-stubs/woocommerce-stubs >/tmp/stand-composer.log 2>&1 \
    || { tail -20 /tmp/stand-composer.log; die "composer"; }
  step "PHPCS + WordPress Coding Standards + PHPCompatibilityWP, PHPStan + заглушки WP/WC"

  mkdir -p "$TOOLS/pw"
  (cd "$TOOLS/pw" && [ -f package.json ] || (cd "$TOOLS/pw" && npm init -y >/dev/null))
  (cd "$TOOLS/pw" && npm i -s playwright@1 @axe-core/playwright >/dev/null 2>&1)
  sudo -n env PATH="$PATH" bash -c "cd '$TOOLS/pw' && npx playwright install-deps chromium webkit firefox" >/tmp/stand-pw.log 2>&1 \
    || { tail -20 /tmp/stand-pw.log; die "playwright install-deps"; }
  (cd "$TOOLS/pw" && npx playwright install chromium webkit firefox >>/tmp/stand-pw.log 2>&1)
  step "Playwright $(cd "$TOOLS/pw" && npx playwright --version | awk '{print $2}'): Chromium, WebKit, Firefox"
}

# Запуск MariaDB без systemd (в песочнице его нет).
start_db() {
  if sudo -n mariadb -e 'SELECT 1' >/dev/null 2>&1; then return; fi
  sudo -n mkdir -p /run/mysqld && sudo -n chown mysql:mysql /run/mysqld
  (sudo -n mysqld_safe --user=mysql >/tmp/stand-mysqld.log 2>&1 &)
  for _ in $(seq 1 30); do sudo -n mariadb -e 'SELECT 1' >/dev/null 2>&1 && return; sleep 1; done
  die "MariaDB не запустилась, см. /tmp/stand-mysqld.log"
}

# Остановка веб-сервера конкретного стенда по PID-файлу.
stop_server() {
  local pidfile="/tmp/wp-stand-$1.pid"
  if [ -f "$pidfile" ]; then kill "$(cat "$pidfile")" 2>/dev/null || true; rm -f "$pidfile"; fi
}

# Поднятие чистого сайта с нужными версиями WordPress, WooCommerce и PHP.
cmd_up() {
  parse_opts "$@"
  command -v wp >/dev/null || die "сначала выполните: bash wp-dev/stand.sh install"
  command -v "php$OPT_php" >/dev/null || die "PHP $OPT_php не установлен"

  local dir="/tmp/wp-stand-$OPT_name" db="wp_stand_${OPT_name//-/_}" url="http://127.0.0.1:$OPT_port"
  local WP=(wp --path="$dir" --quiet)

  start_db
  sudo -n mariadb -e "DROP DATABASE IF EXISTS \`$db\`; CREATE DATABASE \`$db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE USER IF NOT EXISTS 'wp'@'127.0.0.1' IDENTIFIED BY 'wp'; GRANT ALL ON \`$db\`.* TO 'wp'@'127.0.0.1'; FLUSH PRIVILEGES;"
  step "MariaDB: база $db пересоздана"

  stop_server "$OPT_name"
  rm -rf "$dir" && mkdir -p "$dir"
  local wpver=(); [ "$OPT_wp" != "latest" ] && wpver=(--version="$OPT_wp")
  "${WP[@]}" core download "${wpver[@]}" >/dev/null
  "${WP[@]}" config create --dbname="$db" --dbuser=wp --dbpass=wp --dbhost=127.0.0.1 --extra-php <<'PHP'
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
define( 'SCRIPT_DEBUG', true );
define( 'WP_ENVIRONMENT_TYPE', 'local' );
PHP
  "${WP[@]}" core install --url="$url" --title="RVN Stand" --admin_user=admin --admin_password=admin \
    --admin_email=admin@example.com --skip-email
  # Красивые постоянные ссылки: /wp-json/ и ссылки товаров работают как в магазине.
  "${WP[@]}" rewrite structure '/%postname%/' --hard >/dev/null 2>&1 || true
  step "WordPress $("${WP[@]}" core version) установлен (WP_DEBUG включён, журнал: $dir/wp-content/debug.log)"

  local wcver=(); [ "$OPT_wc" != "latest" ] && wcver=(--version="$OPT_wc")
  "${WP[@]}" plugin install woocommerce "${wcver[@]}" --activate >/dev/null 2>&1 || die "WooCommerce $OPT_wc"
  "${WP[@]}" option update woocommerce_coming_soon no >/dev/null 2>&1 || true
  # Мастер первичной настройки WooCommerce перехватывал бы переходы в консоли.
  "${WP[@]}" transient delete _wc_activation_redirect >/dev/null 2>&1 || true
  "${WP[@]}" option update woocommerce_onboarding_profile '{"skipped":true}' --format=json >/dev/null 2>&1 || true
  "${WP[@]}" option update woocommerce_task_list_hidden yes >/dev/null 2>&1 || true
  "${WP[@]}" option update woocommerce_show_marketplace_suggestions no >/dev/null 2>&1 || true
  step "WooCommerce $("${WP[@]}" plugin get woocommerce --field=version) активирован"

  if [ "$OPT_locale" != "en_US" ]; then
    "${WP[@]}" language core install "$OPT_locale" --activate >/dev/null 2>&1 || true
    "${WP[@]}" language plugin install woocommerce "$OPT_locale" >/dev/null 2>&1 || true
    step "язык сайта: $OPT_locale"
  fi

  if [ -d "$PLUGIN_SRC" ]; then
    ln -s "$PLUGIN_SRC" "$dir/wp-content/plugins/$PLUGIN_SLUG"
    "${WP[@]}" plugin activate "$PLUGIN_SLUG" && step "плагин $PLUGIN_SLUG подключён симлинком и активирован"
  else
    step "папки $PLUGIN_SLUG/ пока нет — стенд поднят без плагина"
  fi

  if [ -f "$ROOT/wp-dev/seed.php" ]; then
    "${WP[@]}" eval-file "$ROOT/wp-dev/seed.php" && step "тестовые данные загружены"
  fi

  if "${WP[@]}" plugin install plugin-check --activate >/dev/null 2>&1; then
    step "Plugin Check $("${WP[@]}" plugin get plugin-check --field=version) установлен"
  else
    step "Plugin Check установить не удалось"
  fi

  : >"$dir/wp-content/debug.log"
  printf 'PHP_BIN=%s\nPORT=%s\n' "$OPT_php" "$OPT_port" >"/tmp/wp-stand-$OPT_name.env"

  nohup "php$OPT_php" -S "127.0.0.1:$OPT_port" -t "$dir" </dev/null >"/tmp/wp-stand-$OPT_name.log" 2>&1 &
  echo $! >"/tmp/wp-stand-$OPT_name.pid"
  sleep 1
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' "$url/")
  [ "$code" = "200" ] || die "сайт ответил HTTP $code, см. /tmp/wp-stand-$OPT_name.log"
  step "готово: $url (PHP $OPT_php, admin / admin)"
}

# Остановка веб-сервера стенда.
cmd_down() {
  parse_opts "$@"
  stop_server "$OPT_name"
  step "веб-сервер стенда $OPT_name остановлен"
}

# Сводка: версии инструментов и запущенные стенды.
cmd_status() {
  for v in "${PHP_VERSIONS[@]}"; do printf 'php%s: %s\n' "$v" "$(command -v "php$v" >/dev/null && "php$v" -r 'echo PHP_VERSION;' || echo 'нет')"; done
  printf 'MariaDB: %s\n' "$(sudo -n mariadb -N -e 'SELECT VERSION()' 2>/dev/null || echo 'не запущена')"
  printf 'WP-CLI: %s\n' "$(command -v wp >/dev/null && wp --version --allow-root || echo 'нет')"
  printf 'PHPCS: %s\n' "$([ -x "$TOOLS/composer/vendor/bin/phpcs" ] && "$TOOLS/composer/vendor/bin/phpcs" --version | head -1 || echo 'нет')"
  for pidfile in /tmp/wp-stand-*.pid; do
    [ -e "$pidfile" ] || continue
    local name="${pidfile#/tmp/wp-stand-}"; name="${name%.pid}"
    printf 'стенд %s: %s\n' "$name" "$(kill -0 "$(cat "$pidfile")" 2>/dev/null && echo 'работает' || echo 'остановлен')"
  done
}

case "${1:-}" in
  install) shift; cmd_install "$@" ;;
  up) shift; cmd_up "$@" ;;
  down) shift; cmd_down "$@" ;;
  status) shift; cmd_status "$@" ;;
  *) sed -n '2,24p' "$0"; exit 1 ;;
esac
