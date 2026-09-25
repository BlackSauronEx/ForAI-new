# RVN Compare — как проверять

## Стенд в песочнице разработки

Песочница пересоздаётся перед каждой сессией: программы и сайты пропадают, файлы проекта остаются.

```bash
# 1. Инструменты (~2 мин). В песочнице запускать отвязанным от терминала:
setsid nohup bash wp-dev/stand.sh install </dev/null >/tmp/stand-install.log 2>&1 &
# 2. Два сайта на настоящей MariaDB (~30 с каждый):
bash wp-dev/stand.sh up                                                                  # WP 7.1.2 + WC последний + PHP 8.3
bash wp-dev/stand.sh up --name=min --wp=6.4.7 --wc=8.2.0 --php=8.1 --port=8081 --locale=ru_RU
```

Каждый `up` пересоздаёт базу, подключает плагин симлинком, загружает тестовый магазин (`wp-dev/seed.php`: 12 товаров всех типов, 5 категорий включая «Акции» и категорию по умолчанию, 4 глобальных атрибута с описаниями значений) и ставит Plugin Check. Вход: `admin` / `admin`.

## Проверки одной командой

```bash
bash wp-dev/check.sh static      # синтаксис PHP 8.1–8.4, PHP 7.0+ для точек входа, WPCS, PHPStan, переводы
bash wp-dev/check.sh tests main  # автотесты ядра (34) и REST-смоук (10)
bash wp-dev/check.sh tests min
bash wp-dev/check.sh stand main  # живой сайт: активация, браузер, без WooCommerce, удаление, WP_DEBUG
bash wp-dev/check.sh stand min
bash wp-dev/check.sh table main  # браузерная проверка страницы и таблицы 0.4.0
bash wp-dev/check.sh pcp         # официальный Plugin Check (статические и runtime-проверки)
bash wp-dev/build-zip.sh         # ZIP в public/downloads/ + SHA-256
```

Автотесты: `wp-dev/tests/core-logic.php` (запуск `wp eval-file`, создаёт и убирает свои данные) и `wp-dev/tests/rest-smoke.py` (REST через форму `?rest_route=` — она работает при любых постоянных ссылках, а `/wp-json/` зависит от их настроек).

В песочнице режимы запускаются по отдельности: одна команда `all` дольше лимита инструмента.

| Проверка | Инструмент | Критерий |
| --- | --- | --- |
| Синтаксис | `php -l` 8.1, 8.2, 8.3, 8.4 | без ошибок |
| Точки входа на старом PHP | PHPCompatibilityWP, testVersion 7.0- | без ошибок |
| Стандарты и безопасность | PHPCS + WordPress (Core, Docs, Extra, Security) + PHPCompatibilityWP 8.1- | 0 ошибок, 0 предупреждений |
| Статический анализ | PHPStan 2, уровень 6, заглушки WordPress и WooCommerce | 0 ошибок |
| Переводы | `wp i18n make-pot` + словарь `wp-dev/i18n/ru_RU.json` | нет замечаний make-pot, все строки переведены |
| Браузер | Playwright + Chromium (`wp-dev/e2e/admin-smoke.cjs`) | все пункты сценария |
| Журнал | `WP_DEBUG_LOG` | ни одной записи, связанной с плагином |
| Каталог | Plugin Check 2.x | 0 ошибок, 0 предупреждений |

Отчёты: `/tmp/rvn-check/`; итог каждой итерации — `docs/test-reports/<версия>.md`.

## Доставка сборки пользователю

Пользователь забирает **папку `rvn-compare-products-for-woocommerce/`** из рабочей области и архивирует её сам (нужен верхний уровень — сама папка). ZIP-архивы `build-zip.sh` продолжают собираться как релизный артефакт для каталога WordPress.org и контрольной суммы.

## Куда кладётся готовая сборка

`wp-dev/build-zip.sh` создаёт **две идентичные копии** одной сборки:

| Файл | Зачем |
| --- | --- |
| `public/downloads/<слаг>-<версия>.zip` | раздаётся сайтом предпросмотра |
| `<корень проекта>/<слаг>-<версия>.zip` | виден в списке файлов рабочей области |
| `public/downloads/<слаг>-<версия>.zip.sha256` | контрольная сумма для проверки после скачивания |

Скрипт сверяет версии в заголовке плагина, в `RVN_COMPARE_VERSION` и в `Stable tag` файла `readme.txt` — при расхождении сборка останавливается. Перед упаковкой проверяется отсутствие скрытых файлов (каталог их не пропускает).

Проверка скачанного архива:

```bash
sha256sum -c rvn-compare-products-for-woocommerce-<версия>.zip.sha256
```

Если ссылка на превью не открывается — сначала проверьте, запущен ли сервер предпросмотра; файл при этом остаётся в корне проекта.

## Проверка на вашем сайте (локальном или на хостинге)

**Установка:** Плагины → Добавить новый → Загрузить плагин → выбрать ZIP → Установить → Активировать. Нужен активный WooCommerce 8.2+.

**Автопроверка через WP-CLI** (если он есть):

```bash
wp plugin install ./rvn-compare-products-for-woocommerce-0.1.0.zip --activate --force
wp plugin install plugin-check --activate
wp plugin check rvn-compare-products-for-woocommerce
# Ожидается: Success: Checks complete. No errors found.
```

**Ручной чек-лист сборки 0.1.0** (около 5 минут):

