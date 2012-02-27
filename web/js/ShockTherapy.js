
require([
	"require"
], function() {

this.ShockTherapy = (function(global) {

	var module = {

		android : null,

		goBack : function() {
			global.window.history.back();
		},

		viewChanged : function(uri) {
			if (ShockTherapy.android) {
				ShockTherapy.android.viewChanged(uri);
			}
			else if (ShockTherapy.sugar) {
				require(["ShockTherapySugarRequest"], function() {
					var req = new ShockTherapySugarRequest();
					req.open("GET", "/ShockTherapy.viewChanged:" + uri);
					req.send(null);
				});
			}
		},

		sugar: false
	}

	if (/ android:com\.googlecode\.electroshocktherapy$/.exec(
		global.window.navigator.userAgent) !== null)
		module.android = Android;
	else if (/ sugar:com\.googlecode\.electroshocktherapy$/.exec(
		global.window.navigator.userAgent) !== null)
		module.sugar = true;

	return module;

}(this));

});
