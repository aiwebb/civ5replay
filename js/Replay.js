

var Replay = function(file, size) {
	this.parser   = new BinaryParser(file, size)
	this.meta     = {}
	this.players  = []
	this.cities   = []
	this.messages = []
	this.datasets = []
	this.map      = []

	this.fileConfig = {
		game:        {type: 'str', length: 0x04}, // CIV5
		_0:          'int32', // 01 00 00 0g0
		version:     'varstr',
		build:       'varstr',
		_1:          {type: 'byte', length: 0x05}, // 41 01 00 00 01 ?
		playerCiv:   'varstr',
		difficulty:  'varstr',
		eraStart:    'varstr',
		eraEnd:      'varstr',
		gameSpeed:   'varstr',
		worldSize:   'varstr',
		mapScript:   'varstr',
		dlc: {
			type: 'array',
			items: {
				id:      {type: 'str', length: 0x10},
				enabled: 'int32',
				name:    'varstr'
			}
		},
		mods: {
			type: 'array',
			items: {
				id:      'varstr',
				version: 'int32',
				name:    'varstr'
			}
		},
		_2:            'varstr', // 00 00 00 00
		_3:            'varstr', // 00 00 00 00
		playerColor:   'varstr',
		_4:            {type: 'byte', length: 0x08}, // 01 00 00 00 00 00 00 00
		mapScript2:    'varstr',
		_5:            {type: 'until', value: 0x11},
		startTurn:     'int32',
		startYear:     'int32',
		endTurn:       'int32',
		endYear:       'varstr',
		zeroStartYear: 'int32',
		zeroEndYear:   'int32',
		civs: {
			type: 'array',
			items: {
				_1:       'int32',
				_2:       'int32',
				_3:       'int32',
				_4:       'int32',
				leader:   'varstr',
				longName: 'varstr',
				name:     'varstr',
				demonym:  'varstr'
			}
		},
		datasets: {
			type: 'array',
			items: {
				key: 'varstr'
			}
		},
		datasetValues: {
			type: 'array',
			items: {
				type: 'array',
				items: {
					type: 'array',
					items: {
						turn:  'int32',
						value: 'int32'
					}
				}
			}
		},
		_7: 'int32',
		events: {
			type: 'array',
			items: {
				turn:   'int32',
				typeId: 'int32',
				tiles: {
					type: 'array',
					items: {
						x: 'int16',
						y: 'int16'
					}
				},
				civId: 'int32',
				text: 'varstr'
			}
		},
		mapWidth:  'int32',
		mapHeight: 'int32',
		tiles: {
			type: 'array',
			items: {
				_1:          'int32', // always 1?
				_2:          'int32', // always 267?
				elevationId: 'int8',
				typeId:      'int8',
				featureId:   'int8',
				_5:          'int8'
			}
		}
	}

	return this
}

