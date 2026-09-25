# RVN Compare — рабочая область

Плагин **RVN Compare Products for WooCommerce** + инструменты проверки +
документация, достаточная чтобы новый чат (или новый разработчик) подхватил
работу без потери задач.

## Сейчас

| | |
| --- | --- |
| Последняя **проверенная** сборка | **0.3.1** |
| В коде | **0.4.0** (итерация 3: страница сравнения и таблица) — **черновик** |
| Следующий шаг | Прогнать стенды и тесты по 0.4.0, закрыть отчёт, отдать вам |

Подробности: [`docs/STATUS.md`](docs/STATUS.md).  
Как подхватить в новом чате: [`docs/HANDOFF.md`](docs/HANDOFF.md).

## Скачать плагин для ручных тестов

- Папка: [`rvn-compare-products-for-woocommerce/`](rvn-compare-products-for-woocommerce/)
- ZIP: [`rvn-compare-products-for-woocommerce-0.4.0.zip`](rvn-compare-products-for-woocommerce-0.4.0.zip)
- Зеркало: [`public/downloads/`](public/downloads/)

> 0.4.0 ещё **не** прогнан через полный цикл `wp-dev/check.sh`. ZIP в рабочей области — черновой артефакт; после runtime/i18n-проверок его нужно пересобрать.
> На своём сайте ставьте понимая, что это черновик итерации 3.
> Стабильная проверенная — 0.3.1 (её код является основой, 0.4.0 поверх).

Установка: **Плагины → Добавить новый → Загрузить плагин → ZIP → Установить →
Активировать.** Нужен активный WooCommerce 8.2+.

## Документация

| Файл | Содержание |
| --- | --- |
| [`docs/STATUS.md`](docs/STATUS.md) | Где мы, открытые задачи |
| [`docs/SPEC.md`](docs/SPEC.md) | Сжатое ТЗ |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Реестр решений с причинами |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Карта кода, security |
| [`docs/TESTING.md`](docs/TESTING.md) | Стенды, check.sh, чек-листы |
| [`docs/HANDOFF.md`](docs/HANDOFF.md) | Инструкция для следующей сессии |
| [`CHANGELOG.md`](CHANGELOG.md) | 0.1.0 → 0.4.0-draft |
| [`docs/test-reports/`](docs/test-reports/) | Отчёты по сборкам |

## Стенды и проверки (для модели / CI)

```bash
setsid nohup bash wp-dev/stand.sh install </dev/null >/tmp/stand-install.log 2>&1 &
setsid nohup bash wp-dev/stand.sh up </dev/null >/tmp/stand-main.log 2>&1 &
setsid nohup bash wp-dev/stand.sh up --name=min --wp=6.4.7 --wc=8.2.0 --php=8.1 --port=8081 --locale=ru_RU \
  </dev/null >/tmp/stand-min.log 2>&1 &

bash wp-dev/check.sh static
bash wp-dev/check.sh tests main
bash wp-dev/check.sh stand main
bash wp-dev/check.sh pcp
bash wp-dev/build-zip.sh
```

`stand.sh up` — **демон**, в foreground tool-вызове зависает. Подробности и
запреты — в `docs/HANDOFF.md` и `docs/TESTING.md`.

## Дашборд предпросмотра

`src/` + Vite — страница статуса и **полный текст текущего ответа** (чат
обрезает; правая панель — нет). К плагину не относится.
