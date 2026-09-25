=== RVN Compare Products for WooCommerce ===
Contributors: revolen
Tags: woocommerce, compare, product comparison, comparison table, compare products
Requires at least: 6.4
Tested up to: 7.1
Requires PHP: 8.1
Stable tag: 0.4.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Let shoppers compare WooCommerce products side by side in a clean, responsive comparison table.

== Description ==

RVN Compare Products for WooCommerce adds a product comparison feature to your store: compare buttons on product cards and product pages, a live counter for your header and a clean comparison table with differences highlighted.

**Development build.** Version 0.4.0 (draft) adds the comparison page and side-by-side table on top of the 0.3.1 buttons, counters and notifications. Automated checks for 0.4.0 are not finished yet.

= Privacy =

The plugin does not send any data to external servers, does not load remote assets and does not track visitors.

== Installation ==

1. Make sure WooCommerce 8.2 or newer is installed and active.
2. Upload the plugin through Plugins → Add New → Upload Plugin, or install it from the plugin directory.
3. Activate the plugin.
4. Open RVN → Compare in the WordPress admin.

== Frequently Asked Questions ==

= Does the plugin work without WooCommerce? =

No. The plugin stays inactive and shows a notice with a link to install or activate WooCommerce.

= Is the plugin compatible with High-Performance Order Storage (HPOS)? =

Yes. The plugin does not read or modify orders.

= What happens to my data when I delete the plugin? =

By default, the plugin settings and saved comparison lists are removed. The comparison page is never deleted because it is your content.

== Changelog ==

= 0.4.0 =
* Draft: comparison page with [rvn-compare-table], REST /table, field registry, difference highlighting.
* Draft status: code complete, automated test run and release notes pending.

= 0.3.1 =
* Fixed: compare button now appears on single product pages with classic templates (Storefront, Astra and others).
* Fixed: "Compare" button no longer shows two icons at once; icon-only mode no longer gains extra text in the active state.
* Fixed: the "Undo" action in the "added" notification now removes the product as expected.
* Fixed: overlay positions are placed inside the product image container, so all four corners are accurate.
* Improvement: notification countdown pauses on hover.
* Improvement: page cache is flushed when the plugin is activated.

= 0.3.0 =
* Compare buttons on product cards and product pages: nine positions, classic and block templates, exclusions respected.
* Two button states ("Compare" / "In comparison"); pressing again removes the product.
* Live counter button, plain counter, "Clear all" button and per-category progress, updated without page reloads.
* Notifications with countdown bar, close button and an undo action; safe-area aware positioning.
* Shortcodes: [rvn-compare-button], [rvn-compare-counter], [rvn-compare-counter-button], [rvn-compare-clear], [rvn-compare-progress].
* Cross-tab synchronisation and correct behaviour on page-cached sites.

= 0.2.0 =
* Comparison core: guest lists in the browser, registered lists in the user profile, merging on sign in.
* Limits: 50 products in total and 12 per category or group, with clear reasons in the response.
* Categories: direct membership, comparison rules, ignored categories, custom category groups and the "Other" group.
* Product and category exclusions for automatic buttons.
* REST API rvn-compare/v1 with nonce protection and throttled merging.
* Tools → RVN Diagnostics screen with a copyable environment report.

= 0.1.0 =
* Plugin foundation: requirement checks for WordPress, WooCommerce and PHP.
* RVN admin menu placed right after WooCommerce Marketing, with Compare and Support pages.
* HPOS compatibility declaration.
* Russian translation.
* Clean uninstallation, including multisite networks.
