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

function autoFixPhsLayerWithSlice(map) {
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
	let upCode = getLandOrWater(phsLayer, x - 1, y);
	let TopRightCode = getLandOrWater(phsLayer, x - 1, y - 1);
	let rightCode = getLandOrWater(phsLayer, x, y - 1);
	let BottomRightCode = getLandOrWater(phsLayer, x + 1, y - 1);
	let downCode = getLandOrWater(phsLayer, x + 1, y);
	let BottomLeftCode = getLandOrWater(phsLayer, x + 1, y + 1);
	let leftCode = getLandOrWater(phsLayer, x, y + 1);
	let TopLeftCode = getLandOrWater(phsLayer, x - 1, y + 1);

	let myCode = getLandOrWater(phsLayer, x, y);

	let isConer1 = myCode == 1 && upCode == 1 && TopRightCode == 1 && rightCode == 1;
	let isConer2 = myCode == 1 && rightCode == 1 && BottomRightCode == 1 && downCode == 1;
	let isConer3 = myCode == 1 && downCode == 1 && BottomLeftCode == 1 && leftCode == 1;
	let isConer4 = myCode == 1 && leftCode == 1 && TopLeftCode == 1 && upCode == 1;

	let coner1Code = isConer1 ? 1 : 2;
	let coner2Code = isConer2 ? 1 : 2;
	let coner3Code = isConer3 ? 1 : 2;
	let coner4Code = isConer4 ? 1 : 2;

	let arr = [0, coner2Code, 0, coner3Code, 0, coner4Code, 0, coner1Code];

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

function doFs(layer, x, y) {
}


let jumpToObject = tiled.registerAction("tryFs", function (/* action */) {
	const map = tiled.activeAsset;
	if (!map.isTileMap) {
		tiled.error("Not a tile map!");
		return;
	}
	autoFixPhsLayer(map);
});
jumpToObject.text = "用water";


tiled.extendMenu("Map", [
	{ separator: true },
	{ action: "tryFs" },
]);


let paintWithSlice = tiled.registerAction("paintWithSlice", function (/* action */) {
	const map = tiled.activeAsset;
	if (!map.isTileMap) {
		tiled.error("Not a tile map!");
		return;
	}
	autoFixPhsLayerWithSlice(map);
});
paintWithSlice.text = "paintWithSlice";


tiled.extendMenu("Map", [
	{ separator: true },
	{ action: "paintWithSlice" },
]);


function saveToFile(content, filename) {
    try {
        // 创建文件对象
        let file = new TextFile(filename, TextFile.WriteOnly);
        
        // 写入内容
        file.write(content);
        
        // 关闭文件
        file.commit();
        
        tiled.log(`文件已保存: ${filename}`);
        return true;
    } catch (e) {
        tiled.error(`保存文件失败: ${e}`);
        return false;
    }
}

// 注册一个动作来测试文件保存
let saveAction = tiled.registerAction("SaveTest", function(/* action */) {
    // 示例：保存一些内容到文件
    const content = "这是测试内容\n第二行";
    const filename = "/Users/lihao/Desktop/test.txt";
    
    if (saveToFile(content, filename)) {
        tiled.alert("文件保存成功！");
    }
});

saveAction.text = "保存测试文件";

// 添加到菜单
tiled.extendMenu("File", [
    { separator: true },
    { action: "SaveTest" }
]);