function(doc) {
	var id = doc._id.split("-");
	emit([ id[0], id[1], id[2], id[3], id[4] ], {rev: doc._rev,
		count : 1,
		size : JSON.stringify(doc).length
	});
}