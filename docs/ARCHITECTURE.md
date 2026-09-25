# RVN Compare — карта кода

Актуально для сборки **0.4.0** (итерация 3, **черновик — тесты не прогнаны**). Обновляется в каждой итерации.

> В прошлом чате карта остановилась на 0.3.1, хотя код таблицы уже был написан. Этот файл приведён в соответствие с фактическим деревом `rvn-compare-products-for-woocommerce/`.

## Структура плагина

```
rvn-compare-products-for-woocommerce/
├── rvn-compare-products-for-woocommerce.php   Заголовок, константы, PHP-check, i18n, Woo decls, boot
├── uninstall.php                              Удаление данных (галочка + multisite); страницу не удаляет
├── readme.txt                                 Каталог WordPress.org (EN)
├── includes/
│   ├── class-autoloader.php                   RVN_Compare\* → includes/…/class-*.php
│   ├── class-plugin.php                       boot(): Requirements → Installer → REST → Nonce_Recovery → Frontend → Admin
│   ├── class-requirements.php                 WP + Woo check, admin notice со ссылками
│   ├── class-installer.php                    version option, lazy install, Comparison_Page::ensure(), cache flush
│   ├── class-settings.php                     все настройки + sanitize (лимиты, кнопки, toasts, таблица)
│   ├── class-storage.php                      user list JSON in user_meta
│   ├── class-category-model.php               вкладки: direct cats, groups, Other, rules
│   ├── class-limits.php                       50/12 iron rule + reason
│   ├── class-compare-service.php              единственная точка add/remove/clear/merge
│   ├── class-visibility.php                   исключения авто-кнопок
│   ├── class-nonce-recovery.php               GET /session, fresh nonce for cached pages
│   ├── class-table-fields.php                 registry полей: core + attributes + meta, groups
│   ├── class-table-data.php                   build(): tabs/columns/rows для REST /table
│   ├── rest/
│   │   └── class-rest-controller.php          /session /list /table /items /items/remove /clear /merge
│   ├── frontend/
│   │   ├── class-frontend.php                 boot сайта + safe-area viewport
│   │   ├── class-assets.php                   compare.css/js + table.css/js, inline data
│   │   ├── class-colors.php                   derived colors from accent
│   │   ├── class-button-renderer.php          markup кнопок/счётчиков/clear/progress
│   │   ├── class-buttons.php                  auto-insert: loop + single (hooks + render_block)
│   │   ├── class-shortcodes.php               6 shortcodes (table + 5 из 0.3)
│   │   ├── class-comparison-page.php          ensure/select/reset/restore, noindex, append_table
│   │   ├── class-table-view.php               кэшируемая HTML-оболочка таблицы
│   │   ├── class-toasts.php                   тексты уведомлений
│   │   └── index.php
│   └── admin/
│       ├── class-admin.php                    меню RVN, link «Settings»
│       ├── class-settings-page.php            страница «Сравнение»
│       ├── class-page-settings.php            вкладка страницы сравнения
│       ├── class-table-settings.php           вкладка полей/групп таблицы
│       └── class-diagnostics-page.php         Tools → RVN Diagnostics
├── assets/
│   ├── js/compare.js                          список, кнопки, счётчики, toasts, tab sync
│   ├── js/table.js                            таблица: tabs, rows, diff, scroll (textContent only)
│   ├── css/compare.css                        кнопки, toasts, safe-area
│   └── css/table.css                          таблица, sticky col, arrows, empty
├── rvn-core/                                  общее ядро линейки (самая новая копия побеждает)
├── languages/                                 pot + ru_RU po/mo/l10n.php
└── index.php в каждой папке                   antifolder listing
```

## Именование

| Что | Значение |
| --- | --- |
| Папка, слаг, текст-домен | `rvn-compare-products-for-woocommerce` |
| Пространство имён плагина | `RVN_Compare` (подпространства: `RVN_Compare\Admin`, `RVN_Compare\Uninstall`) |
| Пространство имён общего ядра | `RVN_Core` |
| Константы | `RVN_COMPARE_*` |
| Хуки, опции, метаданные | `rvn_compare_*` |
| CSS-классы, handles, шорткоды | `rvn-compare-*` (ядро — `rvn-core-*`) |

Пространства имён совпадают с префиксом `rvn_compare`: Plugin Check определяет префикс плагина по корню пространства имён, поэтому один префикс во всём коде даёт чистую проверку (подробности — `docs/DECISIONS.md`).

