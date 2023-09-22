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
function makeLayer(map) {
	const needTileLayer = [
		"blockLayer",
		"skyLayer",
		"frontLayer",
		"mainLayer",
		"groundFrontLayer",
		"groundFrontLayer2",
		"floorLayer",
		"groundLayer"
	];

	const needObjLayer = [
		"linkedLayer",
		"region",
	]
	const needObjGroup = [
		"mapPieces"
	]
	needTileLayer.forEach((v, i) => {
		if (!checkLayer(map, v)) {
			// map.layers[0].isTileLayer
			let la = new TileLayer(v);
			map.insertLayerAt(i, la);
		}
	})
	needObjLayer.forEach((v, i) => {
		if (!checkLayer(map, v)) {
			//  map.layers[0].isGroupLayer
			let la = new ObjectGroup(v);
			map.insertLayerAt(i, la);
		}
	})
	needObjGroup.forEach((v, i) => {
		if (!checkLayer(map, v)) {
			// map.layers[0].isObjectLayer
			let la = new GroupLayer(v);
			map.insertLayerAt(i, la);
		}
	})
}

/**
 * @param {TileMap} map
 * @param {String} name
 */
function checkLayer(map, name) {
	let isFound = false;
	map.layers.forEach(layer => {
		if (layer.name == name) {
			isFound = true;
		}
	})
	return isFound;
}

const makeLayerAction = tiled.registerAction("makeLayer", () => {
	const map = tiled.activeAsset;
	makeLayer(map);
});

makeLayerAction.text = "添加必要的图层";

tiled.extendMenu("Map", [
	{ action: "makeLayer" },
]);

// tiled.assetAboutToBeSaved.connect(asset => {
// 	if (asset.isTileMap) {
// 		removeUnusedTilesets(asset);
// 	}
// });
