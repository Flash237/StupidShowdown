/* global window, document */
// StupidShowdown client patch, appended to the generated
// StupidShowdownClient/config/config.js at image build time (see the Dockerfile).
//
// Why it lives there: config.js is loaded as a plain <script> by every page of
// the client and is ours to edit (the Dockerfile generates it). It runs well
// before battledata.js defines Dex, so everything below defers to
// DOMContentLoaded.
//
// What it fixes: item icons are cells in sprites/itemicons-sheet.png, positioned
// from the item's `spritenum` (see Dex.getItemIcon). Both of this fork's custom
// items leave `spritenum` at 0, so they render whatever item happens to own cell
// 0. We have real art for them as individual files, so teach getItemIcon to use
// those instead. Every other item falls through to the untouched sheet lookup.
(function () {
	const CUSTOM_ITEM_ICONS = {
		orbof20000years: 'orbof20000years.png',
		ghostorbofthebloodritual: 'ghostorbofthebloodritual.png',
	};

	function installCustomItemIcons() {
		if (!window.Dex || window.Dex.getItemIcon.__stupidshowdown) return;
		const sheetIcon = window.Dex.getItemIcon;
		window.Dex.getItemIcon = item => {
			// Mirrors toID(): accepts either a name/id string or an Item object,
			// and matches however the caller passed it.
			const id = String(
				typeof item === 'string' ? item : (item && (item.id || item.name)) || ''
			).toLowerCase().replace(/[^a-z0-9]+/g, '');
			const file = CUSTOM_ITEM_ICONS[id];
			if (file) {
				// Cells in the sheet are 24x24; match that so the icon lines up
				// with the text and the other item icons around it.
				return `background:transparent url(${window.Dex.resourcePrefix}sprites/itemicons/${file}) ` +
					'no-repeat scroll 0 0;background-size:24px 24px';
			}
			return sheetIcon.call(window.Dex, item);
		};
		window.Dex.getItemIcon.__stupidshowdown = true;
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', installCustomItemIcons);
	} else {
		installCustomItemIcons();
	}
})();
