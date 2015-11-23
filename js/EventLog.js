window.EventLog = function(events) {
	this.$log      = $('.log-container')
	this.$messages = this.$log.find('.log-messages')
	this.events    = events

	// Types
	this.types = []

	$('#event-select').on('change', e => {
		this.setTypes($(e.target).val())
	})

	this.setTypes($('#event-select').selectpicker('val'))

	// Add events and do initial rendering
	this.addAll(events)

	this.renderTurn(events[0].turn)

	return this
}

EventLog.prototype.add = function(event) {
	// Occasionally a message is blank? Just don't include it
	if (event.type == 'MESSAGE' && !event.text) {
		return
	}

	var $msg = $('<li>').addClass('message')
		.attr('type',  event.type)
		.attr('civid', event.civId)
		.attr('turn',  event.turn)
		.text(event.text)
		.data(event)

	if (this.types.indexOf(event.type) == -1) {
		$msg.addClass('hidden')
	}

	$msg.appendTo(this.$messages)
}

EventLog.prototype.addAll = function() {
	this.removeAll()
	_.each(this.events, this.add.bind(this))
}

EventLog.prototype.remove = function() {
}

EventLog.prototype.removeAll = function() {
	this.$messages.empty()
}

EventLog.prototype.renderTurn = function(turn) {
	this.$messages.find('.message').removeClass('active').filter(function() {
		return $(this).attr('turn') <= turn
	}).addClass('active')

	var $lastMessage  = this.$messages.find('.message.active').last()
	var messageOffset = $lastMessage.offset().top
	var listOffset    = this.$messages.offset().top
	var listScroll    = this.$messages.scrollTop()
	var listHeight    = this.$messages.height()

	this.$messages.finish().animate({
		scrollTop: turn ? (listScroll + (messageOffset - listOffset) - (listHeight / 2)) : 0
	}, 200)
}

EventLog.prototype.setTypes = function(types) {
	this.types = types

	this.$messages.find('.message').addClass('hidden')

	var searchString = _.map(types, type => {
		return `[type=${type}]`
	}).join(', ')

	this.$messages.find(searchString).removeClass('hidden')
}