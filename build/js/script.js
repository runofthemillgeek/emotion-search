var app = function() {
	var app = {};

	var BINGKEY = '22b101d9e08a48cf8957bb70028eb7fa';

	var $form = $("main form"),
			$search = $("#search");

	app.init = function() {
		this.registerHandlers();
		console.log($form);
	};

	app.registerHandlers = function() {
		var self = this;

		$form.submit(function(e) {
			e.preventDefault();
			var search = $search.val();
			self.queryImages(search);
		});
	};

	app.queryImages = function(term) {
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
			dataType: 'json'
		})
		.done(function(data) {
			var results = data.value;
		})
		.fail(function() {
			alert("error");
		});
	};

	return app;

};

$(function() {
	app().init();
});
