/* global window, document */
// StupidShowdown client patch, appended to the generated
// StupidShowdownClient/config/config.js by setup-config.js (see README.md).
//
// Why it lives there: config.js is loaded as a plain <script> by every page of
// the client and is ours to edit (setup-config.js generates it). It runs well
// before battledata.js defines Dex, so everything below defers to
// DOMContentLoaded.
//
// What it fixes:
//
// 1. Item icons are cells in sprites/itemicons-sheet.png, positioned from the
//    item's `spritenum` (see Dex.getItemIcon). Both of this fork's custom items
//    leave `spritenum` at 0, so they render whatever item happens to own cell
//    0. We have real art for them as individual files, so teach getItemIcon to
//    use those instead.
//
// 2. Party-bar and teambuilder-list icons are cells in
//    sprites/pokemonicons-sheet.png, positioned from the species' dex `num`
//    (see Dex.getPokemonIconNum). That sheet only has cells for real species,
//    and any num above the last real one (1025) is clamped back to 0 - which
//    would make every custom Stupid mon render as a Bulbasaur icon. The asset
//    pack has dedicated icon art for the roster (head shots/logos), so teach
//    getPokemonIcon to serve that from sprites/pokemonicons/<id> instead.
//    Battle sprites are unaffected: they go through getSpriteData, which names
//    files per species.
//
//    Every other item/species falls through to the untouched sheet lookup.
(function () {
	const CUSTOM_ITEM_ICONS = {
		orbof20000years: 'orbof20000years.png',
		ghostorbofthebloodritual: 'ghostorbofthebloodritual.png',
	};

	// Species art for the icon slot, split by what the asset pack actually
	// contains:
	//  - CUSTOM_MON_ICONS: ids with dedicated icon art (head shots/logos),
	//    served from sprites/pokemonicons/<id>.png (in the repo the file keeps
	//    its real extension; the build has to publish it at that .png URL - see
	//    client-patches/sprites/README.md).
	//  - ids with no icon art in the pack (navia, furina, zhongli,
	//    raidenshogun): fall back to their battle render, consistent with what
	//    their battle sprites show (MissingNo. placeholder).
	// Dex nums 10002+ belong to this roster, so none of these ids can collide
	// with a real species.
	const CUSTOM_MON_ICONS = [
		'aws', 'azure', 'cactus', 'dante', 'demoman', 'dracannon', 'flexseal',
		'ghidorah', 'ghidorah-void', 'godzilla', 'godzilla-earth', 'grian',
		'hatsunemiku', 'hitachint65ma4', 'ibuprofen', 'jetstreamsam', 'miyabi',
		'nahida', 'nilou', 'spy', 'stevenhe', 'technoblade', 'v1', 'vergil',
	];
	const CUSTOM_MON_ICON_FALLBACKS = ['navia', 'furina', 'zhongli', 'raidenshogun'];

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

	function installCustomPokemonIcons() {
		if (!window.Dex || window.Dex.getPokemonIcon.__stupidshowdown) return;
		const sheetIcon = window.Dex.getPokemonIcon;
		window.Dex.getPokemonIcon = function (pokemon, facingLeft) {
			const id = String(
				typeof pokemon === 'string' ?
					pokemon :
					(pokemon && (pokemon.speciesForme || pokemon.species || pokemon.name)) || ''
			).toLowerCase().replace(/[^a-z0-9-]+/g, '');
			// facingLeft (wild Pokemon seen from behind in battle) has no custom
			// art; let those fall through to the sheet's placeholder.
			if (!facingLeft && (CUSTOM_MON_ICONS.includes(id) || CUSTOM_MON_ICON_FALLBACKS.includes(id))) {
				// The sheet's cells are 40x30; render our art inside the same box
				// (32px square, nudged to sit on the baseline like the sheet's own
				// icons) so party-bar rows stay aligned.
				const fainted = pokemon && pokemon.fainted ?
					';opacity:.3;filter:grayscale(100%) brightness(.5)' : '';
				const dir = CUSTOM_MON_ICONS.includes(id) ? 'sprites/pokemonicons' : 'sprites/home-centered';
				return `background:transparent url(${window.Dex.resourcePrefix}${dir}/${id}.png) ` +
					`no-repeat scroll -4px -1px / 40px 30px${fainted}`;
			}
			return sheetIcon.call(window.Dex, pokemon, facingLeft);
		};
		window.Dex.getPokemonIcon.__stupidshowdown = true;
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			installCustomItemIcons();
			installCustomPokemonIcons();
		});
	} else {
		installCustomItemIcons();
		installCustomPokemonIcons();
	}
})();
