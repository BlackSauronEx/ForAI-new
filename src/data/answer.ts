export const ANSWER_TITLE = "Проверка 0.4.0 · статическое ревью завершено";

/** Полный текст текущего ответа — дублируется в правой панели целиком. */
export const ANSWER_MD = `# Проверка и доработка 0.4.0

Проверку начал. Провёл статическое ревью кода итерации 3, исправил найденные проблемы, добавил тестовое покрытие для таблицы и обновил handoff-документацию.

Важное ограничение: в текущем инструментальном сеансе доступна сборка Vite-дашборда, но не предоставлен исполняемый PHP/WP-CLI shell. Поэтому я **не выдаю 0.4.0 за проверенную**: runtime-прогоны стендов, Plugin Check и WP Super Cache нужно выполнить в сессии, где доступны PHP, WP-CLI, MariaDB и Playwright.

## Что проверено

### По коду

- Сверены три места версии: заголовок плагина, \`RVN_COMPARE_VERSION\`, \`Stable tag\` — везде **0.4.0**.
- Проверены REST-маршруты: \`/list\`, \`/table\`, \`/items\`, \`/items/remove\`, \`/clear\`, \`/merge\`.
- Проверены кэшируемая HTML-оболочка таблицы, динамический список гостя/пользователя, статический аргумент \`products\`, nonce recovery и uninstall-ключи.
- Проверены поля таблицы, категории, группы, подсветка различий, скрытие пустых строк и i18n-словарь.
- Проверено правило безопасности: данные товара в \`table.js\` создаются через \`textContent\` / DOM API, а не через \`innerHTML\`.

### По документации

Обновлены:

- \`docs/STATUS.md\` — отражает проведённое ревью и незакрытые runtime-проверки;
- \`docs/test-reports/0.4.0.md\` — создан честный промежуточный отчёт;
- \`docs/TESTING.md\` — добавлен режим table smoke и расширен чек-лист до 23 пунктов;
- \`docs/HANDOFF.md\` — добавлен новый критерий Definition of Done;
- \`src/data/project.ts\` — дашборд показывает дополнительные задачи.

## Что исправлено

1. **Гонка роли авторизованной вкладки.** До первого REST-ответа \`compare.js\` всегда начинал со значения \`guest\`. Теперь роль фиксируется сразу из \`data.isUser\`.
2. **Отключение групп таблицы.** Раньше исчезал только заголовок группы, а строки оставались. Теперь скрываются заголовок и строки.
3. **Boolean meta-поля.** Поля типа «Да/нет» преобразуются в локализуемые \`Yes/No\`, а не показывают сырые \`1/0\`.
4. **Проверка URL в shortcode.** Обход через домен вида \`example.com.evil.test\` больше не проходит проверку префиксом.
5. **Локализация заголовка страницы.** Автосозданная страница использует переводимый \`Product comparison\`.
6. **Toast close button.** Символ закрытия создаётся через \`textContent\`, без лишнего \`innerHTML\`.

## Добавленные проверки

- \`wp-dev/tests/rest-smoke.py\`: GET-проверки динамического \`/table?ids=…\` и статического \`/table?products=…\`.
- \`wp-dev/tests/core-logic.php\`: проверка сборки вкладок, колонок и цены через \`Table_Data::build()\`.
- \`wp-dev/e2e/table-smoke.cjs\`: временная статическая страница, Chromium, две колонки, строки, вкладки, screenshot и удаление страницы.
- \`wp-dev/check.sh table main|min\`: новый browser smoke режим.

## Что пока не подтверждено

Нужно выполнить по одной команде в среде с PHP/WP-CLI:

1. \`bash wp-dev/check.sh static\` — PHP 8.1–8.4, PHPCS, PHPStan, i18n.
2. \`bash wp-dev/check.sh tests main\`.
3. \`bash wp-dev/check.sh tests min\`.
4. \`bash wp-dev/check.sh stand main\`.
5. \`bash wp-dev/check.sh stand min\`.
6. \`bash wp-dev/check.sh table main\`.
7. \`bash wp-dev/check.sh table min\`.
8. \`bash wp-dev/check.sh pcp\`.
9. \`bash wp-dev/check.sh cache\`.
10. Ручной чек-лист таблицы из \`docs/TESTING.md\` на Storefront и блочной теме.

После появления PHP/WP-CLI нужно прогнать \`bash wp-dev/i18n.sh\`: он пересоберёт \`.pot\`, \`.po\`, бинарный \`.mo\` и \`.l10n.php\` после добавления строк \`Yes\` / \`No\`.

## Как восстановить стенды

\`stand.sh up\` — демон и не должен запускаться в foreground tool-вызове:

\`\`\`bash
setsid nohup bash wp-dev/stand.sh install </dev/null >/tmp/stand-install.log 2>&1 &
setsid nohup bash wp-dev/stand.sh up </dev/null >/tmp/stand-main.log 2>&1 &
setsid nohup bash wp-dev/stand.sh up --name=min --wp=6.4.7 --wc=8.2.0 --php=8.1 --port=8081 --locale=ru_RU \\
  </dev/null >/tmp/stand-min.log 2>&1 &
\`\`\`

Проверки запускать по одной: \`check.sh all\` слишком длинный для лимита инструмента.

## Файлы для ручного теста

- Папка: \`rvn-compare-products-for-woocommerce/\`
- ZIP: \`rvn-compare-products-for-woocommerce-0.4.0.zip\` (черновой артефакт; после runtime/i18n нужно пересобрать)
- Зеркало: \`public/downloads/rvn-compare-products-for-woocommerce-0.4.0.zip\`

0.4.0 всё ещё черновик. Последняя закрытая пользователем версия — 0.3.1.

## Следующий шаг

В следующей сессии с доступным PHP/WP-CLI нужно пройти команды из раздела «Что пока не подтверждено», исправить красные результаты, сделать скриншоты таблицы и только после этого перевести статус 0.4.0 из «черновик» в «проверена».
`;