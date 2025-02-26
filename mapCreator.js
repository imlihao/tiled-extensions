/// <reference types="@mapeditor/tiled-api" />

/* global tiled */

class StableRandom {
    constructor(seed) {
        this.seed = seed || Math.floor(Math.random() * 2147483647);
    }

    /**
     * 生成下一个随机数 (0-1)
     * @returns {number} 0到1之间的随机数
     */
    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    /**
     * 生成指定范围内的随机整数
     * @param {number} min 最小值（包含）
     * @param {number} max 最大值（包含）
     * @returns {number} 范围内的随机整数
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * 从数组中随机选择一个元素
     * @param {Array} array 源数组
     * @returns {*} 随机选中的元素
     */
    choose(array) {
        return array[this.nextInt(0, array.length - 1)];
    }

    /**
 * 打乱数组顺序
 * @param {Array} array 要打乱的数组
 * @returns {Array} 打乱后的新数组
 */
    shuffle(array) {
        // 创建数组副本
        const result = [];
        for (let i = 0; i < array.length; i++) {
            result[i] = array[i];
        }

        // 打乱数组
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            const temp = result[i];
            result[i] = result[j];
            result[j] = temp;
        }
        return result;
    }

    /**
     * 重置随机数种子
     * @param {number} seed 新的随机数种子
     */
    setSeed(seed) {
        this.seed = seed >>> 0;
    }

    /**
     * 获取当前种子值
     * @returns {number} 当前种子
     */
    getSeed() {
        return this.seed;
    }
}

// 创建一个默认的随机数生成器实例
const random = new StableRandom();

class MapCreator {
    constructor(mapWidth, mapHeight, options = {}) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.minCityDistance = options.minCityDistance || 10;
        this.CITY_SIZE = options.citySize || 3;
        this.MAX_RIVERS = options.maxRivers || 5;
        this.RIVER_MIN_LENGTH = options.riverMinLength || 10;
        this.RIVER_MAX_LENGTH = options.riverMaxLength || 50;
        this.RIVER_MIN_WIDTH = options.riverMinWidth || 1;
        this.RIVER_MAX_WIDTH = options.riverMaxWidth || 3;

        this.cities = [];
        this.allCitys = [];
        this.roads = [];
        this.allRoads = [];
        this.riverTiles = new Set();
        this.random = random;

