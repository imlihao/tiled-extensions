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
		let oox = ox;
		let ooy = oy;
		aligan(layer, oox, ooy, map)
	})
}

/**
 * @param {Layer} layer
 * @param {Number} offx
 * @param {Number} offy
 * @param {TileMap} map
 */
function aligan(layer, offx, offy, map) {
	let oox = offx;
	let ooy = offy;
	let subX = oox + layer.offset.x;
	let subY = ooy + layer.offset.y;
	layer.offset.x = 0;
	layer.offset.y = 0;
	if (layer.isGroupLayer) {
		let GLayer = (/** @type {GroupLayer} */(layer));
		GLayer.layers.forEach(layer => {
			aligan(layer, subX, subY, map);
		})
	} else {
		if (layer.isObjectLayer) {
			let objectLayer = (/** @type {ObjectGroup} */(layer));
			objectLayer.objects.forEach(object => {
				let pt = map.pixelToScreen(object.pos.x, object.pos.y);
				pt.x += subX;
				pt.y += subY;
				let spt = map.screenToPixel(pt.x, pt.y);
				object.pos.x = spt.x;
				object.pos.y = spt.y;
			})
		}
	}
}

/**
 * @param {point} spt
 * @param {point} out
 */
function scenePoint2MapLocalPoint(spt, out) {
	// out = spt.sub(this.originScenePoint, out);
	// out = out.scale(new cc.Vec2(1, 2), out);
	// out = out.rotateSelf(this.use45DuJiao);
	// out.y = -out.y;
	// out.x = Math.floor(out.x);
	// out.y = Math.floor(out.y);
	const spt_x = spt.x;
	const spt_y = spt.y;
	const o = {
		x: 0,
		y: 0
	};
	let hei = Math.SQRT1_2;

	let M = ((spt_x - o.x) / hei + (o.y - spt_y) * 2 / hei) / 2;
	let N = (o.y - spt_y) * 2 / hei - M;
	out.x = Math.ceil(M);
	out.y = Math.ceil(N);
	return out;
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
