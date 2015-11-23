window.ReplayViewer = function() {
	this.init()
	return this
}

ReplayViewer.prototype.init = function() {
	this.map = new Map()

	// Support file drag-and-drop
	$('body').fileReaderJS({
		readAsDefault: 'ArrayBuffer',
		on: {
			loadend: (e, file) => {
				this.process(e.target.result, file.size)
			}
		}
	})

	this.file = getParameterByName('file')
	this.turn = getParameterByName('turn')

	if (this.file) {
		this.loadFromDropbox(this.file)
	}

	function getParameterByName(name) {
		// Thanks StackOverflow!
		name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]')
		var regex = new RegExp('[\\?&]' + name + '=([^&#]*)')
		var results = regex.exec(location.search)
		return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))
	}
}

ReplayViewer.prototype.loadFromDropbox = function(file) {
	// e.g. https://dl.dropboxusercontent.com/1/view/hrbho1q4dtro8pa/Ramesses%20II_0267%20AD-1987_42%20(9).Civ5Replay
	// file = 'hrbho1q4dtro8pa/Ramesses%20II_0267%20AD-1987_42%20(9).Civ5Replay'

	var self = this
	var xhr  = new XMLHttpRequest()

	xhr.open('GET', 'https://dl.dropboxusercontent.com/1/view/' + file, true)
	xhr.responseType = 'arraybuffer'

	xhr.onload = function(e) {
		self.process(this.response, e.total)
	}

	xhr.send()
}

ReplayViewer.prototype.process = function(data, length) {
	// Replay
	if (this.replay) {delete this.replay}

	this.replay = new Replay(data, length)
	this.replay.process()

	// Event log
	if (this.eventLog) {
		$('.log-messages').empty()
		delete this.eventLog
	}

	this.eventLog = new EventLog(this.replay.events)

	// Map
	_.each(this.map.layers, layer => {
		this.map.map.removeLayer(layer)
		delete layer
	})

	_.each(this.map.controls, control => {
		this.map.map.removeControl(control)
		delete control
	})

	this.map.initLayers(this.replay.tiles, this.replay.events)

	this.controlBar = new ControlBar({
		start:   this.replay.meta.startTurn,
		end:     this.replay.meta.endTurn,
		initial: this.turn === '' ? this.replay.meta.startTurn : (this.turn * 1),
		onChange: turn => {
			this.eventLog.renderTurn(turn)
			this.map     .renderTurn(turn)
		}
	})

	return false
}