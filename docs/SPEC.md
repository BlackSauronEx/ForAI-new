# RVN Compare — спецификация (сжатая v0.9 + итерация 3)

Это рабочая спецификация для разработки в чате. Полный исходный список из 91+
вопросов жил в старом `src/lib/questions.ts` (146 КБ) и сюда **не** копируется:
все принятые решения уже сжаты в `docs/DECISIONS.md`, а требования — ниже.

Если решение противоречит этому файлу — побеждает `docs/DECISIONS.md`
(там есть причина). Если оба молчат — спросить пользователя, не угадывать.

---

## 1. Продукт

**Имя:** RVN Compare Products for WooCommerce  
**Слаг / папка / text-domain / главный файл:**
`rvn-compare-products-for-woocommerce`  
**Автор:** Revolen  
**Лицензия:** GPL-2.0-or-later  
**Требования:** WordPress 6.4+, PHP 8.1+, WooCommerce 8.2+  
**Проверено до:** WordPress 7.1.x, WooCommerce 11.1, PHP 8.4  
**Цель:** пройти автоматический и ручной аудит WordPress.org без замечаний.
Безопасность важнее скорости разработки.

Покупатель нажимает «Сравнить» на карточке или странице товара, копит
короткий список, открывает страницу сравнения и видит характеристики
бок о бок. Гость хранит список в браузере; авторизованный — в профиле;
при входе списки аккуратно сливаются.

---

## 2. Именование (жёстко)

| Что | Значение |
| --- | --- |
| PHP namespace плагина | `RVN_Compare` (+ `Admin`, `Frontend`, `Rest`, `Uninstall`) |
| PHP namespace ядра линейки | `RVN_Core` |
| Константы | `RVN_COMPARE_*` |
| Опции, meta, hooks | `rvn_compare_*` |
| CSS / JS / handles / shortcodes | `rvn-compare-*` (ядро: `rvn-core-*`) |
| REST namespace | `rvn-compare/v1` |

Один префикс во всём коде — требование Plugin Check (префикс выводится из
корня namespace). Не возвращаться к `Revolen\…`.

---

## 3. Совместимость и окружение

- HPOS, Cart/Checkout blocks, product block editor — декларировать.
- `Requires Plugins: woocommerce` (WP 6.5+ сам блокирует неверные активации;
  наше уведомление — страховка для 6.4 / WP-CLI / multisite).
- Классические **и** блочные темы. Авто-кнопки — через хуки WooCommerce
  **и** `render_block`. Нестандартные конструкторы — только через shortcode,
  точечную подгонку не делаем.
- Кэш страниц (WP Super Cache и аналоги): HTML без персональных данных;
  список и таблица подгружаются JS-ом; `GET /session` отдаёт свежий nonce.
- Устройства пользователя: Android. iOS/Safari — «не проверено».
- Мультисайт: сетевая активация **не** перебирает сайты; install ленивый.

---

## 4. Данные

Своих таблиц БД **нет**.

| Ключ | Где | Назначение | Uninstall |
| --- | --- | --- | --- |
| `rvn_compare_version` | option | версия данных | да |
| `rvn_compare_settings` | option | все настройки | да |
| `rvn_compare_page_id` | option | ID страницы сравнения | да |
| `rvn_compare_page_backup` | option | бэкап контента после reset | да |
| `{blog_prefix}rvn_compare_list` | user meta | JSON `{"v":1,"ids":[…],"ts":…}` | да |

Гостевой список — **только** `localStorage` (ключ с идентификатором сайта).
Сервер его не пишет: принимает в запросе, нормализует, возвращает состояние.

`delete_data_on_uninstall` (default `true`). Страницу сравнения при uninstall
**не** удаляем (контент пользователя).

Любой новый ключ — сразу в `uninstall.php`.

---

## 5. Лимиты и категории

- Лимит всего: **1…50**, default 50.
- Лимит на вкладку (категория/группа): **1…limit_total**, default 12.
- **Железное правило:** заполненная вкладка блокирует добавление; в ответе —
  `status: limit_category`, `reason`, `tab` с заполненной вкладкой.
- Вкладки = прямые категории товара. Правила: `assigned` (default) /
  `top_level` / `flat` (без разделения).
- Игнорируемые категории, группы категорий (категория ∈ одна группа),
  группа «Прочее» с редактируемым названием.
