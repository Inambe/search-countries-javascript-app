(() => {
	const constants = {
		API_URL: "https://restcountries.eu/rest/v2/",
	};
	const el = (query) => {
		return document.querySelector(query);
	};
	const nodes = {
		datalist: el("#countries-datalist"),
		countriesSearch: el("#countries-search"),
		countriesSearchReset: el("#countries-search-reset"),
		searchHistory: el("#search-history"),
		clearSearchHistory: el("#clear-search-history"),
	};
	const requestCache = {};

	// model objects
	const searchCountries = {
		query: {
			string: "",
			set: function (str) {
				this.string = str;
			},
		},
		result: {
			list: [],
			set: function (data) {
				this.list = data;
				this.updateUI();
			},
			updateUI: function () {
				if (this.list && this.list.length) {
					let options = "";
					this.list.forEach((country) => {
						// bold the query fraction from result
						var regex = new RegExp(
							`(${searchCountries.query.string})`,
							"gi"
						);
						let countryName = country.name.replace(
							regex,
							"<b>$1</b>"
						);
						options += `<li role="button" tabindex="0">${countryName}</li>`;
					});
					nodes.datalist.innerHTML = options;
					// set click events on result items
					nodes.datalist.querySelectorAll("li").forEach((el) => {
						el.addEventListener("click", onResultItemClick);
					});
				} else {
					nodes.datalist.innerHTML = "";
				}
			},
		},
		history: {
			list: [],
			add: function (item) {
				this.list.push({
					country: item,
					date: new Date(),
				});
				this.updateUI();
			},
			clear: function () {
				this.list = [];
				this.updateUI();
			},
			deleteByIndex: function (index) {
				// delete 1 item from provided index
				this.list.splice(index, 1);
				this.updateUI();
			},
			updateUI: function () {
				if (this.list && this.list.length) {
					let historyOptions = "";
					sortHistoryItems(this.list);
					this.list.forEach((historyItem, index) => {
						historyOptions +=
							`<li>` +
							`<span class="flex-column">` +
							`<span>${historyItem.country}</span>` +
							`<span class="datetime">${historyItem.date.toLocaleDateString()} ${historyItem.date.toLocaleTimeString()}</span>` +
							`</span>` +
							`<button class="delete-history-item" data-index="${index}">&#10005;</button>` +
							`</li>`;
					});
					nodes.searchHistory.innerHTML = historyOptions;
					// set click events on delete button
					nodes.searchHistory
						.querySelectorAll(".delete-history-item")
						.forEach((el) => {
							el.addEventListener(
								"click",
								onHistoryItemDeleteClick
							);
						});
				} else {
					nodes.searchHistory.innerHTML = "No data yet.";
				}
			},
		},
	};

	// events
	nodes.countriesSearchReset.addEventListener("click", () => {
		nodes.countriesSearch.value = "";
		searchCountries.result.set([]);
	});
	nodes.countriesSearch.addEventListener("input", (e) => {
		let newQuery = nodes.countriesSearch.value;
		searchCountries.query.set(newQuery);

		if (!newQuery) {
			searchCountries.result.set([]);
			return;
		}

		getCountries(newQuery)
			.then((data) => {
				searchCountries.result.set(data);
			})
			.catch((data) => {
				searchCountries.result.set([]);
			});
	});
	nodes.clearSearchHistory.addEventListener("click", () => {
		searchCountries.history.clear();
	});

	// event functions
	const onResultItemClick = (e) => {
		let item = e.target.innerHTML;
		// remove any tag in the item html
		item = item.replace(/(<[A-Za-z]+>)|(<\/[A-Za-z0-9]+>)/g, "");

		nodes.countriesSearch.value = "";
		searchCountries.result.set([]);

		searchCountries.history.add(item);
	};
	const onHistoryItemDeleteClick = (e) => {
		const target = e.target;
		// get index of clicked item from html attribute
		const index = parseInt(target.getAttribute("data-index"));
		searchCountries.history.deleteByIndex(index);
	};

	// helper functions
	const getCountries = (name) => {
		// using cache if available
		if (requestCache[name] && requestCache[name] !== "error")
			return Promise.resolve(requestCache[name]);
		if (requestCache[name] && requestCache[name] === "error")
			return Promise.reject(requestCache[name]);

		return fetch(`${constants.API_URL}name/${name}`).then((res) => {
			if (res.ok) {
				return res.json().then((data) => {
					// storing data in cache
					requestCache[name] = data;
					return data;
				});
			}
			// storing error in cache
			requestCache[name] = "error";
			return Promise.reject("No data found!");
		});
	};

	const sortHistoryItems = (history) => {
		history.sort((a, b) => a - b);
	};
})();
