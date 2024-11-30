/**
 * Creates a Promise that resolves mapped Promise results to given IDs
 * @param {Promise<{}>} promises A key-value pair of Promises and their IDs.
 * @returns A new Promise.
 */
function waitForAll(promises) {
	const promiseKeys = Object.keys(promises);
	const promiseList = Object.values(promises);

	return Promise.all(promiseList).then((promiseResults) => {
		const mappedResults = {};
		promiseResults.forEach((result, i) => {
			mappedResults[promiseKeys[i]] = result;
		});
		return mappedResults;
	});
}

//  * - method
// 	* - headers
// 	* - data
// 	* - contentType
// 	* - processData
// 	* - timeout

/**
 * Creates a Promise with the results fetched from the URL.
 * @param {any} options a key-value pair of options.
 * @returns A new Promise with success and error callbacks attatched.
 */
function get(options) {
	const settings = {
		url: null,
		method: 'GET',
		contentType: true,
		headers: {
			'Content-Type': 'application/json'
		},
		processData: true,
		data: null,
		timeout: 0,
		...options // override defaults with provided options
	};

	const controller = new AbortController();
	const signal = controller.signal;

	// if contentType is set to false then clear headers (to allow multipart/form-data forms that have files)
	if (!settings.contentType) {
		settings.headers = {};
	}

	// if it's a POST request and the body is an object, encode it as URL-encoded
	if (settings.processData && settings.method === 'POST' && typeof settings.data === 'object') {
		settings.headers['Content-Type'] = 'application/x-www-form-urlencoded';
		settings.data = new URLSearchParams(settings.data).toString();
	}

	// if it's a GET request, it should NOT have a body
	else if (settings.method === 'GET') {
		settings.data = null;
	}

	const fetchOptions = {
		method: settings.method,
		headers: settings.headers,
		body: settings.data,
		signal: signal
	};

	// Make the fetch request
	const fetchPromise = fetch(settings.url, fetchOptions).then(async response => {
		const contentType = response.headers.get('content-type');
		let data;

		if (contentType && contentType.includes('application/json')) {
			// parse to json if content-type is JSON
			data = await response.json();
		} else {
			// handle other content types or plain text
			const text = await response.text();

			try {
				data = JSON.parse(text);
			} catch (e) {
				data = text;
			}
		}

		// check if the request was successful
		if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
		return data;
	}).then(data => {
		// call the success callback if provided
		if (settings.success) settings.success(data);
		return data;
	}).catch(error => {
		// call the error callback if provided
		if (settings.error) settings.error(error);
		throw error;
	});

	// handle timeout if set
	if (settings.timeout > 0) {
		const timeoutId = setTimeout(() => controller.abort(), settings.timeout);
		return fetchPromise.finally(() => clearTimeout(timeoutId));
	}

	return fetchPromise;
}

export { waitForAll/*, promiseWithTimeout, isDocumentReady, documentNotReady, documentReady*/, get };
