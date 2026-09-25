/**
 * Браузерная проверка консоли WordPress для плагина RVN Compare.
 *
 * Запуск:
 *   NODE_PATH=/tmp/wp-tools/pw/node_modules node wp-dev/e2e/admin-smoke.cjs <url> <стенд> <папка-скриншотов> [menu|requirements]
 *
 * menu          — меню «RVN» сразу после «Маркетинга», значок «R», подпункты без дубля,
 *                 клик открывает «Сравнение», страница «Поддержка», ссылка «Настройки».
 * requirements  — WooCommerce выключен: плагин показывает уведомление и не добавляет меню.
 *
 * Результат — JSON в stdout; код выхода 0, если все проверки пройдены.
 */
const { chromium } = require('playwright');

const SLUG = 'rvn-compare-products-for-woocommerce';

(async () => {
	const [url, stand, outDir, mode = 'menu'] = process.argv.slice(2);
	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
	const jsErrors = [];
	const result = { stand, mode, checks: [] };
	const check = (name, ok, detail = '') => result.checks.push({ name, ok: Boolean(ok), detail: String(detail) });

	page.on('pageerror', (error) => jsErrors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error') {
			jsErrors.push(message.text());
		}
	});

	await page.goto(`${url}/wp-login.php`);
	await page.fill('#user_login', 'admin');
	await page.fill('#user_pass', 'admin');
	await Promise.all([page.waitForNavigation(), page.click('#wp-submit')]);

	if (mode === 'requirements') {
		await page.goto(`${url}/wp-admin/plugins.php`);
		const notice = page.locator('.rvn-compare-requirements-notice');
		const text = (await notice.count()) ? (await notice.innerText()).replace(/\s+/g, ' ').trim() : '';
		check('Уведомление о требованиях показано', text.includes('WooCommerce'), text.slice(0, 180));
		check('Ссылка для исправления есть', (await notice.locator('a').count()) > 0);
		check('Меню RVN не добавлено', (await page.locator('#toplevel_page_rvn').count()) === 0);
		await notice.screenshot({ path: `${outDir}/${stand}-requirements.png` }).catch(() => {});
	} else {
		await page.goto(`${url}/wp-admin/index.php`);
		const ids = await page.$$eval('#adminmenu > li', (items) => items.map((item) => item.id || item.className));
		const marketing = ids.indexOf('toplevel_page_woocommerce-marketing');
		const rvn = ids.indexOf('toplevel_page_rvn');
		check('Пункт «RVN» есть в меню', rvn >= 0);
		check('«RVN» сразу после «Маркетинга»', marketing >= 0 && rvn === marketing + 1, `Маркетинг: ${marketing}, RVN: ${rvn}`);
		check('За «RVN» идёт разделитель блока', rvn >= 0 && String(ids[rvn + 1] || '').includes('wp-menu-separator'), ids[rvn + 1] || '');

		const submenu = await page.$$eval('#toplevel_page_rvn .wp-submenu li:not(.wp-submenu-head) a', (links) => links.map((link) => link.textContent.trim()));
		check('Подпункты: страница плагина и «Поддержка», без дубля «RVN»', submenu.length === 2 && !submenu.includes('RVN'), submenu.join(', '));

		const icon = await page.$eval('#toplevel_page_rvn .wp-menu-image', (element) => getComputedStyle(element, '::before').content);
		check('Значок «R»', icon.includes('R'), icon);

		await page.hover('#toplevel_page_rvn > a');
		await page.waitForTimeout(300);
		await page.screenshot({ path: `${outDir}/${stand}-menu.png`, clip: { x: 0, y: 0, width: 520, height: 1000 } });

		await Promise.all([page.waitForNavigation(), page.click('#toplevel_page_rvn > a')]);
		check('Клик по «RVN» открывает «Сравнение»', page.url().includes('page=rvn-compare'), page.url());
		const heading = (await page.locator('.wrap h1').first().innerText()).trim();
		check('Страница «Сравнение» открывается', heading.length > 0, heading);
		const rows = await page.locator('.rvn-compare-status tbody tr').count();
		check('Таблица состояния системы', rows === 5, `${rows} строк`);
		await page.screenshot({ path: `${outDir}/${stand}-compare.png`, fullPage: true });

		await page.goto(`${url}/wp-admin/admin.php?page=rvn-support`);
		const support = (await page.locator('.wrap').first().innerText()).replace(/\s+/g, ' ').trim();
		check('Страница «Поддержка»', support.length > 10, support);

		await page.goto(`${url}/wp-admin/plugins.php`);
		const settingsLinks = await page.locator(`tr[data-slug="${SLUG}"] .row-actions a[href*="page=rvn-compare"]`).count();
		check('Ссылка «Настройки» на экране «Плагины»', settingsLinks === 1);
	}

	const ownErrors = jsErrors.filter((message) => /rvn/i.test(message));
	check('Нет ошибок JavaScript от плагина', ownErrors.length === 0, ownErrors.concat(jsErrors.length ? [`всего ошибок на странице: ${jsErrors.length}`] : []).join(' | '));

	await browser.close();
	console.log(JSON.stringify(result));
	process.exit(result.checks.every((item) => item.ok) ? 0 : 1);
})().catch((error) => {
	console.log(JSON.stringify({ checks: [{ name: 'Сценарий завершился с ошибкой', ok: false, detail: String(error.message || error) }] }));
	process.exit(2);
});