## Последовательность запуска

1. **Главный файл** (синтаксис PHP 7.0+): константы → регистрация переводов на `init` → декларации WooCommerce на `before_woocommerce_init` → если PHP < 8.1, уведомление и выход.
2. Подключаются `rvn-core/bootstrap.php` (регистрация копии ядра) и автозагрузчик.
3. `plugins_loaded`, приоритет 1 — ядро: подключается самая новая копия, `Core::init()`.
4. `plugins_loaded`, приоритет 10 — `Plugin::boot()`: проверка WordPress и WooCommerce. Не выполнены — только уведомление. Выполнены — `Installer::init()`, в консоли `Admin::init()`, затем действие `rvn_compare_loaded`.
5. `admin_menu`, приоритет 10 — `Admin::register_product()` → `Core::add_product()`.
6. `admin_menu`, приоритет 90 — ядро строит меню: позиция посередине между «Маркетингом» и следующим пунктом (запасная — 58.9), подпункты, «Поддержка», удаление дубля «RVN».

## Данные

| Ключ | Где | Назначение | Удаляется |
| --- | --- | --- | --- |
| `rvn_compare_version` | опция сайта (автозагрузка) | версия данных для будущих обновлений | да |
| `rvn_compare_settings` | опция сайта | лимиты, категории, исключения, кнопки, toasts, **поля/группы таблицы**, колонки, noindex/auto_insert, `delete_data_on_uninstall` | да |
| `rvn_compare_page_id` | опция сайта | ID опубликованной страницы сравнения | да |
| `rvn_compare_page_backup` | опция сайта | резервная копия content после reset | да |
| `{префикс_сайта}rvn_compare_list` | метаданные пользователя | JSON `{"v":1,"ids":[…],"ts":…}` — список сравнения | да |

Своих таблиц в базе нет. Любой новый ключ данных нужно добавить в списки `uninstall.php`.

Список гостя хранится только в `localStorage` браузера (ключ с идентификатором сайта): сервер его не пишет, а принимает в запросе для проверки и возвращает вычисленное состояние. Так страницы остаются кешируемыми, а персональные данные не попадают в общий кэш.

## REST API: `rvn-compare/v1`

| Маршрут | Метод | Доступ | Суть |
| --- | --- | --- | --- |
| `/session` | GET | всем | Свежий ключ защиты, роль посетителя и лимиты; ответ помечен как приватный (`no-store`) — для страниц из кэша |
| `/list` | GET | всем | Состояние списка; гость передаёт свой список в параметре `ids` |
| `/items` | POST | nonce `wp_rest` | Добавить товар (`product_id`, `ids` для гостя) |
| `/items/remove` | POST | nonce | Удалить товар |
| `/clear` | POST | nonce | Очистить список |
| `/merge` | POST | nonce, 20/мин | Слияние гостевого списка со списком пользователя при входе |

Ответ — единое состояние: `status` (added, already, not_found, limit_total, limit_category, removed, cleared, merged, not_user, list), `ids`, `count`, `tabs`, `limits`, а для отказа — `reason` и `tab` с заполненной вкладкой. Бизнес-исходы возвращаются кодом 200 с полем `status`; 403 — неверный nonce, 400 — некорректный ID, 429 — превышена частота слияния. Адрес клиента для ограничения частоты хранится только хешем.

## Шорткоды

| Шорткод | Аргументы | Назначение |
| --- | --- | --- |
| `[rvn-compare-table]` | `class`, `products` | Таблица сравнения; без `products` — по списку посетителя (JS+REST); с `products` — статическая |
| `[rvn-compare-button]` | `id`, `mode`, `class` | Кнопка сравнения для товара; без аргументов — внутри карточки товара |
| `[rvn-compare-counter]` | `text`, `text_position`, `url`, `class` | Число товаров в списке |
| `[rvn-compare-counter-button]` | `label`, `mode`, `url`, `link`, `class` | Кнопка «Сравнение» со счётчиком |
| `[rvn-compare-clear]` | `label`, `scope`, `class` | Кнопка «Очистить всё» |
| `[rvn-compare-progress]` | `class` | «3 из 12» по текущей вкладке |

## Правила вывода на сайте

