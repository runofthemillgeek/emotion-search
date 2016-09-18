var app = function() {
	var app = {
		isHandling: false
	};

	var BINGKEY = '22b101d9e08a48cf8957bb70028eb7fa',
			VISIONAPI = 'b3df8f9387a34952b06f34d42f3a6af2',
			EMOAPI = 'ca568ea94e1c4cc68e88c6c653b14439';

	var $form = $("main form"),
			$search = $("#search"),
			$resContainer = $(".result-container"),
			$spinner = $('<div><span class="fa fa-spinner"></span></div>');

	var emotions = {
		happiness: ["happy", "smile", "smiling", "joy", "satisfied", "joyous", "content", "delighted"],
		anger: ["frustrated", "angry", "pissed", "enraged", "raged", "vexed", "exasperated", "displeasured", "irritated", "infuriated"],
		fear: ["afraid", "scared", "terrified", "frightened", "horrified", "alarmed", "agitated"],
		surprise: ["happy", "excited", "wow", "shocked", "astonished", "amazed", "startled", "stunned"],
		sadness: ["lonely", "sad", "crying", "depressed", "rejected", "gloomy", "unhappy", "grieved", "grievous"]
	};

	app.init = function() {
		this.registerHandlers();
		$spinner.appendTo($resContainer).hide();
	};

	app.registerHandlers = function() {
		var self = this;

		$form.submit(function(e) {
			e.preventDefault();
			if(!self.isHandling)
				self.formSubmitHandler();
		});
	};

	app.formSubmitHandler = function() {
		var self = this;
		self.isHandling = true;
		$search.prop("disabled", true);
		$resContainer.find(".search-text").fadeOut(function() {
			$spinner.show();
		});
		$resContainer.find("ul").fadeOut(function() {
			$(this).empty();
		});

		var search = $search.val();
		var emotion = self.getEmotion(search) || "happiness";
		self.queryImages(search)
			.done(function(data) {
				var results = data.value;
				results = self.decodeResults(results);
				self.filterPersons(results, function(results) {
					self.filterByEmotion(emotion, results, self.displayImages);
				});
			})
			.fail(function() {
				alert("error");
			});
	};

	app.displayImages = function(images) {
		$spinner.hide();
		var imageItems = "";
		for(var i = 0; i < images.length; ++i)
			imageItems += '<li><a target="_blank" href="' + images[i] + '"><img src="' + images[i] + '"></a></li>';
		$("<ul/>").appendTo($resContainer);
		$resContainer.find("ul").append(imageItems);
		$search.prop("disabled", false);
		app.isHandling = false;
	};

	app.getEmotion = function(str) {
		for(var emotion in emotions) {
			if(emotions.hasOwnProperty(emotion)) {
				var synonyms = emotions[emotion];
				for(var i = 0; i < synonyms.length; ++i) {
					if(str.toLowerCase().search(synonyms[i]) != -1)
						return emotion;
				}
			}
		}

		return null;
	};

	app.queryImages = function(term) {
		var results = null;

		var params = {
			"q": term,
			"count": "20",
			"offset": "0",
			"safeSearch": "Moderate",
		};

		return $.ajax({
			url: "https://api.cognitive.microsoft.com/bing/v5.0/images/search?" + $.param(params),
			beforeSend: function(xhrObj){
				xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", BINGKEY);
			},
			method: "GET",
			dataType: 'json',
		});
	};

	app.decodeResults = function(results) {
		return (results = results.map(function(elem) {
			var decoded = decodeURIComponent(elem.contentUrl);
			var components = decoded.slice(decoded.search(/\?/) + 1);
			var compArr = components.split('&');
			for(var i = 0; i < compArr.length; ++i) {
				comp = compArr[i];
				if(comp.split('=')[0] === 'r')
					return comp.slice(comp.indexOf("=") + 1);
			}

			return elem;
		}));
	};

	app.filterPersons = function(results, callback) {
		var ajaxObject = {
			method: "POST",
			crossDomain: true,
			dataType: 'json',
			url: 'https://api.projectoxford.ai/vision/v1.0/tag',
			headers: {
				'Ocp-Apim-Subscription-Key': VISIONAPI
			},
			contentType: 'application/json',
			data: {}
		};

		var filtered = [];

		var i;
		var ajaxCalls = results.length;

		for(i = 0; i < results.length; ++i) {
			ajaxObject.data = JSON.stringify({ url: results[i] });
			$.ajax(ajaxObject)
				.done(success(i))
				.fail(failure(i));
		}

		function success(i) {
			return function(data) {
				for(var j = 0; j < data.tags.length; ++j)
					if("tags" in data && data.tags[j].name.search("person") != -1) {
						filtered.push(results[i]);
						break;
					}

				--ajaxCalls;
				if(ajaxCalls <= 0) callback(filtered);
			};
		}

		function failure(i) {
			return function() {
				--ajaxCalls;
				if(ajaxCalls <= 0) callback(filtered);
			};
		}
	};

	app.filterByEmotion = function(emotion, images, callback) {
		var ajaxObject = {
			method: "POST",
			crossDomain: true,
			dataType: 'json',
			url: 'https://api.projectoxford.ai/emotion/v1.0/recognize',
			headers: {
				'Ocp-Apim-Subscription-Key': EMOAPI
			},
			contentType: 'application/json',
			data: {},
			timeout: 5000
		};

		var filtered = [],
				url,
				ajaxCalls = images.length;


		for(var i = 0; i < images.length; ++i) {
			url = images[i];
			ajaxObject.data = JSON.stringify({ url: url });
			$.ajax(ajaxObject)
				.done(success(i))
				.fail(failure(i));
		}

		function success(i) {
			return function(data) {
				var person = data[0];

				if(person && "scores" in person && person.scores[emotion] * 1000 > 80)
					filtered.push(images[i]);

				--ajaxCalls;
				if(ajaxCalls <= 0) callback(filtered);
			};
		}

		function failure(i) {
			return function() {
				--ajaxCalls;
				if(ajaxCalls <= 0) callback(filtered);
			};
		}

	};

	return app;

};

$(function() {
	app().init();
});
