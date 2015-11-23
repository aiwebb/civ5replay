var BinaryParser = function(file, size) {
	this.view = new jDataView(file, 0, size, false)

	return this
}

BinaryParser.prototype.parseItem = function(itemConfig, includeJunk) {
	if (typeof itemConfig === 'string') {
		itemConfig = {type: itemConfig}
	}

	switch (itemConfig.type) {
		case 'byte':   return this.getBytes(itemConfig.length)
		case 'str':    return this.getString(itemConfig.length)
		case 'varstr': return this.getVarString()
		case 'int32':  return this.getInt32()
		case 'int16':  return this.getInt16()
		case 'int8':   return this.getInt8()
		case 'until':  return this.getUntil(itemConfig.value)
		case 'tell':   return this.tell()
		case 'array':  return this.getArray(itemConfig.items, includeJunk)

		default:
			break
	}
}

BinaryParser.prototype.parseItems = function(itemConfigs, includeJunk) {
	if (itemConfigs.type == 'array') {
		return this.parseItem(itemConfigs, includeJunk)
	}

	// Takes dictionary of configs
	var data = {}

	_.each(itemConfigs, (type, key) => {
		var value = this.parseItem(type, includeJunk)

		// Bail if we don't want to include junk data
		if (key.startsWith('_') && includeJunk === false) {return}

		data[key] = value
	})

	return data
}

BinaryParser.prototype.tell = function() {
	return this.view.tell()
}

BinaryParser.prototype.getBytes = function(length) {
	return this.view.getBytes(length)
}

BinaryParser.prototype.getString = function(length) {
	return this.view.getString(length)
}

BinaryParser.prototype.getInt32 = function() {
	return this.view.getInt32(this.tell(), true)
}

BinaryParser.prototype.getInt16 = function() {
	return this.view.getInt16(this.tell(), true)
}

BinaryParser.prototype.getInt8 = function() {
	return this.view.getInt8(this.tell(), true)
}

BinaryParser.prototype.getUntil = function(test) {
	var result = []
	var val = null

	do {
		val = this.getInt8()
		result.push(val)
	} while (val != test)

	return result
}

BinaryParser.prototype.getVarString = function() {
	// Variable-length string - uses first four bytes to specify length
	var length = this.getInt32()
	var value  = this.getString(length)
	return value
}

BinaryParser.prototype.getArray = function(config, includeJunk) {
	var length  = this.getInt32()
	var records = []

	for (var i = 0; i < length; i++) {
		var record = {}

		if (typeof config == 'function') {
			record = config(i, includeJunk)
		}
		else if (typeof config == 'object') {
			record = this.parseItems(config, includeJunk)
		}

		records.push(record)
	}

	return records
}