1. В меню консоли под «Маркетингом» есть «RVN» со значком «R»; до следующего блока — разделитель.
2. Наведение на «RVN»: подпункты «Сравнение» и «Поддержка», без повтора «RVN».
3. Клик по «RVN» открывает «Сравнение»; в таблице — ваши версии WordPress, WooCommerce и PHP и способ хранения заказов.
4. «RVN → Поддержка»: текст «Будет реализовано в скором времени».
5. На экране «Плагины» у плагина есть ссылка «Настройки».
6. Язык сайта русский ↔ английский: тексты меню и страниц переключаются.
7. Попробуйте деактивировать WooCommerce, пока активен наш плагин: WordPress не позволит — это объявленная зависимость (`Requires Plugins: woocommerce`), такое поведение ожидаемо. Чтобы увидеть наше уведомление о требованиях, используйте WP-CLI: `wp plugin deactivate rvn-compare-products-for-woocommerce && wp plugin deactivate woocommerce`, затем активируйте наш плагин без WooCommerce — появится уведомление со ссылкой «Активировать WooCommerce» (работает и на WordPress 6.4, где заголовок зависимости ядро не проверяет).
8. Смена цветовой схемы профиля: значок «R» перекрашивается вместе с остальными значками.
9. Удалите плагин (деактивировать → удалить): опция `rvn_compare_version` исчезает (`wp option get rvn_compare_version` → ошибка «не найдено»).

Что прислать при проблеме: версии WordPress, WooCommerce, PHP, тему, текст ошибки и строку из `wp-content/debug.log`, скриншот.


## Песочница этого чата (критично)

Рабочая область — **Vite + React**, не Next.js. PHP/MariaDB в песочнице **могут отсутствовать** на старте сессии.

```bash
# install — ДОЛГО (~2 мин) и качает пакеты. Только отвязанным процессом:
setsid nohup bash wp-dev/stand.sh install </dev/null >/tmp/stand-install.log 2>&1 &
# Смотреть лог:
tail -f /tmp/stand-install.log

# up — поднимает PHP built-in server + MariaDB и НЕ ЗАВЕРШАЕТСЯ (демон).
# В tool-вызове без фона — шаг зависнет и убьёт чат.
setsid nohup bash wp-dev/stand.sh up </dev/null >/tmp/stand-main.log 2>&1 &
setsid nohup bash wp-dev/stand.sh up --name=min --wp=6.4.7 --wc=8.2.0 --php=8.1 --port=8081 --locale=ru_RU \
  </dev/null >/tmp/stand-min.log 2>&1 &

# status / down — короткие, можно в foreground:
bash wp-dev/stand.sh status
bash wp-dev/stand.sh down
bash wp-dev/stand.sh down --name=min
```

Проверки `check.sh` запускать **по одной** (лимит времени tool-вызова).

Скриншоты e2e (Playwright) при успехе класть в `public/reports/<версия>/`.

## Ручной чек-лист 0.4.0 (таблица)

Около 15–20 минут. Storefront на main + блочная тема хотя бы один раз.

### Активация и страница

1. Свежий стенд → активировать плагин → появляется страница «Сравнение товаров» (или Product comparison) со slug `compare` и shortcode в контенте.
2. В списке страниц у неё метка «Comparison page» / «Страница сравнения».
3. View source страницы: **нет** списка product ID в HTML; есть `data-rvn-table` и loading-state.
4. `curl -I` / view-source: noindex/robots, если настройка включена (default on).
5. Если slug `compare` заранее занят чужой страницей — плагин создаёт `compare-products`, чужую не трогает.
6. RVN → Сравнение → вкладка страницы: create / select other / reset (backup) / restore работают, все с nonce.

### Таблица и данные

7. Добавить 3 товара одной категории с витрины → счётчик = 3 → открыть `/compare/` → таблица показывает 3 колонки.
8. Вкладки категорий: товары из разных категорий → переключение вкладок, clear tab чистит только текущую.
9. Поля: price, sku, availability, rating, weight, dimensions, short_description видны; description по умолчанию скрыт.
10. Глобальные атрибуты WC присутствуют; «Only differences» прячет одинаковые строки.
11. Highlight differences окрашивает ячейки (цвет из настроек).
12. Empty state: очистить всё → «Nothing to compare yet» + ссылка в магазин.
13. Shortcode `[rvn-compare-table products="1,2,3"]` на другой странице — статическая таблица, не зависит от списка посетителя.
14. Shortcode без `products` на произвольной странице — таблица по текущему списку.
15. Горизонтальный скролл стрелками, sticky-колонка характеристик, колонки 5/3/2 по ширине.
16. `bash wp-dev/check.sh table main` создаёт временную страницу со статическим shortcode, делает скриншот таблицы и удаляет страницу.

### Кэш и безопасность

17. WP Super Cache ON → закэшировать `/compare/` и карточку товара → под гостем список и таблица всё равно персональные; после add кнопка/счётчик обновляются без hard reload.
18. Просроченный nonce: `GET /session` обновляет, add проходит.
19. В `table.js` нет `innerHTML` с названиями (grep) — только `textContent`.
20. REST `GET /table?ids=` без nonce доступен; POST-мутации без nonce → 403.
21. `WP_DEBUG_LOG` пуст по нашему слагу; Query Monitor без фаталов.
22. ru_RU: заголовки таблицы, empty state, toggle, admin-вкладки — по-русски.
23. Deactivate → delete plugin: опции `rvn_compare_*` удалены (если галочка on), **страница compare осталась**.

Что прислать при проблеме: версии WP/WC/PHP, тема, плагины кэша, `debug.log`, скрин, URL, шаги.