Replay.prototype.process = function() {
	// Do initial basic parsing
	this.rawData = this.parser.parseItems(this.fileConfig, false)

	// Store everything but civs / tiles / datasets / events in this.meta
	this.meta = _.omit(this.rawData, ['civs', 'datasets', 'datasetValues', 'events', 'tiles'])

	// Civs are fine as is
	this.civs = this.rawData.civs

	// Organize dataset values by civ id and dataset name
	var datasetNames = _.pluck(this.rawData.datasets, 'key')
	this.datasets = _(this.rawData.datasets).chain().pluck('key').map((key, datasetIndex) => {
		return _.pluck(this.rawData.datasetValues, datasetIndex)
	}).value()

	this.datasets = _.zipObject(datasetNames, this.datasets)

	// Add human-readable stuff to events
	var cities = {}
	this.events = _.each(this.rawData.events, (event, i) => {
		event.index = i
		event.civ   = this.civs[event.civId] ? this.civs[event.civId].name : null

		// Add type name
		switch (event.typeId) {
			case 0:  event.type  = 'MESSAGE';            break
			case 1:  event.type  = 'CITY_FOUNDED';       break
			case 2:  event.type  = 'TILES_CLAIMED';      break
			case 3:  event.type  = 'CITIES_TRANSFERRED'; break
			case 4:  event.type  = 'CITY_RAZED';         break
			case 5:  event.type  = 'RELIGION_FOUNDED';   break
			case 6:  event.type  = 'PANTHEON_SELECTED';  break
			default: event.type  = event.typeId;         break
		}

		// Add x/y reference to keep things easy
		if (event.tiles.length == 1 && event.type != 'TILES_CLAIMED' && event.type != 'CITIES_CLAIMED') {
			event.x = event.tiles[0].x
			event.y = event.tiles[0].y
		}

		if (event.type == 'CITY_FOUNDED') {
			// Keep track of the city
			var cityName = event.text.replace(' is founded.', '')
			event.city = {name: cityName, owner: event.civ}
			cities[event.x + ',' + event.y] = event.city
		}
		else if (event.type == 'CITY_RAZED') {
			event.city = cities[event.x + ',' + event.y]
			event.text = `${event.city.name} has been burned to the ground by ${event.civ}!`
		}
		else if (event.type == 'CITIES_TRANSFERRED') {
			var cityNames = _.map(event.tiles, tile => {
				return cities[tile.x + ',' + tile.y].name
			})

			if (cityNames.length == 1) {
				event.text = `${event.civ} now controls the city of ${cityNames[0]}.`
			}
			else {
				var lastCity = cityNames.pop()

				var citiesString = cityNames.length == 1 ? cityNames[0] : (cityNames.join(', ') + ',')

				event.text = `${event.civ} now controls the cities of ${citiesString} and ${lastCity}.`
			}

			// Egypt now controls the city of Blah.
			// Egypt now controls the cities of Blah and Blah.
			// Egypt now controls the cities of Blah, Blah, and Blah.
		}

		if (event.type == 'TILES_CLAIMED') {
			if (event.civ) {
				event.text = `${event.civ} has claimed ${event.tiles.length} tile${event.tiles.length > 1 ? 's' : ''}.`
			}
			else {
				event.text = `${event.tiles.length} tile${event.tiles.length > 1 ? 's have' : ' has'} been abandoned!`
			}
		}

		// if (!event.text) {
		// 	console.dir(event)
		// }
	})

	// Add human-readable stuff to tiles
	this.tiles = _.each(this.rawData.tiles, (tile, i) => {
		switch (tile.elevationId) {
			case 0:  tile.elevation = 'MOUNTAIN';        break
			case 1:  tile.elevation = 'HILLS';           break
			case 2:  tile.elevation = 'ABOVE_SEA_LEVEL'; break
			case 3:  tile.elevation = 'BELOW_SEA_LEVEL'; break
			default: tile.elevation = tile.elevationId;  break
		}

		switch (tile.typeId) {
			case 0:  tile.type = 'GRASSLAND'; break
			case 1:  tile.type = 'PLAINS';    break
			case 2:  tile.type = 'DESERT';    break
			case 3:  tile.type = 'TUNDRA';    break
			case 4:  tile.type = 'SNOW';      break
			case 5:  tile.type = 'COAST';     break
			case 6:  tile.type = 'OCEAN';     break
			default: tile.type = tile.typeId; break
		}

		switch (tile.featureId) {
			case -1: tile.feature = 'NO_FEATURE';      break
			case  0: tile.feature = 'ICE';             break
			case  1: tile.feature = 'JUNGLE';          break
			case  2: tile.feature = 'MARSH';           break
			case  3: tile.feature = 'OASIS';           break
			case  4: tile.feature = 'FLOOD_PLAINS';    break
			case  5: tile.feature = 'FOREST';          break
			case 15: tile.feature = 'CERRO_DE_POTOSI'; break
			case 17: tile.feature = 'ATOLL';           break
			case 18: tile.feature = 'SRI_PADA';        break
			case 19: tile.feature = 'MT_SINAI';        break
			default: tile.feature = tile.featureId;    break
			// TODO: enumerate the rest of the natural wonders and feature types
		}
	})

	// Chunk the tiles a 2D array
	this.tiles = _.chunk(this.tiles, this.meta.mapWidth)

	for (var y = 0; y < this.tiles.length; y++) {
		for (var x = 0; x < this.tiles[y].length; x++) {
			this.tiles[y][x].x = x
			this.tiles[y][x].y = y
		}
	}
}


// switch (tile.type) {
// 	case 'GRASSLAND': setPixel(x * 20, (replay.mapHeight - y - 1) * 20, 115, 134,  57); break
// 	case 'PLAINS':    setPixel(x * 20, (replay.mapHeight - y - 1) * 20, 129, 122,  71); break
// 	case 'DESERT':    setPixel(x * 20, (replay.mapHeight - y - 1) * 20, 181, 182, 148); break
// 	case 'TUNDRA':    setPixel(x * 20, (replay.mapHeight - y - 1) * 20, 115, 109, 107); break
// 	case 'SNOW':      setPixel(x * 20, (replay.mapHeight - y - 1) * 20, 242, 251, 255); break
// 	case 'COAST':     setPixel(x * 20, (replay.mapHeight - y - 1) * 20,  90, 145, 143); break
// 	case 'OCEAN':     setPixel(x * 20, (replay.mapHeight - y - 1) * 20,  49,  77,  99); break
// }
	//
	//
	//
	//
	//
	//
	//
	// for (var y = 0; y < replay.mapHeight; y++) {
	// 	for (var x = 0; x < replay.mapWidth; x++) {
	// 		var tile = replay.tiles[(y * replay.mapWidth) + x]
	//
	// 	}
	// }
// }