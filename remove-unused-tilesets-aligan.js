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
	let ox = 0;
	let oy = 0;
	map.layers.forEach(layer => {
		tiled.log("-----------------");
		tiled.log(layer.name);
		tiled.log(layer.id);

		if (layer.id == 1) {
			ox = -layer.offset.x;
			oy = -layer.offset.y;
		}
	})

	map.layers.forEach(layer => {
		if (layer.id == 1) {
			layer.offset.x = 0;
			layer.offset.y = 0;
			return;
		}
		
		aligan(layer, ox, oy)
	})
}

/**
 * @param {Layer} layer
 * @param {Number} offx
 * @param {Number} offy
 */
function aligan(layer, offx, offy) {
	let oox = offx;
	let ooy = offy;
	if (layer.isGroupLayer) {
		let GLayer = (/** @type {GroupLayer} */(layer));
		// oox += GLayer.offset.x;
		// ooy += GLayer.offset.y;
		let subX = oox + GLayer.offset.x;
		let subY = ooy + GLayer.offset.y;
		GLayer.offset.x = 0;
		GLayer.offset.y = 0;
		GLayer.layers.forEach(layer => {
			aligan(layer, subX, subY);
		})
	} else {
		if (layer.isObjectLayer) {
			let objectLayer = (/** @type {ObjectGroup} */(layer));
			let subX = oox + objectLayer.offset.x;
			let subY = ooy + objectLayer.offset.y;
			//set to zero point
			objectLayer.offset.x = 0;
			objectLayer.offset.y = 0;

			objectLayer.objects.forEach(object => {
				object.x += subX;
				object.y += subY;
			})
		}
	}
}

const TiledAliganAction = tiled.registerAction("TiledAligan", () => {
	const map = tiled.activeAsset;
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
