var app = function() {
	var app = {};

	var BINGKEY = '22b101d9e08a48cf8957bb70028eb7fa',
			VISIONAPI = 'b3df8f9387a34952b06f34d42f3a6af2',
			EMOAPI = 'ca568ea94e1c4cc68e88c6c653b14439';

	var $form = $("main form"),
			$search = $("#search");

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
			var search = $search.val();
			var emotion = self.getEmotion(search);
			console.log(emotion);
			var results = self.queryImages(search);
			results = self.decodeResults(results);
			results = app.filterPersons(results);
			console.log(results);
			results = app.filterByEmotion(emotion, results);
			console.log(results);
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

		$.ajax({
			url: "https://api.cognitive.microsoft.com/bing/v5.0/images/search?" + $.param(params),
			beforeSend: function(xhrObj){
				xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", BINGKEY);
			},
			method: "GET",
			dataType: 'json',
			async: false
		})
		.done(function(data) {
			results = data.value;
		})
		.fail(function() {
			alert("error");
		});

		return results;
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

	app.filterPersons = function(results) {
		var ajaxObject = {
			method: "POST",
			crossDomain: true,
			dataType: 'json',
			async: false,
			url: 'https://api.projectoxford.ai/vision/v1.0/tag',
			headers: {
				'Ocp-Apim-Subscription-Key': VISIONAPI
			},
			contentType: 'application/json',
			data: {}
		};

		var filtered = results.filter(function(elem) {
			var isPerson = false;
			ajaxObject.data = JSON.stringify({ url: elem });
			$.ajax(ajaxObject)
				.done(function(data) {
					for(var i = 0; i < data.tags.length; ++i)
						if(data.tags[i].name.search("person") != -1) {
							isPerson = true;
							break;
						}
				});

			return isPerson;
		});

		setTimeout(function() {

		}, 5000);

		return filtered;
	};

	app.filterByEmotion = function(emotion, images) {
		var ajaxObject = {
			method: "POST",
			crossDomain: true,
			dataType: 'json',
			async: false,
			url: 'https://api.projectoxford.ai/emotion/v1.0/recognize',
			headers: {
				'Ocp-Apim-Subscription-Key': EMOAPI
			},
			contentType: 'application/json',
			data: {}
		};

		var filtered = images.filter(function(url) {
			var hasEmotion = false;
			console.log(url);
			ajaxObject.data = JSON.stringify({ url: url });
			$.ajax(ajaxObject)
				.done(function(data) {
					var person = data[0];

					console.log(person.scores[emotion]);
					if(person.scores[emotion] * 1000 > 100)
						hasEmotion = true;
				});

			return hasEmotion;
		});

		setTimeout(function() {

		}, 5000);

		return filtered;
	};

	return app;

};

$(function() {
	app().init();
});
