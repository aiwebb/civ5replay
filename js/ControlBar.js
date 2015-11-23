window.ControlBar = function(config) {
	this.config = config

	this.config.onChange = (this.config.onChange || $.noop).bind(this)

	// Play/pause button
	this.$playPause = $('#playPause')
	this.$playPause.on('click', this.togglePlay.bind(this))

	// Speed slider
	this.playIntervals = [2000, 1000, 600, 400, 0]
	this.playInterval  = this.playIntervals[2]

	this.$speedSlider = $('#speedSlider')

	this.$speedSlider.slider({
		id:      'speedSlider',
		min:      0,
		max:      4,
		value:    2,
		tooltip: 'hide',
		ticks: [0, 1, 2, 3, 4],
		ticks_snap_bounds: 1
	})

	this.speedSlider = this.$speedSlider.data().slider

	this.$speedSlider.on('change', e => this.setSpeed(e.value.newValue))

	// Turn slider
	this.$turnSlider = $('#turnSlider')

	this.$turnSlider.slider({
		id:               'turnSlider',
		min:              this.config.start,
		max:              this.config.end,
		value:            this.config.start,
		tooltip:          'always',
		tooltip_position: 'bottom'
	})

	this.turnSlider = this.$turnSlider.data().slider

	this.$turnSlider.on('change', e => this.config.onChange(e.value.newValue))
	this.$turnSlider.on('slide',  e => this.config.onChange(e.value))

	// Listen for spacebar to toggle play/pause
	$(document).keydown(e => {
		switch (e.keyCode) {
			case 32: this.togglePlay();                        return // space
			case 33: this.setTurn(this.config.start);          return // page up
			case 34: this.setTurn(this.config.end);            return // page down
			case 35: this.setTurn(this.config.end);            return // end
			case 36: this.setTurn(this.config.start);          return // home
			case 37: this.step( -1);                           return // left
			case 39: this.step(  1);                           return // right
			case 38: this.step(-10);                           return // up
			case 40: this.step( 10);                           return // down
			case 49: this.speedSlider.setValue(0, true, true); return // 1
			case 50: this.speedSlider.setValue(1, true, true); return // 2
			case 51: this.speedSlider.setValue(2, true, true); return // 3
			case 52: this.speedSlider.setValue(3, true, true); return // 4
			case 53: this.speedSlider.setValue(4, true, true); return // 5
			default: return
		}
	})

	this.setTurn(this.config.initial)

	return this
}

ControlBar.prototype.getTurn = function() {
	return this.turnSlider.getValue()
}

ControlBar.prototype.setTurn = function(turn) {
	this.turnSlider.setValue(turn, true)
}

ControlBar.prototype.step = function(step) {
	if (step === undefined) {
		step = 1
	}

	if (this.getTurn() + step < this.config.start) {
		this.setTurn(this.config.start)
	}
	else if (this.getTurn() + step > this.config.end) {
		this.setTurn(this.config.end)
	}
	else {
		this.setTurn(this.getTurn() + step)
	}
}

ControlBar.prototype.play = function() {
	if (this.playTimer) {return}

	this.playTimer = setInterval(() => {
		this.step()
	}, this.playInterval)
}

ControlBar.prototype.pause = function() {
	if (!this.playTimer) {return}

	clearInterval(this.playTimer)
	delete this.playTimer
}

ControlBar.prototype.togglePlay = function() {
	if (this.playTimer) {
		this.pause()
		this.$playPause.find('i').removeClass('fa-pause').addClass('fa-play')
	}
	else {
		this.play()
		this.$playPause.find('i').removeClass('fa-play').addClass('fa-pause')
	}
}

ControlBar.prototype.setSpeed = function(speed) {
	speed = speed || 0

	this.playInterval = this.playIntervals[
		Math.max(0, Math.min(Math.round(speed), this.playIntervals.length - 1))
	]

	if (this.playTimer) {
		this.pause()
		this.play()
	}
}