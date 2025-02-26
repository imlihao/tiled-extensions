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
			let tile = fitWangSetConer(wangSet[1], x, y, phsLayer);
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
		if (v.name === "ground") {
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

	
	let landRiverSlice = wangSet.find(v => v.name === "landRiverSlice");
	let landConer = wangSet.find(v => v.name === "landConer");

	if(!landRiverSlice || !landConer){
		if(!landRiverSlice){
			tiled.error("No landRiverSlice wangSet found!");
		}
		if(!landConer){
			tiled.error("No landConer wangSet found!");
		}
		return;
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
			let tile = fitWangSetConer(landConer, x, y, phsLayer);
			// tile = landRiverSlice.tileset.tile(0);
			edit.setTile(x
				, y
				, tile);
		}
	}

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
function fitWangSetConer(wangSet, x, y, phsLayer) {
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


/**
 * 
 * @param {WangSet} wangSet 
 * @param {number} x 
 * @param number y 
 * @param {TileLayer} phsLayer 
 */
function fitWangSetEdge(wangSet, x, y, phsLayer) {
	let upCode = getLandOrWater(phsLayer, x - 1, y);
	let TopRightCode = getLandOrWater(phsLayer, x - 1, y - 1);
	let rightCode = getLandOrWater(phsLayer, x, y - 1);
	let BottomRightCode = getLandOrWater(phsLayer, x + 1, y - 1);
	let downCode = getLandOrWater(phsLayer, x + 1, y);
	let BottomLeftCode = getLandOrWater(phsLayer, x + 1, y + 1);
	let leftCode = getLandOrWater(phsLayer, x, y + 1);
	let TopLeftCode = getLandOrWater(phsLayer, x - 1, y + 1);

	let myCode = getLandOrWater(phsLayer, x, y);

	let arr = [rightCode,0,downCode,0, leftCode,0, upCode,0];
	// let arr = [1,0,1,0, 1,0, 1];

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


//#region  导出城市数据到csv

function saveCSV(data, filename) {
    try {
        // 添加 UTF-8 BOM，确保 Excel 正确识别中文
        const bom = '\ufeff';
        // 将数组转换为 CSV 格式
        const csvContent = bom + data.map(row => 
            row.map(cell => {
                if (cell === null || cell === undefined) return '';
                return `"${cell.toString().replace(/"/g, '""')}"`
            }).join(',')
        ).join('\n');
        
        let file = new TextFile(filename, TextFile.WriteOnly);
        file.codec = 'UTF-8';
        file.write(csvContent);
        file.commit();
        
        return true;
    } catch (e) {
        tiled.error(`保存CSV失败: ${e}`);
        return false;
    }
}

function collectBuildingData(map) {
    // 获取建筑层
    const buildingLayer = map.layers.find(layer => layer.name === "building");
    if (!buildingLayer) {
        tiled.error("未找到building层!");
        return null;
    }

    // 准备数据，添加表头
    const data = [['建筑名称', '道路目标']];
	
	tiled.log(buildingLayer.objects.length);
    // 遍历所有对象
    buildingLayer.objects.forEach(obj => {
        const roads = [];
        
        // 遍历对象的所有属性
        for (const [key, value] of Object.entries(obj.properties)) {
			tiled.log(key+":"+ value);

            if (key.startsWith('road')) {
                roads.push(value);
				
            }
        }
		tiled.log(obj.name);
        // 添加到数据数组
        data.push([
            obj.name || '',
            roads.join(';') // 用分号分隔多个道路目标
        ]);
    });

    return data;
}

// 注册保存建筑数据的动作
let saveBuildingCSVAction = tiled.registerAction("SaveBuildingCSV", function(/* action */) {
    const map = tiled.activeAsset;
    if (!map.isTileMap) {
        tiled.error("不是地图文件!");
        return;
    }

    const data = collectBuildingData(map);
    if (!data) return;

    // 生成文件名（包含时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `/Users/lihao/Desktop/building_data_${timestamp}.csv`;
    
    if (saveCSV(data, filename)) {
        tiled.alert("建筑数据已导出为CSV文件！");
    }

});

saveBuildingCSVAction.text = "导出建筑数据";

// 添加到菜单
tiled.extendMenu("Map", [
    { separator: true },
    { action: "SaveBuildingCSV" }
]);