- Исключения товаров и категорий для **авто-кнопок** (контексты `card` /
  `single`); исключение побеждает. Shortcode исключения **не** слушает.

---

## 6. REST API `rvn-compare/v1`

| Маршрут | Метод | Доступ | Назначение |
| --- | --- | --- | --- |
| `/session` | GET | всем | Свежий nonce, роль, лимиты; `Cache-Control: no-store` |
| `/list` | GET | всем | Состояние списка; гость передаёт `ids` |
| `/table` | GET | всем | Данные таблицы по `ids` (+ опционально fixed products) |
| `/items` | POST | nonce `wp_rest` | Добавить |
| `/items/remove` | POST | nonce | Удалить |
| `/clear` | POST | nonce | Очистить (опц. scope вкладки) |
| `/merge` | POST | nonce, 20/мин | Слияние при входе |

Единый shape ответа: `status`, `ids`, `count`, `tabs`, `limits`;
для отказа — `reason`, `tab`. Бизнес-исходы → HTTP 200 + `status`;
протокол (nonce/validation/throttle) → 403/400/429.
IP для throttle хранится **хешем**.

Форма URL в тестах: `?rest_route=/rvn-compare/v1/…` (работает при любых permalinks).

---

## 7. Кнопки, счётчики, уведомления (итерация 2 — готово)

- 9 позиций на карточке и на single; classic hooks + block templates.
- Режимы: `icon_text` / `icon` / `text`; отдельно desktop/mobile
  (mobile single может `inherit`).
- Состояния: «Сравнить» / «Уже в сравнении»; повторный клик → remove.
- Overlay-позиции: JS выносит кнопку в контейнер изображения
  (`.woocommerce-product-gallery`, `.images`, `figure`) + `position: relative`.
- Счётчик, кнопка-счётчик, clear, progress — live без reload.
- Toasts: added / removed / cleared / limit_total / limit_category;
  countdown, close, **Undo** (направление задаётся явно), pause on hover;
  safe-area + `viewport-fit=cover`.
- Tab sync: `storage` + `BroadcastChannel` + `visibilitychange` + `pageshow`.
- Assets только на страницах с элементами сравнения; data — inline
  `window.rvnCompareData` через `wp_add_inline_script`.

Shortcodes (все с `class`):

- `[rvn-compare-button]` — `id`, `mode`
- `[rvn-compare-counter]` — `text`, `text_position`, `url`
- `[rvn-compare-counter-button]` — `label`, `mode`, `url`, `link`
- `[rvn-compare-clear]` — `label`, `scope`
- `[rvn-compare-progress]`

---

## 8. Страница сравнения и таблица (итерация 3 — в коде, не проверена)

### 8.1 Страница

- При activate/update `Comparison_Page::ensure()` создаёт страницу
  со slug `compare` и контентом `[rvn-compare-table]`.
- Если slug занят **чужой** страницей без нашего shortcode — не трогаем,
  создаём `compare-products` (или уникальный).
- Если найден existing с нашим shortcode — просто запоминаем ID.
- Опция `rvn_compare_page_id`. Метка «Comparison page» в списке страниц.
- `noindex_compare_page` (default true) → `wp_robots`.
- `auto_insert_table` (default true): если админ стёр shortcode,
  `the_content` аккуратно дописывает таблицу (приоритет 8).
- Admin actions: create / select / reset (с backup) / restore.
- Заголовок страницы по `get_locale()`: «Сравнение товаров» / «Product comparison».

### 8.2 Shortcode таблицы

`[rvn-compare-table class="" products=""]`

- Без `products` — таблица по текущему списку посетителя (через JS + REST).
- С `products="1,2,3"` — статическая таблица этих ID (data-static=1).
- HTML-оболочка **без персональных данных** (кэшируема); колонки рисует JS.

### 8.3 Поля и группы

Базовые поля (порядок):

`price`, `sku`, `availability`, `rating`, `brand` (если есть `product_brand`),
`weight`, `dimensions`, `short_description`, `description` (default off).

Группы default: `basic`, `size`, `specifications` (лейблы из i18n, в БД пустые).

Плюс:

