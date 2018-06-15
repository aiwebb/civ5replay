window.Map = function() {
	this.map  = L.map($('.map').get(0), {
		attributionControl: false,
		keyboardPanOffset: 0
	}).setView([0, 0], 0)

	this.turn = 0

	return this
}

Map.prototype.initLayers = function(tiles, events) {
	var self = this

	// Track the state of each tile at every turn
	this.turnStates  = []
	var eventsByTurn = _.groupBy(events, 'turn')
	var lastState    = {}

	for (var t = events[0].turn; t <= events[events.length - 1].turn; t++) {
		// Start by copying last state
		var state = _.clone(lastState, true)

		var turnEvents = eventsByTurn[t] || []

		for (var e = 0; e < turnEvents.length; e++) {
			var event = turnEvents[e]

			switch (event.type) {
				case 'CITY_FOUNDED':
					var index = [event.x, event.y].join(',')
					state[index] = {owner: event.civ, city: event.city.name}
					break

				case 'TILES_CLAIMED':
					for (var i = 0; i < event.tiles.length; i++) {
						var tile = event.tiles[i]
						var index = [tile.x, tile.y].join(',')
						state[index] = state[index] || {}

						if (event.civ) {
							state[index].owner = event.civ
						}
						else {
							delete state[index]
						}
					}

					break

				case 'CITIES_TRANSFERRED':
					for (var i = 0; i < event.tiles.length; i++) {
						var tile = event.tiles[i]
						var index = [tile.x, tile.y].join(',')
						state[index] = state[index] || {}
						state[index].owner = event.civ
					}

					break

				case 'CITY_RAZED':
					var index = [event.x, event.y].join(',')

					if (state[index]) {
						delete state[index].city
					}

					break

				default: break
			}
		}

		this.turnStates.push(state)

		lastState = state
	}

	this.layers = {
		terrain: new HexLayer({
			hexes: tiles,
			zIndex: 10,
			drawHex: function(ctx, hex, cx, cy, x1, y1, x2, y2) {
				switch (hex.type) {
					case 'GRASSLAND':
					case 'PLAINS':
					case 'DESERT':
					case 'TUNDRA':
					case 'SNOW':
					case 'COAST':
					case 'OCEAN':
						this.drawImage(ctx, hex.type, x1, y1, x2 - x1, y2 - y1)
						break
					default:
						break
				}
			}
		}),

		feature: new HexLayer({
			hexes: tiles,
			zIndex: 20,
			drawHex: function(ctx, hex, cx, cy, x1, y1, x2, y2) {
				switch (hex.feature) {
					case  'ICE':
					case  'JUNGLE':
					// case  'MARSH':
					// case  'OASIS':
					// case  'FLOOD_PLAINS':
					case  'FOREST':
						this.drawImage(ctx, hex.feature, x1, y1, x2 - x1, y2 - y1)
						break
					default:
						break
				}
			}
		}),

		elevation: new HexLayer({
			hexes: tiles,
			zIndex: 20,
			drawHex: function(ctx, hex, cx, cy, x1, y1, x2, y2) {
				switch (hex.elevation) {
					case 'MOUNTAIN':
					case 'HILLS':
						this.drawImage(ctx, hex.elevation, x1, y1, x2 - x1, y2 - y1)
						break
					default:
						break
				}
			}
		}),

		territory: new HexLayer({
			hexes: tiles,
			zIndex: 30,
			overdraw: 1,
			cacheKeySuffix: function() {
				return '-territory-' + self.turn
			},
			drawHex: function(ctx, hex, cx, cy, x1, y1, x2, y2) {
				if (!this.turnState) {return}
				var state = this.turnState[hex.x+','+hex.y]
				if (!state) {return}

				if (state.owner && hex.type != 'COAST' && hex.type != 'OCEAN') {
					var civColors = CIV_COLORS[state.owner]
					var color     = civColors ? civColors.territory : [0, 0, 0]
					ctx.fillStyle = `rgba(${color.join(',')}, 0.85)`
					ctx.fill()
				}
			}
		}),

		city: new HexLayer({
			hexes: tiles,
			zIndex: 40,
			cacheKeySuffix: function() {
				return '-city-' + self.turn
			},
			drawHex: function(ctx, hex, cx, cy, x1, y1, x2, y2) {
				if (!this.turnState) {return}
				var state = this.turnState[hex.x+','+hex.y]
				if (!state) {return}

				if (state.city) {
					var civColors = CIV_COLORS[state.owner]
					var color     = civColors ? civColors.city : [255, 255, 255]
					ctx.fillStyle = `rgba(${color.join(',')}, 0.85)`
					ctx.fill()
				}
			}
		}),

		grid: new HexLayer({
			zIndex:    50,
			width:     tiles[0].length,
			height:    tiles.length,
			gridStyle: 'rgba(255, 255, 255, 0.1)',
			drawHex: function(ctx, hex, cx, cy) {}
		})
	}

	_.each(this.layers, layer => layer.addTo(this.map))

	// Add layer switcher
	var overlays = {
		Terrain:    this.layers.terrain,
		Elevation:  this.layers.elevation,
		Features:   this.layers.feature,
		Territory:  this.layers.territory,
		Cities:     this.layers.city,
		Grid:       this.layers.grid
	}

	this.controls = {
		switcher: L.control.layers({}, overlays, {
			autoZIndex: false
		})
	}

	this.controls.switcher.addTo(this.map)

	this.renderTurn(events[0].turn)

	var north  =   85
	var west   = -180
	var south  = north - (tiles   .length * 0.3888888889)
	var east   = west  + (tiles[0].length * 2.4285714286)

	function onMapClick(e) {
		console.log(e.latlng)
	}

	this.map.on('click', onMapClick)

	var bounds = [[south, west], [north, east]]
	this.map.fitBounds(bounds)
}

Map.prototype.renderTurn = function(turn) {
	this.turn      = turn
	this.turnState = this.turnStates[turn]

	this.layers.city     .turnState = this.turnState
	this.layers.territory.turnState = this.turnState

	if (this.layers.city     ._map) {this.layers.city     .redraw()}
	if (this.layers.territory._map) {this.layers.territory.redraw()}
}