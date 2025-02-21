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

function autoFixPhsLayer(map) {
	/**
	 * @type {Tileset}
	 */
	let tileSet = null;
	/**
	 * @type {Array<WangSet>}
	 */
	let wangSet = [];

	map.tilesets.forEach(v => {
		tiled.log(v.name);
		if (v.name === "isometric_grass_and_water") {
			tileSet = v;
			wangSet = tileSet.wangSets;
		}
	});

	for (let i = 0; i < tileSet.tileCount; i++) {
		const tile = tileSet.tile(i);
		if (!tile) continue;
		for (let j = 0; j < wangSet.length; j++) {
			let curWang = wangSet[j];
			let wangId = curWang.wangId(tile);
			tiled.log("tileId:" + tile.id + ",wangId:" + wangId.toString() + "==" + curWang.name);
		}
		tiled.log("==============" + i);

	}


	/**
	 * @type {TileLayer}
	 */
	let phsLayer = map.layers.find(v => v.name === "phy");
	if (!phsLayer) {
		tiled.error("No phs layer found!");
		return;
	}
	// 获取基础地形图层
	/**
	 * @type {TileLayer}
	 */
	const landLayer = map.layers.find(v => v.name === "land"); // 假设第一层是基础地形层
	if (!landLayer) {
		tiled.error("No land layer found!");
		return;
	}
	let tile2 = tileSet.tile(4);
	tiled.log(tileSet.name);

	tiled.log("tile2", tile2.asset.fileName);
	// tiled.log(JSON.stringify(tile2));
	let baseTile = tileSet.tile(0);
	// 开始编辑
	// 遍历每个瓦片位置
	// 使用单个编辑会话
	let edit = landLayer.edit();

	for (let y = 0; y < landLayer.height; y++) {
		for (let x = 0; x < landLayer.width; x++) {
			let tile = fitWangSet(wangSet[1], x, y, phsLayer);
			edit.setTile(x
				, y
				, tile);
		}
	}

	tiled.log("Done!");
	tiled.log("Done!");
	edit.apply();
	tiled.log("Appled!");
}

/**
 * 
 * @param {TileLayer} layer 
 * @param {number} x 
 * @param {number} y 
 */
function getLandOrWater(layer, x, y) {
	if (x < 0 || y < 0 || x >= layer.width || y >= layer.height) {
		return 2;
	}
	const tile = layer.tileAt(x, y);
	if (tile) {
		return 1;
	}
	return 2;
}

/**
 * 
 * @param {WangSet} wangSet 
 * @param {number} x 
 * @param number y 
 * @param {TileLayer} phsLayer 
 */
function fitWangSet(wangSet, x, y, phsLayer) {
	let upCode = getLandOrWater(phsLayer, x, y - 1);
	let downCode = getLandOrWater(phsLayer, x, y + 1);
	let leftCode = getLandOrWater(phsLayer, x - 1, y);
	let rightCode = getLandOrWater(phsLayer, x + 1, y);

	let arr = [0, upCode, 0, downCode, 0, leftCode, 0, rightCode];

	let tileSet = wangSet.tileset;
	let arrRes = [];
	for (let i = 0; i < tileSet.tileCount; i++) {
		const tile = tileSet.tile(i);
		if (!tile) continue;
		let wangId = wangSet.wangId(tile);
		if (wangId.toString() == arr.toString()) {
			arrRes.push(tile)
		}
	}
	if (arrRes.length > 0) {
		//random
		return arrRes[Math.floor(Math.random() * arrRes.length)];
	}
	return null;
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