- все глобальные атрибуты WC как `attribute:{taxonomy}`;
- ручные meta-поля (только скаляр, без ведущего `_`);
- `new_attributes_enabled` (default true) — новые атрибуты сразу в таблице;
- `hide_unassigned_attributes` (default true);
- `hide_empty_rows` (default false);
- `highlight_differences` (default true) + `difference_color` (`#ffcfcc`);
- `show_difference_toggle` (default true) — чекбокс «Only differences»;
- `term_tooltips` (default true);
- `smart_normalize` (default true) — нормализация значений для сравнения;
- `attribute_values_layout`: `auto` | …;
- колонки: desktop 5 / tablet 3 / phone 2;
- breakpoints: tablet 1024 / phone 768 (phone < tablet enforced);
- `scrollbar_mode`: `hidden` default.

### 8.4 REST `/table`

Возвращает tabs + columns + rows по переданным `ids`.  
Сервер отдаёт **текст**, клиент рисует через `textContent` (никакого
`innerHTML` с названиями товаров и атрибутов).

### 8.5 JS `table.js` / CSS `table.css`

- Зависит от `compare.js` (core).
- Data: `window.rvnCompareTableData` (restUrl, columns, breakpoints, flags…).
- Вкладки категорий, горизонтальный скролл стрелками, sticky first column,
  clear tab / clear all, empty state со ссылкой в магазин.
- Handle: `rvn-compare-table`.

### 8.6 Admin

- `class-table-settings.php` — поля, группы, meta, flags таблицы.
- `class-page-settings.php` — выбор/создание/reset/restore страницы,
  auto-insert, noindex.

---

## 9. Безопасность (обязательно всегда)

- Каждый PHP-файл: `defined( 'ABSPATH' ) || exit;` (`uninstall.php` —
  `WP_UNINSTALL_PLUGIN`).
- Escape на выводе: `esc_html` / `esc_attr` / `esc_url` / `wp_kses_post`.
- Capabilities: `manage_woocommerce` для настроек.
- Nonce на каждое изменяющее действие (REST + admin_post).
- Sanitize на входе; ID — `(int)` / собственная нормализация, **не** `absint`
  для значений, которые могут быть отрицательными (absint(-1) → 1).
- Нет прямых SQL без `$wpdb->prepare`; своих таблиц нет.
- Нет `eval`, `create_function`, base64-обфускации, удалённого кода.
- JS: пользовательские строки — только `textContent` / `el()`.

---

## 10. i18n

- Text domain = слаг.
- Встроенный ru_RU (`.po` / `.mo` / `.l10n.php`) — требование пользователя.
- Источник строк для сборки: `wp-dev/i18n/ru_RU.json` + `wp-dev/i18n.sh`.
- User-facing строки в PHP/JS — через `__()` / `_e()` / `wp.i18n` (если есть).
- Перед релизом: все новые строки таблицы должны быть в словаре.

---

## 11. RVN Core (линейка)

- Копия `rvn-core/` в каждом плагине линейки; загружается **самая новая**.
- Меню «RVN» со значком «R» (текстовый символ в CSS) сразу после Marketing.
- API: `RVN_Core\Core::add_product( string $slug, array $args )` на `admin_menu`
  priority < 90. Сигнатура стабильна.
- Подстраницы: «Сравнение», «Поддержка» (заглушка).

---

## 12. Вне scope до отдельного решения

- Экспорт сравнения в PDF/CSV.
- Сравнение вариаций как отдельных карточек (вариации отбрасываются —
  только parent/simple/…).
- Точечная поддержка Avada / Elementor / и т.п.
- WCAG 2.1 AA как формальный аудит (делаем по норме, не заявляем).
- Подача в wordpress.org (отдельный чек-лист «Перед подачей в каталог»).

---

## 13. Итерации

| # | Версия | Содержание | Статус |
| --- | --- | --- | --- |
| 0 | 0.1.0 | Каркас, RVN menu, requirements, i18n, uninstall | ✅ |
| 1 | 0.2.0 | Storage, limits, categories, REST, diagnostics | ✅ |
| 2 | 0.3.0 | Buttons, counters, toasts, shortcodes, tab sync | ✅ |
| 2a | 0.3.1 | Storefront fixes, undo, overlay, cache flush | ✅ |
| 3 | 0.4.0 | Comparison page + table + fields + `/table` | ⚠️ код есть |
| 4+ | TBD | Design polish, export?, a11y pass, .org submit | — |
