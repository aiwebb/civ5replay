// Init event selectpicker
$('#event-select').selectpicker({
	width: 275,
	noneSelectedText: 'No event types selected',
	countSelectedText: function (numSelected, numTotal) {
		return (numSelected == 1) ? '{0} item selected' : '{0} event types selected';
	}
})

$('#event-select').selectpicker('val', [
	'MESSAGE',
	'CITY_FOUNDED',
	'CITIES_TRANSFERRED',
	'CITY_RAZED',
	// 'PANTHEON_SELECTED',
	// 'RELIGION_FOUNDED'
])


// Init the sliders to get the styling
$('#speedSlider').slider({
	id:      'speedSlider',
	min:      0,
	max:      0,
	value:    0,
	tooltip: 'hide'
})

$('#turnSlider').slider({
	id:      'turnSlider',
	min:      0,
	max:      0,
	value:    0,
	tooltip: 'hide'
})

window.replayViewer = new ReplayViewer()