/// <reference types="@mapeditor/tiled-api" />

/*
 * remove-unused-tilesets.js
 *
 * Example action that removes all unused tilesets.
 *
 * Uncomment the connection to assetAboutToBeSaved to remove unused tilesets
 * automatically on save.
 */

/* global tiled */

/**
 * @param {TileMap} map
 */
function TiledAligan(map) {
	const usedTilesets = map.usedTilesets();
	const unusedTilesets = map.tilesets.filter(tileset => !usedTilesets.includes(tileset));

	if (unusedTilesets.length > 0) {
		tiled.log(`Removing ${unusedTilesets.length} unused tilesets...`);
		map.macro("Remove Unused Tilesets", function () {
			for (const t of unusedTilesets)
				map.removeTileset(t);
		});
	}
}

const TiledAliganAction = tiled.registerAction("TiledAligan", () => {
	const map = tiled.activeAsset;
	if (!map.isTileMap) {
		tiled.error("Not a tile map!");
		return;
	}

	TiledAligan(map);
});
TiledAliganAction.text = "对齐";


tiled.extendMenu("Map", [
	{ action: "TiledAligan" },
]);


// tiled.assetAboutToBeSaved.connect(asset => {
// 	if (asset.isTileMap) {
// 		removeUnusedTilesets(asset);
// 	}
// });
