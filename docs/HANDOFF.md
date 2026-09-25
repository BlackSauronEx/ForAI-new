# Передача смены — как подхватить проект в новом чате

Этот документ написан **для модели** и для пользователя, который скачает
всю рабочую область и отдаст её в новый чат. Цель: продолжить работу над
плагином **без потери задач, решений и контекста**.

---

## 0. Что это за проект

**RVN Compare Products for WooCommerce** — WordPress-плагин сравнения товаров.
Линейка RVN / автор Revolen. Цель — чистый аудит WordPress.org.

Текущая рабочая область = **плагин + стенды + документация + Vite-дашборд**.
Дашборд (React/Vite) — только для предпросмотра ответа и статуса; **не** часть
плагина и **не** то, что ставится на сайт пользователя.

---

## 1. Что прочитать (в этом порядке, не всё сразу)

| # | Файл | Зачем | Размер |
| --- | --- | --- | --- |
| 1 | `docs/STATUS.md` | Где мы, что сломано/не закончено, следующий шаг | ~8 КБ |
| 2 | `docs/SPEC.md` | Сжатые требования продукта | ~12 КБ |
| 3 | `docs/DECISIONS.md` | Почему сделано так, а не иначе | ~12 КБ |
| 4 | `docs/ARCHITECTURE.md` | Карта кода и правила безопасности | ~12 КБ |
| 5 | `docs/TESTING.md` | Как поднимать стенды и что гонять | ~9 КБ |
| 6 | `CHANGELOG.md` | История 0.1.0 → 0.4.0-draft | ~8 КБ |
| 7 | `docs/test-reports/0.3.1.md` | Последний **закрытый** отчёт | ~5 КБ |

**Не читать целиком:** `languages/*`, бинарный `.mo`, `assets/js/*.js` подряд,
все 47 PHP-файлов сразу. PHP — **по одному**, когда правишь конкретное место.

**Не копировать / не трогать:** корневой `package.json`, `vite.config.ts`,
`tsconfig.json`, `index.html` шаблона Vite — это сборка дашборда, не плагина.

---

## 2. Фактическое состояние на момент handoff

```
Проверено пользователем:     0.3.1  ✅
В коде, версия выставлена:   0.4.0  ⚠️  (итерация 3, страница + таблица)
Тесты 0.4.0:                 runtime не прогнаны
CHANGELOG 0.4.0:             черновая запись есть
test-reports/0.4.0.md:       есть, фиксирует незакрытые проверки
WP Super Cache на стенде:    ещё не закрыто (требование с хостинга пользователя)
```

Три места версии **согласованы на 0.4.0**:

- заголовок `rvn-compare-products-for-woocommerce.php`
- константа `RVN_COMPARE_VERSION`
- `Stable tag` в `readme.txt`

Код итерации 3 (уже в дереве):

- `includes/frontend/class-comparison-page.php`
- `includes/frontend/class-table-view.php`
- `includes/class-table-fields.php`
- `includes/class-table-data.php`
- `includes/admin/class-page-settings.php`
- `includes/admin/class-table-settings.php`
- `assets/js/table.js`, `assets/css/table.css`
- REST `GET /table`, shortcode `[rvn-compare-table]`
- uninstall keys: `rvn_compare_page_id`, `rvn_compare_page_backup`

---

## 3. Первый ход в новом чате

1. Прочитай `docs/STATUS.md` и `docs/HANDOFF.md` (этот файл).
2. Кратко перескажи пользователю: этап, риски, следующий шаг. **Ничего не делай**, пока он не подтвердит.
3. Если он говорит «проверяй 0.4.0» — иди по `docs/TESTING.md`:
   - `setsid nohup bash wp-dev/stand.sh install … &` (не в foreground)
   - `setsid nohup bash wp-dev/stand.sh up … &` для main и min
   - `check.sh static` → `tests` → `stand` → `pcp` → `cache` **по одной команде**
4. Чини только то, что красное. После зелёного — отчёт, CHANGELOG, STATUS, ZIP.
5. Каждый ответ в чате заканчивай блоком **«Следующий шаг»**.
6. Текст текущего ответа дублируй в `src/data/answer.ts` (`ANSWER_MD`), чтобы
   правая панель дашборда показывала его целиком (чат обрезает).

---

## 4. Структура рабочей области

