function(keys, values) {
	var count = 0, size = 0;
	values.forEach(function(v) {
		count += v.count;
		size += v.size;
	});
	return {
		count : count,
		size : size
	};
}