/** Сводка проекта для дашборда. Источник правды по статусу — docs/STATUS.md. */

export type BuildStatus = "done" | "draft" | "planned";

export type Build = {
  version: string;
  name: string;
  status: BuildStatus;
  notes: string;
};

export type DocFile = {
  path: string;
  role: string;
  readFirst?: boolean;
};

export type OpenTask = {
  id: string;
  title: string;
  detail: string;
  priority: "p0" | "p1" | "p2";
};

export const PROJECT = {
  name: "RVN Compare Products for WooCommerce",
  slug: "rvn-compare-products-for-woocommerce",
  author: "Revolen",
  license: "GPL-2.0-or-later",
  requires: { wp: "6.4+", php: "8.1+", wc: "8.2+" },
  testedUpTo: { wp: "7.1.x", wc: "11.1", php: "8.4" },
  latestProven: "0.3.1",
  currentCode: "0.4.0",
  currentLabel: "черновик",
  stage: "Итерация 3 — страница сравнения и таблица",
  nextStep:
    "Прогнать check.sh (static → tests → stand → pcp → cache), закрыть ручной чек-лист таблицы, написать docs/test-reports/0.4.0.md, обновить CHANGELOG/STATUS, отдать ZIP.",
  zipPath: "rvn-compare-products-for-woocommerce-0.4.0.zip",
  zipPublic: "public/downloads/rvn-compare-products-for-woocommerce-0.4.0.zip",
  pluginDir: "rvn-compare-products-for-woocommerce/",
  repoUrl: "https://github.com/BlackSauronEx/ForAI",
  updatedAt: "24.09.2026",
};

export const BUILDS: Build[] = [
  {
    version: "0.1.0",
    name: "Каркас",
    status: "done",
    notes: "Требования, меню RVN, i18n, uninstall, декларации Woo.",
  },
  {
    version: "0.2.0",
    name: "Ядро сравнения",
    status: "done",
    notes: "Storage, limits 50/12, categories, REST list/items/clear/merge, диагностика.",
  },
  {
    version: "0.3.0",
    name: "Кнопки и счётчики",
    status: "done",
    notes: "9 позиций, toasts, 5 shortcodes, tab sync, cache-friendly.",
  },
  {
    version: "0.3.1",
    name: "Фиксы Storefront",
    status: "done",
    notes: "Classic hooks, undo, overlay, cache flush. Закрыто отчётом пользователя.",
  },
  {
    version: "0.4.0",
    name: "Страница и таблица",
    status: "draft",
    notes:
      "Comparison_Page, Table_View/Fields/Data, REST /table, table.js/css, admin Page+Table. Тесты не прогнаны.",
  },
  {
    version: "0.5.0+",
    name: "Дизайн / .org",
    status: "planned",
    notes: "Polish, a11y pass, экспорт?, подача в wordpress.org.",
  },
];

export const DOCS: DocFile[] = [
  { path: "docs/STATUS.md", role: "Где мы и что делать дальше", readFirst: true },
  { path: "docs/HANDOFF.md", role: "Как подхватить проект в новом чате", readFirst: true },
  { path: "docs/SPEC.md", role: "Сжатое ТЗ (вместо 200 КБ questions/spec.ts)" },
  { path: "docs/DECISIONS.md", role: "Реестр решений с причинами (0–3)" },
  { path: "docs/ARCHITECTURE.md", role: "Карта кода, REST, security-правила" },
  { path: "docs/TESTING.md", role: "Стенды, check.sh, чек-лист 0.4.0" },
  { path: "CHANGELOG.md", role: "История 0.1.0 → 0.4.0-draft" },
  { path: "docs/test-reports/0.3.1.md", role: "Последний закрытый отчёт" },
  { path: "README.md", role: "Обзор рабочей области для человека" },
];