        // 默认陆地判断函数
        this.isLandTile = function () { return true; };
    }

    generateCities(count, isValidTile, namePrefix = '') {
        const cities = [];
        let attempts = 0;
        const maxAttempts = count * 1000;

        while (cities.length < count && attempts < maxAttempts) {
            const x = Math.floor(this.random.next() * (this.mapWidth - this.CITY_SIZE) + 1);
            const y = Math.floor(this.random.next() * (this.mapHeight - this.CITY_SIZE) + 1);

            if (isValidTile(x, y) && this.isValidCityArea(x, y)) {
                const city = {
                    id: this.allCitys.length + 1,
                    name: `${namePrefix}City ${cities.length + 1}`,
                    x,
                    y,
                    tiles: this.generateCityTiles(x, y),
                    continentId: 1
                };

                if (this.isValidCityLocation(city, cities)) {
                    cities.push(city);
                    this.allCitys.push(city);
                    attempts = 0;
                }
            }

            attempts++;
        }

        this.cities = cities;
        return cities;
    }

    generateCityTiles(x, y) {
        const tiles = [];
        for (let i = 0; i < this.CITY_SIZE; i++) {
            for (let j = 0; j < this.CITY_SIZE; j++) {
                tiles.push({ x: x + i, y: y + j });
            }
        }
        return tiles;
    }

    isInBounds(x, y) {
        return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
    }

    isValidCityArea(x, y) {
        for (let i = 0; i < this.CITY_SIZE; i++) {
            for (let j = 0; j < this.CITY_SIZE; j++) {
                const newX = x + i;
                const newY = y + j;
                if (!this.isInBounds(newX, newY) || !this.isLandTile(newX, newY)) {
                    return false;
                }
            }
        }
        return true;
    }

    isValidCityLocation(newCity, existingCities) {
        for (const city of existingCities) {
            for (const newTile of newCity.tiles) {
                for (const existingTile of city.tiles) {
                    const distance = this.calculateDistance(
                        newTile.x, newTile.y,
                        existingTile.x, existingTile.y
                    );
                    if (distance < this.minCityDistance) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    doLinesIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        const minX1 = Math.min(x1, x2);
        const maxX1 = Math.max(x1, x2);
        const minY1 = Math.min(y1, y2);
        const maxY1 = Math.max(y1, y2);
        const minX2 = Math.min(x3, x4);
        const maxX2 = Math.max(x3, x4);
        const minY2 = Math.min(y3, y4);
        const maxY2 = Math.max(y3, y4);

        if (maxX1 < minX2 || maxX2 < minX1 || maxY1 < minY2 || maxY2 < minY1) {
            return false;
        }

        const d1x = x2 - x1;
        const d1y = y2 - y1;
        const d2x = x4 - x3;
        const d2y = y4 - y3;
        const denominator = d1x * d2y - d1y * d2x;

        if (denominator === 0) {
            return false;
        }

        const t = ((x3 - x1) * d2y - (y3 - y1) * d2x) / denominator;
        const u = ((x3 - x1) * d1y - (y3 - y1) * d1x) / denominator;

        return t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99;
    }

    isRoadIntersecting(newRoad, existingRoads) {
        for (const road of existingRoads) {
            if (this.doLinesIntersect(
                newRoad.from.x, newRoad.from.y, newRoad.to.x, newRoad.to.y,
                road.from.x, road.from.y, road.to.x, road.to.y
            )) {
                return true;
            }
        }
        return false;
    }

    findNearestConnectionPoint(from, to) {
        let minDistance = Infinity;
        let fromPoint = { x: from.x, y: from.y };
        let toPoint = { x: to.x, y: to.y };

        for (const fromTile of from.tiles) {
            for (const toTile of to.tiles) {
                const distance = this.calculateDistance(
                    fromTile.x, fromTile.y,
                    toTile.x, toTile.y
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    fromPoint = fromTile;
                    toPoint = toTile;
                }
            }
        }

        return { fromPoint, toPoint };
    }

    generateRoads(cities) {
        this.roads = [];
        const processed = new Set();
        const MAX_ROAD_DISTANCE = 30;
        const MAX_CONNECTIONS = 3;

        const connectionCounts = new Map();
        cities.forEach(city => connectionCounts.set(city.id, 0));

        cities.forEach(cityA => {
            if (connectionCounts.get(cityA.id) >= MAX_CONNECTIONS) {
                return;
            }

            const nearCities = cities
                .filter(cityB => cityA !== cityB)
                .map(cityB => ({
                    city: cityB,
                    distance: this.calculateDistance(cityA.x, cityA.y, cityB.x, cityB.y)
                }))
                .filter(data => data.distance <= MAX_ROAD_DISTANCE)
                .sort((a, b) => a.distance - b.distance);

            for (const { city: cityB } of nearCities) {
                if (connectionCounts.get(cityB.id) >= MAX_CONNECTIONS) {
                    continue;
                }

                const roadId = `${Math.min(cityA.id, cityB.id)}-${Math.max(cityA.id, cityB.id)}`;
                if (!processed.has(roadId)) {
                    const { fromPoint, toPoint } = this.findNearestConnectionPoint(cityA, cityB);
                    const newRoad = {
                        from: {
                            id: cityA.id,
                            name: cityA.name,
                            continentId: cityA.continentId,
                            x: fromPoint.x,
                            y: fromPoint.y
                        },
                        to: {
                            id: cityB.id,
                            name: cityB.name,
                            continentId: cityB.continentId,
                            x: toPoint.x,
                            y: toPoint.y
                        }
                    };

                    if (!this.isRoadIntersecting(newRoad, this.roads)) {
                        this.roads.push(newRoad);
                        this.allRoads.push(newRoad);
                        processed.add(roadId);
                        connectionCounts.set(cityA.id, connectionCounts.get(cityA.id) + 1);
                        connectionCounts.set(cityB.id, connectionCounts.get(cityB.id) + 1);
                    }
                }

                if (connectionCounts.get(cityA.id) >= MAX_CONNECTIONS) {
                    break;
                }
            }
        });

        return this.roads;
    }

    isValidTriangle(a, b, c) {
        const area = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
        if (area === 0) return false;

        const otherCities = this.cities.filter(city =>
            city !== a && city !== b && city !== c
        );

        for (const city of otherCities) {
            if (this.isPointInTriangle(city, a, b, c)) {
                return false;
            }
        }

        return true;
    }

    isPointInTriangle(p, a, b, c) {
        const area = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
        const area1 = Math.abs((a.x - p.x) * (b.y - p.y) - (b.x - p.x) * (a.y - p.y)) / 2;
        const area2 = Math.abs((b.x - p.x) * (c.y - p.y) - (c.x - p.x) * (b.y - p.y)) / 2;
        const area3 = Math.abs((c.x - p.x) * (a.y - p.y) - (a.x - p.x) * (c.y - p.y)) / 2;

        return Math.abs(area - (area1 + area2 + area3)) < 0.01;
    }

    // 使用Tiled API导出为CSV
    exportToCSV() {
        try {
            // 按ID排序
            this.allCitys.sort((a, b) => a.id - b.id);

            // 准备城市数据
            const cityData = [['ID', '名称', 'X坐标', 'Y坐标', '大陆ID']];
            this.allCitys.forEach(city => {
                cityData.push([city.id, city.name, city.x, city.y, city.continentId]);
            });

            // 准备道路数据
            const roadData = [['起始城市', '目标城市', '起始X', '起始Y', '目标X', '目标Y', '距离']];
            this.allRoads.forEach(road => {
                const distance = Math.floor(this.calculateDistance(
                    road.from.x, road.from.y, road.to.x, road.to.y
                ));
                roadData.push([
                    road.from.id, road.to.id,
                    road.from.x, road.from.y,
                    road.to.x, road.to.y,
                    distance
                ]);
            });
            tiled.log("地图")
            tiled.log(roadData.toString())

            // 保存城市数据CSV
            const cityFilename = `/Users/lihao/Desktop/city_data_${Date.now()}.csv`;
            this.saveCSV(cityData, cityFilename);

            // 保存道路数据CSV
            const roadFilename = `/Users/lihao/Desktop/road_data_${Date.now()}.csv`;
            this.saveCSV(roadData, roadFilename);

            tiled.alert(`导出成功!\n城市数据: ${cityFilename}\n道路数据: ${roadFilename}`);
            return true;
        } catch (e) {
            tiled.error(`导出失败: ${e}`);
            return false;
        }
    }

    // 保存CSV文件
    saveCSV(data, filename) {
        try {
            // 添加 UTF-8 BOM，确保 Excel 正确识别中文
            const bom = '\ufeff';
            // 将数组转换为 CSV 格式
            const csvContent = bom + data.map(row =>
                row.map(cell => {
                    if (cell === null || cell === undefined) return '';
                    return `"${String(cell).replace(/"/g, '""')}"`
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

    // 导入CSV文件
    importFromCSV(cityFile, roadFile) {
        try {
            // 读取城市数据
            let cityFileContent = new TextFile(cityFile, TextFile.ReadOnly).readAll();
            const cityLines = cityFileContent.split('\n');

            // 跳过表头
            const cities = [];
            for (let i = 1; i < cityLines.length; i++) {
                if (!cityLines[i].trim()) continue;

                const values = this.parseCSVLine(cityLines[i]);
                if (values.length >= 5) {
                    cities.push({
                        id: parseInt(values[0], 10),
                        name: values[1],
                        x: parseInt(values[2], 10),
                        y: parseInt(values[3], 10),
                        continentId: parseInt(values[4], 10),
                        tiles: this.generateCityTiles(parseInt(values[2], 10), parseInt(values[3], 10))
                    });
                }
            }

            // 读取道路数据
            let roadFileContent = new TextFile(roadFile, TextFile.ReadOnly).readAll();
            const roadLines = roadFileContent.split('\n');

            // 跳过表头
            const roads = [];
            for (let i = 1; i < roadLines.length; i++) {
                if (!roadLines[i].trim()) continue;

                const values = this.parseCSVLine(roadLines[i]);
                if (values.length >= 7) {
                    const fromId = parseInt(values[0], 10);
                    const toId = parseInt(values[1], 10);
                    const fromCity = cities.find(c => c.id === fromId);
                    const toCity = cities.find(c => c.id === toId);

                    if (fromCity && toCity) {
                        roads.push({
                            from: {
                                id: fromCity.id,
                                name: fromCity.name,
                                continentId: fromCity.continentId,
                                tiles: fromCity.tiles,
                                x: parseInt(values[2], 10),
                                y: parseInt(values[3], 10)
                            },
                            to: {
                                id: toCity.id,
                                name: toCity.name,
                                continentId: toCity.continentId,
                                tiles: toCity.tiles,
                                x: parseInt(values[4], 10),
                                y: parseInt(values[5], 10)
                            }
                        });
                    }
                }
            }


            this.cities = cities;
            this.allCitys = [];
            for (let i = 0; i < cities.length; i++) {
                this.allCitys.push(cities[i]);
            }

            this.roads = roads;
            this.allRoads = [];
            for (let i = 0; i < roads.length; i++) {
                this.allRoads.push(roads[i]);
            }

            this.validateImportedData();
            return true;
        } catch (e) {
            tiled.error(`导入失败: ${e}`);
            return false;
        }
    }

    // 解析CSV行
    parseCSVLine(line) {
        const result = [];
        let insideQuotes = false;
        let currentValue = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    // 处理双引号
                    currentValue += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                result.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }

        result.push(currentValue);
        return result;
    }

    validateImportedData() {
        for (const city of this.cities) {
            if (!city.id || !city.name || city.x === undefined || city.y === undefined) {
                throw new Error("城市数据不完整");
            }
            if (city.x < 0 || city.x >= this.mapWidth ||
                city.y < 0 || city.y >= this.mapHeight) {
                throw new Error(`城市 ${city.name} 的坐标超出地图范围`);
            }
            if (!this.isLandTile(city.x, city.y)) {
                throw new Error(`城市 ${city.name} 不在陆地上`);
            }
        }

        for (let i = 0; i < this.cities.length; i++) {
            for (let j = i + 1; j < this.cities.length; j++) {
                const distance = this.calculateDistance(
                    this.cities[i].x, this.cities[i].y,
                    this.cities[j].x, this.cities[j].y
                );
                if (distance < this.minCityDistance) {
                    throw new Error(`城市 ${this.cities[i].name} 和 ${this.cities[j].name} 距离太近`);
                }
            }
        }
    }

    generateDelaunayRoads(cities, continentId) {
        if (cities.length < 3) return [];

        const roads = [];
        const processed = new Set();
        const MAX_ROAD_DISTANCE = 50;

        cities.sort((a, b) => a.x - b.x);

        for (let i = 0; i < cities.length - 2; i++) {
            const city = cities[i];
            const nearestCities = cities.slice(i + 1)
                .filter(c => c.continentId === continentId)
                .map(c => ({
                    city: c,
                    distance: this.calculateDistance(city.x, city.y, c.x, c.y)
                }))
                .filter(c => c.distance <= MAX_ROAD_DISTANCE)
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 2)
                .map(n => n.city);

            if (nearestCities.length === 2) {
                const [cityB, cityC] = nearestCities;
                if (this.isValidTriangle(city, cityB, cityC)) {
                    this.addRoadIfValid(roads, processed, city, cityB);
                    this.addRoadIfValid(roads, processed, cityB, cityC);
                    this.addRoadIfValid(roads, processed, cityC, city);
                }
            }
        }

        return roads;
    }

    addRoadIfValid(roads, processed, cityA, cityB) {
        const roadId = `${Math.min(cityA.id, cityB.id)}-${Math.max(cityA.id, cityB.id)}`;
        if (!processed.has(roadId)) {
            const { fromPoint, toPoint } = this.findNearestConnectionPoint(cityA, cityB);
            // 修改为：
            const newRoad = {
                from: {
                    id: cityA.id,
                    name: cityA.name,
                    continentId: cityA.continentId,
                    tiles: cityA.tiles,
                    x: fromPoint.x,
                    y: fromPoint.y
                },
                to: {
                    id: cityB.id,
                    name: cityB.name,
                    continentId: cityB.continentId,
                    tiles: cityB.tiles,
                    x: toPoint.x,
                    y: toPoint.y
                }
            };

            if (!this.isRoadIntersecting(newRoad, roads)) {
                roads.push(newRoad);
                this.allRoads.push(newRoad);
                processed.add(roadId);
            }
        }
    }

    generateCitiesInArea(tiles, count, namePrefix = '') {
        return this.generateCities(count, (x, y) => {
            return tiles.some(tile => Math.abs(tile.x - x) < 20 && Math.abs(tile.y - y) < 20);
        }, namePrefix);
    }

    /**
     * 识别地图上的大陆板块并在每个板块上生成城市
    * @param {number} totalCities 要生成的总城市数量
    * @returns {Array} 生成的所有城市数组
     */
    generateCitiesByContinent(totalCities) {
        // 识别大陆板块
        const continents = this.identifyContinents();
        tiled.log(`识别出 ${continents.length} 个大陆板块`);

        // 计算每个大陆的面积及城市分配数量
        const continentAreas = [];
        let totalLandArea = 0;

        continents.forEach((continent, index) => {
            const area = continent.size;
            totalLandArea += area;
            continentAreas.push({ index, area, continent });
        });

        // 按照面积大小排序大陆
        continentAreas.sort((a, b) => b.area - a.area);

        // 分配城市数量
        const allCities = [];
        let remainingCities = totalCities;

        for (let i = 0; i < continentAreas.length && remainingCities > 0; i++) {
            const { area, continent, index } = continentAreas[i];
            // 根据面积比例分配城市数量，至少保证每个大陆有1个城市
            const citiesToGenerate = Math.max(
                1,
                Math.floor((area / totalLandArea) * totalCities)
            );

            // 不要超过剩余的城市数量
            const actualCities = Math.min(citiesToGenerate, remainingCities);
            remainingCities -= actualCities;

            tiled.log(`在大陆 ${index} 上生成 ${actualCities} 个城市，面积：${area}`);

            // 提取大陆的所有格子
            const continentTiles = [];
            continent.forEach(key => {
                const [x, y] = key.split(',').map(Number);
                continentTiles.push({ x, y });
            });

            // 在当前大陆生成城市
            const continentCities = this.generateCitiesInArea(
                continentTiles,
                actualCities,
                `C${index + 1}-`  // 前缀：C1-, C2- 等
            );

            // 更新城市的大陆ID
            continentCities.forEach(city => {
                city.continentId = index + 1;
            });

            for (let i = 0; i < continentCities.length; i++) {
                allCities.push(continentCities[i]);
            }
        }

        // 更新城市列表
        this.cities = allCities;
        return allCities;
    }

    /**
     * 识别大陆板块
     * @returns {Array<Set<string>>} 大陆板块数组，每个元素是一个包含坐标字符串的Set
     */
    identifyContinents() {
        const continents = [];
        const visited = new Set();

        // 遍历地图上的每个格子
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const key = `${x},${y}`;
                if (!visited.has(key) && this.isLandTile(x, y)) {
                    // 发现新的未访问陆地，开始填充
                    const continent = new Set();
                    this.floodFill(x, y, visited, continent);
                    if (continent.size > 0) {
                        continents.push(continent);
                    }
                }
            }
        }

        return continents;
    }

    /**
     * 洪水填充算法，用于识别连续的陆地区域
     * @param {number} x 起始点x坐标
     * @param {number} y 起始点y坐标
     * @param {Set<string>} visited 已访问的点集合
     * @param {Set<string>} continent 当前大陆的点集合
     */
    floodFill(x, y, visited, continent) {
        // 检查是否在地图范围内
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return;
        }

        const key = `${x},${y}`;
        if (visited.has(key) || !this.isLandTile(x, y)) {
            return;
        }

        // 标记为已访问并加入当前大陆
        visited.add(key);
        continent.add(key);

        // 递归访问四个方向的相邻格子
        this.floodFill(x + 1, y, visited, continent);
        this.floodFill(x - 1, y, visited, continent);
        this.floodFill(x, y + 1, visited, continent);
        this.floodFill(x, y - 1, visited, continent);
    }

}

// 导出类
if (typeof module !== 'undefined') {
    module.exports = {
        StableRandom,
        MapCreator,
        random
    };
}





// 添加 Tiled 注册动作
let generateMapAction = tiled.registerAction("GenerateMap", function () {
    const map = tiled.activeAsset;
    if (!map || !map.isTileMap) {
        tiled.alert("请先打开一个地图！");
        return;
    }

    // 创建地图生成器
    const mapCreator = new MapCreator(map.width, map.height, {
        minCityDistance: 10,
        citySize: 2,
        maxRivers: 3
    });

    // 设置陆地检测函数
    const landLayer = map.layers.find(layer => layer.name === "phy");
    if (landLayer && landLayer.isTileLayer) {
        mapCreator.isLandTile = function (x, y) {
            if (!mapCreator.isInBounds(x, y)) return false;
            return landLayer.tileAt(x, y) !== null;
        };
    }

    // 按大陆生成城市
    const cities = mapCreator.generateCitiesByContinent(100);

    // 生成道路（可以选择每个大陆内部生成）
    // 将 const continentIds = [...new Set(cities.map(c => c.continentId))]; 修改为:
    const continentIds = [];
    if (cities && cities.length) {
        for (let i = 0; i < cities.length; i++) {
            const continentId = cities[i].continentId;
            if (continentIds.indexOf(continentId) === -1) {
                continentIds.push(continentId);
            }
        }
    }
    // 同时修改下面的 filter 操作:
    for (let i = 0; i < continentIds.length; i++) {
        const continentId = continentIds[i];
        const continentCities = [];

        // 手动过滤
        for (let j = 0; j < cities.length; j++) {
            if (cities[j].continentId === continentId) {
                continentCities.push(cities[j]);
            }
        }

        if (continentCities.length > 1) {
            mapCreator.generateDelaunayRoads(continentCities, continentId);
        }
    }

    // 导出数据
    mapCreator.exportToCSV();
});

generateMapAction.text = "生成随机地图";

// 添加到菜单
tiled.extendMenu("Map", [
    { separator: true },
    { action: "GenerateMap" }
]);
