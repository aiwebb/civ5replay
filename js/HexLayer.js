window.HexLayer = L.TileLayer.Canvas.extend({
	initialize: function(config) {
		this.options = _.clone(this.options, true)

		this.config = config
		this.tileCache = {}

		this.hexes = this.config.hexes

		if (this.config.hexes) {
			this.hexes = this.config.hexes
		}
		else if (this.config.height && this.config.width) {
			this.hexes = []

			for (var i = 0; i < this.config.height; i++) {
				var row = []

				for (var j = 0; j < this.config.width; j++) {
					row.push({x: j, y: i})
				}

				this.hexes.push(row)
			}
		}

		this.baseHexHeight = 2
		this.baseHexWidth  = Math.sqrt(3) / 2 * this.baseHexHeight // ~13.856406464

		if (this.config.opacity) {
			this.setOpacity(this.config.opacity)
		}

		if (this.config.drawHex) {
			this.config.drawHex = this.config.drawHex.bind(this)
		}

		if (this.config.zIndex) {
			this.setZIndex(this.config.zIndex)
		}

		this.tileCache = {}
	},

	drawTile: function(tileCanvas, tilePoint, zoom) {
		if (!this.config.drawHex) {return}

		// Get canvas context for drawing
		var ctx = tileCanvas.getContext('2d')

		// Calculate scaling factor
		var scalingFactor = Math.pow(2, zoom)

		if (tilePoint.x < 0 || tilePoint.y < 0) {
			return
		}

		if (tilePoint.x >= scalingFactor || tilePoint.y >= scalingFactor) {
			return
		}

		// Normalize tile x/y coordinates
		var tileX = tilePoint.x % scalingFactor
		var tileY = tilePoint.y % scalingFactor

		// Get cache key
		var cacheKey = [tileX, tileY, zoom].join(',')

		if (this.config.cacheKeySuffix) {
			cacheKey += this.config.cacheKeySuffix()
		}

		// Load from cache if we have it
		if (this.tileCache[cacheKey] && !this.config.nocache) {
			ctx.putImageData(this.tileCache[cacheKey], 0, 0)
			return
		}

		// Calculate cell dimensions and distance
		var hexWidth  = this.baseHexWidth  * scalingFactor
		var hexHeight = this.baseHexHeight * scalingFactor
		var hexDistX  = hexWidth
		var hexDistY  = hexHeight * 3 / 4

		// Calculate how many tile cells fit on this canvas
		var gridCellsX = tileCanvas.width  / hexDistX
		var gridCellsY = tileCanvas.height / hexDistY

		// Calculate our starting tiles
		var startHexX = tileX * gridCellsX
		var startHexY = tileY * gridCellsY

		// Calculate offsets
		var offsetX = (Math.floor(startHexX) - startHexX) * hexDistX
		var offsetY = (Math.floor(startHexY) - startHexY) * hexDistY

		// Add global offset so the origin point isn't cut off
		offsetY += hexHeight / 2

		// Floor startHexX and startHexY
		startHexX = Math.floor(startHexX)
		startHexY = Math.floor(startHexY)

		// Shift back one hex for some overlap
		startHexX -= 1
		startHexY -= 1
		offsetX -= hexDistX
		offsetY -= hexDistY
		gridCellsX += 1
		gridCellsY += 1

		// ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'
		// ctx.fillRect(0, 0, tileCanvas.width, tileCanvas.height)
		// ctx.fillStyle = null

		// Loop through the grid cells we want to render
		for (var gridX = startHexX; gridX < startHexX + gridCellsX + 1; gridX++) {
			for (var gridY = startHexY; gridY < startHexY + gridCellsY + 1; gridY++) {
				var x = ((gridX - startHexX) * hexDistX) + offsetX
				var y = ((gridY - startHexY) * hexDistY) + offsetY

				var flippedGridY = this.hexes.length - 1 - gridY

				if (flippedGridY % 2) {
					x += hexWidth / 2
				}

				// Skip if out of bounds
				if (!this.hexes[flippedGridY] || !this.hexes[flippedGridY][gridX]) {continue}

				// Our own drawing function sets up the ctx with a hex polygon
				this.preDrawHex(ctx, x, y, hexWidth, hexHeight + (this.config.overdraw || 0), this.config.gridStyle, gridX, flippedGridY)

				// Custom drawing function does something with it
				ctx.save()
				ctx.clip()

				this.config.drawHex(
					ctx,
					this.hexes[flippedGridY][gridX],
					x, y,
					x - hexWidth / 2, y - hexHeight / 2,
					x + hexWidth / 2, y + hexHeight / 2
				)

				ctx.restore()
			}
		}

		// Grid
		// ctx.strokeStyle = 'white'
		// ctx.strokeRect(0, 0, tileCanvas.width, tileCanvas.height)

		// Labels to help visualize the way tiles are laid out
		// ctx.font      = '24px serif'
		// ctx.fillStyle = 'white'
		//
		// var textHeight = 25
		// var textIndex  = 0
		// ctx.fillText('zoom: '       + zoom,        20, textHeight * textIndex); textIndex++
		// ctx.fillText('x: '          + tilePoint.x, 20, textHeight * textIndex); textIndex++
		// ctx.fillText('y: '          + tilePoint.y, 20, textHeight * textIndex); textIndex++
		// ctx.fillText('gridCellsX: ' + gridCellsX,  20, textHeight * textIndex); textIndex++
		// ctx.fillText('gridCellsY: ' + gridCellsY,  20, textHeight * textIndex); textIndex++
		// ctx.fillText('startHexX: '  + startHexX,   20, textHeight * textIndex); textIndex++
		// ctx.fillText('startHexY: '  + startHexY,   20, textHeight * textIndex); textIndex++
		// ctx.fillText('offsetX: '    + offsetX,     20, textHeight * textIndex); textIndex++
		// ctx.fillText('offsetY: '    + offsetY,     20, textHeight * textIndex); textIndex++

		this.tileCache[cacheKey] = ctx.getImageData(0, 0, tileCanvas.width, tileCanvas.height)
	},

	preDrawHex: function (ctx, x, y, width, height, gridStyle, gridX, flippedGridY) {
		var globalCompositeOperation = ctx.globalCompositeOperation
		ctx.globalCompositeOperation = 'destination-over'

		var angle  = 2 * Math.PI / 6 * (0 + 0.5)
		var startX = x + (height * 0.5) * Math.cos(angle)
		var startY = y + (height * 0.5) * Math.sin(angle)

		ctx.beginPath()
		ctx.moveTo(startX, startY)

		var lastX = startX
		var lastY = startY

		for (var i = 1; i <= 6; i++) {
			angle    = 2 * Math.PI / 6 * (i + 0.5)
			var endX = x + (height * 0.5) * Math.cos(angle)
			var endY = y + (height * 0.5) * Math.sin(angle)

			var selfEdgeName = [gridX, flippedGridY, i].join(',')
			var otherEdgeName

			switch (i) {
				case 1: otherEdgeName = [gridX,     flippedGridY + 1, 4].join(','); break
				case 2: otherEdgeName = [gridX - 1, flippedGridY + 1, 5].join(','); break
				case 3: otherEdgeName = [gridX - 1, flippedGridY,     6].join(','); break
				case 4: otherEdgeName = [gridX,     flippedGridY - 1, 1].join(','); break
				case 5: otherEdgeName = [gridX + 1, flippedGridY - 1, 2].join(','); break
				case 6: otherEdgeName = [gridX + 1, flippedGridY,     3].join(','); break
			}

			var edgeName = selfEdgeName < otherEdgeName ? selfEdgeName : otherEdgeName

			ctx.lineTo(endX, endY)

			ctx.canvas.edges = ctx.canvas.edges || {}

			if (gridStyle) {
				ctx.closePath()

				if (!ctx.canvas.edges[edgeName]) {
					ctx.canvas.edges[edgeName] = true

					if (prettyDamnClose(endX, lastX) || prettyDamnClose(endY, lastY)) {
						// Canvas is really dumb with straight lines that use transparency - we need
						// to just do it ourselves by setting individual pixels, becauses stroke()
						// will try to do pathetic anti-aliasing that completely changes the color.
						this.drawNonAntiAliasedLine(ctx, lastX, lastY, endX, endY, gridStyle)
					}
					else {
						ctx.lineWidth = 1
						ctx.strokeStyle = gridStyle
						ctx.stroke()
					}
				}

				ctx.beginPath()
				ctx.moveTo(endX, endY)
			}

			lastX = endX
			lastY = endY
		}

		ctx.globalCompositeOperation = globalCompositeOperation

		function prettyDamnClose(a, b) {
			return Math.abs((a - b) / a) < 0.01
		}
	},

	drawNonAntiAliasedLine: function(ctx, startX, startY, endX, endY, style) {
		// This is NOT a general purpose line drawing function! It's purely for bypassing
		// a bug in canvas that anti-aliases lines even when they're perfectly horizontal
		// or vertical, which distorts the color. Note that this is NOT solvable by using
		// ctx.imageSmoothingEnabled = false.

		ctx.fillStyle = style

		for (var x = startX; x <= endX; x++) {
			for (var y = startY; y <= endY; y++) {
				ctx.fillRect(x, y, 1, 1)
			}
		}

		// Mark the line as being drawn by this function
		// ctx.fillStyle = 'rgb(255, 0, 0)'
		// ctx.fillRect(startX, startY, 1, 1)
		// ctx.fillRect(endX,   endY,   1, 1)
	},

	drawImage: function(ctx, id, sx, sy, sw, sh) {
		var img = document.getElementById(id)
		ctx.drawImage(img, 0, 0, img.width, img.height, sx, sy, sw, sh)
	}
})