export const OPEN_TASKS: OpenTask[] = [
  {
    id: "t1",
    title: "check.sh static",
    detail: "PHP 8.1–8.4 syntax, PHP 7.0 entrypoints, WPCS, PHPStan 6, i18n словарь для новых строк таблицы.",
    priority: "p0",
  },
  {
    id: "t2",
    title: "tests main + min",
    detail: "core-logic.php и rest-smoke.py: добавить/прогнать покрытие GET /table и Comparison_Page::ensure.",
    priority: "p0",
  },
  {
    id: "t3",
    title: "stand main + min",
    detail: "main = Storefront; min = WP 6.4.7 + WC 8.2 + PHP 8.1 + ru_RU. Активация, WP_DEBUG, uninstall.",
    priority: "p0",
  },
  {
    id: "t4",
    title: "Plugin Check (pcp)",
    detail: "0 errors / 0 warnings на установленном плагине.",
    priority: "p0",
  },
  {
    id: "t5",
    title: "cache scenario",
    detail: "WP Super Cache: таблица и список поверх закэшированной страницы, nonce recovery через /session.",
    priority: "p0",
  },
  {
    id: "t6",
    title: "Ручной чек-лист таблицы",
    detail: "22 пункта в docs/TESTING.md: ensure page, tabs, diff, static shortcode, no innerHTML, ru_RU, uninstall keeps page.",
    priority: "p0",
  },
  {
    id: "t6b",
    title: "table-smoke + скриншоты",
    detail: "Браузерная проверка динамической страницы и временного статического shortcode на main и min.",
    priority: "p0",
  },
  {
    id: "t7",
    title: "Отчёт и документация",
    detail: "docs/test-reports/0.4.0.md, дата в CHANGELOG, STATUS → «проверена», пересборка ZIP.",
    priority: "p1",
  },
  {
    id: "t8",
    title: "i18n строк таблицы",
    detail: "Все новые __() из table-view/fields/page-settings в wp-dev/i18n/ru_RU.json → i18n.sh.",
    priority: "p1",
  },
];

export const VERSION_TRUTH = [
  { place: "Plugin header Version:", value: "0.4.0", ok: true },
  { place: "RVN_COMPARE_VERSION", value: "0.4.0", ok: true },
  { place: "readme.txt Stable tag", value: "0.4.0", ok: true },
  { place: "CHANGELOG.md top entry", value: "0.4.0 ЧЕРНОВИК", ok: true },
  { place: "readme.txt Changelog", value: "0.4.0 draft note", ok: true },
  { place: "docs/test-reports/0.4.0.md", value: "есть, runtime pending", ok: false },
  { place: "ZIP после правок этой сессии", value: "нужно пересобрать", ok: false },
  { place: "Архитектура / STATUS", value: "обновлены под 0.4.0-draft", ok: true },
];

export const NEW_04_FILES = [
  { path: "includes/frontend/class-comparison-page.php", bytes: 10403 },
  { path: "includes/frontend/class-table-view.php", bytes: 4631 },
  { path: "includes/class-table-fields.php", bytes: 12917 },
  { path: "includes/class-table-data.php", bytes: 12164 },
  { path: "includes/admin/class-page-settings.php", bytes: 6954 },
  { path: "includes/admin/class-table-settings.php", bytes: 14244 },
  { path: "assets/js/table.js", bytes: 21333 },
  { path: "assets/css/table.css", bytes: 13240 },
];

export const FEATURES_04 = [
  "Автостраница compare / compare-products + shortcode [rvn-compare-table]",
  "REST GET /rvn-compare/v1/table (tabs/columns/rows)",
  "Поля: price sku availability rating brand weight dimensions short_description description",
  "Глобальные атрибуты WC + явные meta; группы basic/size/specifications",
  "Only differences, highlight, hide empty rows, smart_normalize, tooltips",
  "table.js: tabs, arrows, sticky col, empty state, clear tab/all (textContent only)",
  "Admin: Page_Settings (create/select/reset/restore) + Table_Settings",
  "uninstall: rvn_compare_page_id + rvn_compare_page_backup; страницу не удаляет",
];

export const HOST = {
  stack: "openresty · PHP 8.3.33 · 256 МБ",
  theme: "Storefront 4.6.2 (классическая)",
  flags: "HPOS · WP Super Cache · Query Monitor · Plugin Check",
  devices: "Android only · iOS/Safari = не проверено",
  local: "Local WP (WP-CLI Site Shell)",
  lesson: "Авто-вставку проверять на классической и блочной теме (урок 2a).",
};

export const FORBIDDEN = [
  "Перезаписывать package.json / vite.config.ts / tsconfig.json корня",
  "Тащить Next.js, drizzle, src/app/**, src/lib/questions.ts из старого ForAI",
  "stand.sh up или install в foreground tool-вызова (только setsid nohup … &)",
  "Читать/копировать languages/*.mo текстовыми инструментами",
  "Одна команда check.sh all (лимит времени) — только по одной",
  "Менять префикс rvn_compare / namespace RVN_Compare",
];

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / 1024 / 1024).toFixed(2)} МБ`;
}
