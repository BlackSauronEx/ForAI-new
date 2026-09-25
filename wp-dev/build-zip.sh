#!/usr/bin/env bash
# =============================================================================
# Сборка установочного ZIP плагина: только файлы плагина, без инструментов.
#
#   bash wp-dev/build-zip.sh
#
# Результат: public/downloads/rvn-compare-products-for-woocommerce-<версия>.zip
# и рядом файл .sha256. Перед сборкой сверяются версии в заголовке плагина,
# в константе RVN_COMPARE_VERSION и в Stable tag файла readme.txt.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="rvn-compare-products-for-woocommerce"
SRC="$ROOT/$SLUG"
OUT_DIR="$ROOT/public/downloads"

die() { printf 'Ошибка: %s\n' "$*" >&2; exit 1; }

HEADER="$(sed -n 's/^ \* Version: *//p' "$SRC/$SLUG.php" | head -1 | tr -d '[:space:]')"
CONSTANT="$(sed -n "s/^define( 'RVN_COMPARE_VERSION', '\([^']*\)' );/\1/p" "$SRC/$SLUG.php")"
STABLE="$(sed -n 's/^Stable tag: *//p' "$SRC/readme.txt" | tr -d '[:space:]')"

[ -n "$HEADER" ] || die "не найдена версия в заголовке плагина"
[ "$HEADER" = "$CONSTANT" ] || die "Version ($HEADER) и RVN_COMPARE_VERSION ($CONSTANT) расходятся"
[ "$HEADER" = "$STABLE" ] || die "Version ($HEADER) и Stable tag ($STABLE) расходятся"

if find "$SRC" -name '.*' -not -path "$SRC" | grep -q .; then
  die "в папке плагина есть скрытые файлы — каталог WordPress.org их не пропустит"
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
cp -R "$SRC" "$STAGE/$SLUG"

mkdir -p "$OUT_DIR"
ZIP="$OUT_DIR/$SLUG-$HEADER.zip"
ROOT_ZIP="$ROOT/$SLUG-$HEADER.zip"
rm -f "$ZIP" "$ZIP.sha256" "$ROOT_ZIP" "$ROOT_ZIP.sha256"
(cd "$STAGE" && zip -rqX "$ZIP" "$SLUG")
(cd "$OUT_DIR" && sha256sum "$(basename "$ZIP")" >"$(basename "$ZIP").sha256")
cp "$ZIP" "$ROOT_ZIP"
cp "$ZIP.sha256" "$ROOT_ZIP.sha256"

echo "Собрано:"
echo "  $ZIP"
echo "  $ROOT_ZIP"
echo "Размер: $(du -h "$ZIP" | cut -f1), файлов: $(unzip -Z1 "$ZIP" | grep -vc '/$')"
echo "SHA-256: $(cut -d' ' -f1 "$ZIP.sha256")"
