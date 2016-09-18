var app = function() {
	var app = {};

	var BINGKEY = '22b101d9e08a48cf8957bb70028eb7fa',
			VISIONAPI = 'b3df8f9387a34952b06f34d42f3a6af2',
			EMOAPI = 'ca568ea94e1c4cc68e88c6c653b14439';

	var $form = $("main form"),
			$search = $("#search"),
			$resContainer = $(".result-container");

	var emotions = {
		happiness: ["happy", "smile", "smiling", "joy"],
		anger: ["frustrated", "angry", "pissed"],
		fear: ["afraid", "scared"],
		surprise: ["happy", "excited", "wow"],
		sadness: ["lonely", "sad", "crying", "depressed"]
	};

	app.init = function() {
		this.registerHandlers();
	};

	app.registerHandlers = function() {
		var self = this;

		$form.submit(function(e) {
			e.preventDefault();
			self.formSubmitHandler();
		});
	};

	app.formSubmitHandler = function() {
		var self = this;
		var search = $search.val();
		var emotion = self.getEmotion(search);
		console.log(emotion);
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
		console.log(images);
		$resContainer.find(".search-text").slideUp(function() {
			var imageItems = "";
			for(var i = 0; i < images.length; ++i)
				imageItems += '<li><a target="_blank" href="' + images[i] + '"><img src="' + images[i] + '"></a></li>';
			$("<ul/>").appendTo($resContainer);
			$resContainer.find("ul").append(imageItems);
		});
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
	};

	app.queryImages = function(term) {
		var results = null;

		var params = {
			"q": term,
			"count": "10",
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
			console.log(compArr);
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

		console.log("no of images: " + images.length);

		for(var i = 0; i < images.length; ++i) {
			url = images[i];
			console.log(url);
			ajaxObject.data = JSON.stringify({ url: url });
			$.ajax(ajaxObject)
				.done(success(i))
				.fail(failure(i));
		}

		function success(i) {
			return function(data) {
				console.log(data);
				var person = data[0];

				if(person && "scores" in person && person.scores[emotion] * 1000 > 100)
					filtered.push(images[i]);

				--ajaxCalls;
				console.log(i + ", " + (images.length - 1));
				if(ajaxCalls <= 0) callback(filtered);
			};
		}

		function failure(i) {
			return function() {
				--ajaxCalls;
				console.log("fail");
				console.log(i + ", " + (images.length - 1));
				if(ajaxCalls <= 0) callback(filtered);
			};
		}

	};

	return app;

};

$(function() {
	app().init();
});
