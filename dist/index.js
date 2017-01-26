// Loaded ready states
const loadedStates = ['interactive', 'complete'];

// Return Promise
const whenDomReady = function (cb, doc) {
	return new Promise(function (resolve) {
		// Allow doc to be passed in as the lone first param
		if (cb && typeof cb !== 'function') {
			doc = cb;
			cb = null;
		}

		// Use global document if we don't have one
		doc = doc || window.document;

		// Handle DOM load
		const done = function () {
			return resolve(cb && cb());
		};

		// Resolve now if DOM has already loaded
		// Otherwise wait for DOMContentLoaded
		if (loadedStates.indexOf(doc.readyState) !== -1) {
			setTimeout(done, 0);
		} else {
			doc.addEventListener('DOMContentLoaded', done);
		}
	});
};

// Promise chain helper
whenDomReady.resume = function (doc) {
	return function (val) {
		return whenDomReady(doc).then(function () {
			return val;
		});
	};
};

module.exports = whenDomReady;