```
.
├── README.md                      # для человека
├── docs/
│   ├── HANDOFF.md                 # этот файл — для модели
│   ├── STATUS.md                  # источник правды «где мы»
│   ├── SPEC.md                    # сжатое ТЗ
│   ├── DECISIONS.md               # реестр решений
│   ├── ARCHITECTURE.md            # карта кода + security
│   ├── TESTING.md                 # стенды и чек-листы
│   └── test-reports/              # 0.1.0 … 0.3.1; 0.4.0 — после прогона
├── CHANGELOG.md
├── rvn-compare-products-for-woocommerce/   # ← ПРОДУКТ, его отдаём пользователю
├── rvn-compare-products-for-woocommerce-0.4.0.zip  # draft artifact; rebuild after checks
├── public/downloads/…0.4.0.zip (+ .sha256)          # draft artifact; rebuild after checks
├── wp-dev/                        # стенды и проверки (не в ZIP плагина)
│   ├── stand.sh                   # install / up / down / status
│   ├── check.sh                   # static tests stand pcp cache
│   ├── build-zip.sh
│   ├── i18n.sh + i18n/
│   ├── seed.php
│   ├── e2e/                       # Playwright
│   └── tests/                     # core-logic.php, rest-smoke.py
├── src/                           # Vite-дашборд (статус + полный ответ)
│   ├── App.tsx
│   ├── data/answer.ts             # текущий ответ для правой панели
│   └── data/project.ts            # сводка статуса для дашборда
├── package.json                   # Vite-дашборд; НЕ пакет плагина
├── vite.config.ts
└── index.html
```

---

## 5. Запреты (сломают чат или сборку)

| Действие | Почему нельзя |
| --- | --- |
| Перезаписать корневой `package.json` / `tsconfig.json` / `vite.config.ts` | Дашборд собирается Vite; откат невозможен |
| Тащить сюда Next.js / drizzle / `src/app/**` из старого ForAI | Другой runtime, `DATABASE_URL` throw при импорте |
| `bash wp-dev/stand.sh up` в foreground tool-вызова | Демон → hang → чат «умер» |
| `bash wp-dev/stand.sh install` без `setsid nohup … &` | ~2 мин + apt → таймаут |
| Читать/копировать `*.mo` текстовыми инструментами | Бинарник → цикл ошибок |
| Копировать 100+ файлов «на всякий случай» | Лимит шагов / токенов |
| Одна команда `check.sh all` | Упирается в лимит времени tool |
| Менять префикс `rvn_compare` / namespace `RVN_Compare` | Plugin Check + все решения |

---

## 6. Доставка пользователю

Пользователь забирает **папку** `rvn-compare-products-for-woocommerce/`
(его файловый браузер плохо отдаёт бинарные ZIP — но ZIP мы всё равно кладём
в `public/downloads/` и в корень как релизный артефакт).

Установка: Плагины → Добавить → Загрузить → ZIP → Activate. Нужен WooCommerce 8.2+.

Инструкции к каждой сборке — точные, пошаговые (требование пользователя).
Устройства пользователя: Android. iOS — «не проверено».

---

## 7. Окружение пользователя (не забывать)

- Хостинг: openresty, PHP 8.3.33, 256 МБ, **Storefront 4.6.2**, HPOS,
  **WP Super Cache**, Query Monitor, Plugin Check.
- Локально: Local WP (есть WP-CLI).
- Урок 2a: авто-вставку кнопок проверять на **классической и блочной** теме.
- Сценарий «список/таблица поверх закэшированной страницы» — обязателен для 0.4.0.

---

## 8. Definition of Done для 0.4.0

- [ ] `check.sh static` — 0 errors / 0 warnings (включая i18n)
- [ ] `check.sh tests main` и `tests min` — green (включая `/table`)
- [ ] `check.sh stand main` и `stand min` — green
- [ ] `check.sh table main` и `table min` — browser table smoke + screenshot
- [ ] `check.sh pcp` — Plugin Check clean
- [ ] `check.sh cache` — Super Cache scenario green
- [ ] Ручной чек-лист таблицы из `docs/TESTING.md`
- [x] `docs/test-reports/0.4.0.md` написан; runtime-результаты ещё не внесены
- [ ] `CHANGELOG.md` + `readme.txt` Changelog — дата и статус «готово»
- [ ] `docs/STATUS.md` — этап «0.4.0 проверена»
- [ ] ZIP пересобран, sha256 обновлён
- [ ] `src/data/answer.ts` — отчёт пользователю с чек-листом ручной проверки

Пока любой пункт открыт — в STATUS и в ответах писать **«черновик 0.4.0»**,
не «релиз».