- Ассеты подключаются на `wp_enqueue_scripts` (регистрация приоритет 5, проверка необходимости 10, данные 99) — до этого хука очередь скриптов ещё не готова, а рендер блоков может запросить ассеты раньше.
- Файлы грузятся только на страницах с элементами сравнения: магазин, категории и метки, товар, корзина, поиск, главная или страница с нашим шорткодом.
- Данные для скрипта передаются inline-скриптом перед ним (`window.rvnCompareData`).
- Кнопка поверх изображения автоматически выносится из ссылки товара и переносится в контейнер изображения (`.woocommerce-product-gallery`, `.images`, `figure`), который получает `position: relative` — так все четыре угла точны и в классических, и в блочных шаблонах.
- Страница товара (классический шаблон): позиции `above_title` и `below_title` — хук `woocommerce_single_product_summary` с приоритетами 5 и 15; `before_cart` и `after_cart` — `woocommerce_before/after_add_to_cart_button`; позиции поверх изображения — `woocommerce_before_single_product_summary` с приоритетом 21 (после галереи).
- Уведомление: отсчёт ставится на паузу при наведении (`is-paused` + `animation-play-state: paused`) и продолжается с оставшегося времени.
- При активации плагин сбрасывает кэш страниц (WP Super Cache, W3 Total Cache, WP Rocket, LiteSpeed), чтобы закэшированные ранее страницы не отдавались без кнопок.

## Страница сравнения и таблица (0.4.0)

- `Installer` при activate/update вызывает `Comparison_Page::ensure()` и `flush_page_cache()`.
- `Comparison_Page::ensure()` не переписывает чужой контент: slug `compare` занят без shortcode → создаём `compare-products`.
- `the_content` (prio 8) + `auto_insert_table`: дописывает таблицу, если shortcode снят, но страница всё ещё выбранная.
- `Table_View::render()` отдаёт кэшируемую оболочку (`data-rvn-table`); колонки рисует `table.js` после `GET /table`.
- `Table_Fields::registry()`: core fields + WC attribute taxonomies + explicit meta (scalar, no leading `_`).
- `Table_Data::build()` — серверная сборка rows; значения нормализуются для diff (`smart_normalize`).
- Assets: `Assets::enqueue_table()` на comparison page или при shortcode `rvn-compare-table`; data → `window.rvnCompareTableData`.
- JS-правило: **никаких** названий/описаний через `innerHTML` — только `textContent` / `el()`.
- Admin: `Page_Settings` (create/select/reset/restore) и `Table_Settings` (fields/groups/meta/flags).

## Хуки для разработчиков

| Хук | Тип | С версии | Назначение |
| --- | --- | --- | --- |
| `rvn_compare_loaded` | action | 0.1.0 | Все компоненты плагина запущены |
| `rvn_compare_script_data` | filter | 0.3.0 | Данные, передаваемые скрипту сайта |
| `rvn_compare_button_html` | filter | 0.3.0 | Разметка кнопки сравнения |
| `rvn_compare_page_url` | filter | 0.3.0 | Адрес страницы сравнения, если она ещё не создана |
| `rvn_compare_shortcode_notice` | action | 0.3.0 | Шорткод вызван без обязательного аргумента (только при `WP_DEBUG`) |

API общего ядра (для плагинов линейки): `RVN_Core\Core::add_product( string $slug, array $args )` на `admin_menu` с приоритетом меньше 90. Сигнатура не меняется между версиями ядра.

## Правила безопасности (обязательны для всего кода)

- Каждый PHP-файл начинается с `defined( 'ABSPATH' ) || exit;` (у `uninstall.php` — `WP_UNINSTALL_PLUGIN`).
- Весь вывод экранируется в момент вывода: `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses_post()` для разметки.
- Каждое действие и каждая страница проверяют права (`manage_woocommerce` для настроек), даже если WordPress уже проверил их при входе в меню.
- Изменяющие запросы — только с nonce (`wp_verify_nonce`, `check_ajax_referer`, `permission_callback` в REST).
- Входные данные очищаются при записи (`sanitize_*`, `absint`, allowlist), выходные экранируются при выводе.
- Никаких прямых запросов к базе; если без них не обойтись — только `$wpdb->prepare()` и кэширование результата.
- Никаких внешних запросов, CDN, трекинга, `eval`, base64 и обфускации.
- Точки входа (главный файл, `uninstall.php`, `rvn-core/bootstrap.php`) — без синтаксиса PHP 7.1+.
