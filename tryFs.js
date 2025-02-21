/// <reference types="@mapeditor/tiled-api" />

/*
 * find-object-by-id.js
 *
 * This extension adds a 'Find Object by ID' (Ctrl+Shift+F) action to the Map
 * menu, which can be used to quickly jump to and select an object when you
 * know its ID.
 *
 * The script relies on the recently added TileMap.pixelToScreen conversion
 * function to work properly for isometric maps.
 */

/* global tiled */

/**
 * @param {TileMap} map
 */
function autoFixPhsLayer(map) {
	/**
	 * @type {TileSet}
	 */
	let tileSet = null;
	/**
	 * @type {WangSet[]} wangSet
	 */
	let wangSet = [];

	map.tilesets.forEach(v => {
		tiled.log(v.name);
		if (v.name === "isometric_grass_and_water") {
			tileSet = v;
			wangSet = tileSet.wangSets;
		}
	});

	/**
	 * @type {TileLayer}
	 */
	let phsLayer = map.layers.find(v => v.name === "phs");

	//your code here
}

/**
 * 
 * @param {TileLayer} layer 
 * @param {number} x 
 * @param {number} y 
 */
function isLandOrWater(layer, x, y) {
	const tile = layer.tileAt(x, y);
	if (tile > 0) {
		return true;
	}
	return false;
}


let jumpToObject = tiled.registerAction("tryFs", function (/* action */) {
	const map = tiled.activeAsset;
	if (!map.isTileMap) {
		tiled.error("Not a tile map!");
		return;
	}
	autoFixPhsLayer(map);
});
jumpToObject.text = "Try FS";


tiled.extendMenu("Map", [
	{ separator: true },
	{ action: "tryFs" },
]);
