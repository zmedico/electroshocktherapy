
require([
	"CheckboxWidget",
	"ColorChooser",
	"ModalDialog",
	"openFileDialog",
	"saveUrl",
	"RadioGroupWidget",
	"ShockTherapyActionBar",
	"ShockTherapyDefaults",
	"SliderWidget",
], function() {

this.ShockTherapyOptionsView = (function(global) {

	var constructor = function(uri, config, resourceFactory, resources) {
		this._uri = uri;
		this._config = config;
		this._resourceFactory = resourceFactory;
		this._resources = resources;
		this._container = null;
		this._callback = null;
		this._content = null;
		this._req = null;
	}

	constructor.prototype.configureActionBar = function(actionBar) {
		actionBar.setTitle("Options");
		actionBar.setUpButtonUri("main.html");
		actionBar.setActions(["Main", "About"]);
		actionBar.show();
	}

	constructor.prototype.display = function(container, callback) {
		if (this._content === null) {
			this._container = container;
			this._callback = callback;
			this._initContent();
		}
		else {
			container.appendChild(this._content);
			if (callback)
				callback.apply(global);
		}
	}

	constructor.prototype.undisplay = function() {
	}

	constructor.prototype._initContent = function() {
		this._req = new XMLHttpRequest();
		this._req.onreadystatechange = this._loadCallback.bind(this);
		this._req.open("GET", this._uri);
		this._req.send(null);
	}

	constructor.prototype._loadCallback = function(e) {
		if (this._req.readyState === 4) {
			if (this._req.status !== 200)
				throw this._req.statusText;
			var div = this._container.ownerDocument.createElement("div");
			div.innerHTML = this._req.responseText;
			this._req = null;
			this._content = div.firstChild;
			div.removeChild(div.firstChild);
			this._container.appendChild(this._content);
			this._container = null;
			this._connectListeners()
			if (this._callback) {
				this._callback.apply(global);
				this._callback = null;
			}
		}
	}

	constructor.prototype._connectListeners = function() {
		var createElement, doc, getElementById,
			resourceFactory, resources, shockTherapyConfig;
		doc = this._content.ownerDocument;
		createElement = doc.createElement.bind(doc);
		getElementById = doc.getElementById.bind(doc);

		shockTherapyConfig = this._config;
		resourceFactory = this._resourceFactory;
		resources = this._resources;

		function sliderDialog(button, title, key)
		{
			var content, dialog, slider;
			content = createElement("div");
			var slider = new SliderWidget(
				createElement("canvas"), resources);
			slider.canvas.setAttribute("class",
				"slider sliderHorizontal dialogWidth");
			content.appendChild(slider.canvas);
			var dialog = new ModalDialog(content, {title: title});
			button.addEventListener("click",
				function(e) {
					dialog.addEventListener("click",
						function(e) {
							if (!dialog.cancelled)
							{
								shockTherapyConfig.setFloat(
									key, slider.value);
							}
						}
					)
					dialog.show();
					slider.setValue(shockTherapyConfig.getFloat(key,
						ShockTherapyDefaults[key]));
				});
		}

		function checkboxButton(button, checkboxCanvas, key)
		{
			var checkbox = new CheckboxWidget(checkboxCanvas, resources);
			checkbox.setEnabled(false); // parent button handles clicks
			checkbox.checked =
				shockTherapyConfig.getBoolean(key, ShockTherapyDefaults[key]);
			button.addEventListener("click",
				function(e) {
					checkbox.checked = !checkbox.checked;
					shockTherapyConfig.setBoolean(key,
						checkbox.checked);
				});
		}

		var themeButton = getElementById("themeButton");

		themeButton.addEventListener("click",
			function(e) {
				var radioGroup, choices, container, dialog, i, keys, themes;
				themes = resourceFactory.listThemes();
				container = createElement("div");
				choices = [];
				keys = Object.keys(themes);
				for (i = 0; i < keys.length; i++)
					choices.push(themes[keys[i]].name);

				radioGroup =
					new RadioGroupWidget(container, resources, choices);

				dialog = new ModalDialog(container, {title: "Theme"});
				dialog.addEventListener("click",
					function(e) {
						if (!dialog.cancelled &&
							radioGroup.selection != null &&
							keys[radioGroup.selection] !=
							resources.getProfileKey())
						{
							shockTherapyConfig.setString(
								"Theme", keys[radioGroup.selection]);
							global.window.location.reload();
						}
					}
				)

				dialog.show();
				for (i = 0; i < keys.length; i++)
					if (keys[i] == resources.getProfileKey()) {
						radioGroup.selection = i;
						break;
					}
			});

		checkboxButton(getElementById("soundButton"),
			getElementById("soundCheckbox"), "Sound");

		sliderDialog(getElementById("soundVolume"),
			"Sound Volume", "SoundVolume");

		checkboxButton(getElementById("vibratorButton"),
			getElementById("vibratorCheckbox"), "Vibrator");

		sliderDialog(getElementById("vibratorIntensity"),
			"Vibrator Intensity", "VibratorIntensity");

		var sparkColor = getElementById("sparkColor");

		sparkColor.addEventListener("click",
			function(e) {
				var content = createElement("div");
				content.setAttribute("class", "dialogWidth");
				var colorChooser = new ColorChooser(content, resources);
				var dialog = new ModalDialog(content, {title: "Spark Color"});
				dialog.addEventListener("click",
					function(e) {
						if (!dialog.cancelled)
						{
							shockTherapyConfig.setString("Color",
								colorChooser.getColor());
						}
					}
				)
				dialog.show();
				colorChooser.setColor(shockTherapyConfig.getString("Color",
					ShockTherapyDefaults["Color"]));
			});

		sliderDialog(getElementById("sparkHueVariance"),
			"Hue Variance", "HueVariance");

		sliderDialog(getElementById("sparkBrightnessVariance"),
			"Brightness Variance", "BrightnessVariance");

		sliderDialog(getElementById("sparkThickness"),
			"Spark Thickness", "Thickness");

		sliderDialog(getElementById("sparkDensity"),
			"Spark Density", "Density");

		sliderDialog(getElementById("sparkDuration"),
			"Spark Duration", "Duration");

		var exportOptions =
			getElementById("exportOptions");
		exportOptions.addEventListener("click",
			function(e) {
				var options = shockTherapyConfig.exportConfig();

				if (/ sugar:com\.googlecode\.electroshocktherapy$/.exec(
					global.window.navigator.userAgent) !== null)
				{
					var req = new ShockTherapySugarRequest();
					req.open("GET", "/ShockTherapyConfig.export:" +
						JSON.stringify(options, null, "\t"));
					req.send(null);
					return;
				}

				/*
				* This is handled in our android app by overriding
				* WebViewClient.shouldOverrideUrlLoading to parse
				* the data url and pass it to a file-save intent
				*/
				saveUrl("data:,"+ encodeURI(
					JSON.stringify(options, null, "\t")),
					"ShockTherapyOptions.json");
			});

		var importOptionsButton =
			getElementById("importOptionsButton");
		importOptionsButton.addEventListener("click",
			function(e) {
				if (/ android:com\.googlecode\.electroshocktherapy$/.exec(
					global.window.navigator.userAgent) !== null)
				{
					/*
					* NOTE: The FileReader object is not available in
					* Android 2.3. FileReader works in the stock
					* Android 4.0 browser, but the onload event doesn't
					* seem to fire when using our
					* WebChromeClient.openFileChooser override for
					* the WebView in our android app.
					*/
					var encoding = doc.contentEncoding || "utf-8";
					global.androidGetTextFileCb = function(content) {
						delete global.androidGetTextFileCb;
						shockTherapyConfig.importConfig(JSON.parse(content));
						global.window.location.reload();
					}
					Android.getTextFile(
						"application/json", encoding, "Import Options");
				}
				else if (/ sugar:com\.googlecode\.electroshocktherapy$/.exec(
					global.window.navigator.userAgent) !== null)
				{
					var req = new ShockTherapySugarRequest();
					req.open("GET", "/ShockTherapyConfig.import");
					req.send(null);
					return;
				}
				else
				{
					openFileDialog(function(e) {
							var reader = new FileReader();
							reader.onload = function(e) {
									shockTherapyConfig.importConfig(
										JSON.parse(e.target.result));
									global.window.location.reload();
								};
							reader.onerror = function(e) {
									throw e;
								};
							var encoding = doc.contentEncoding || "utf-8";
							reader.readAsText(e.target.files[0], encoding);
						});
				}
			});

		var resetOptionsButton =
			getElementById("resetOptionsButton");
		resetOptionsButton.addEventListener("click",
			function(e) {
				var content = createElement("div");
				var dialog = new ModalDialog(content,
					{title: "Load Defaults"});
				dialog.addEventListener("click",
					function(e) {
						if (!dialog.cancelled)
						{
							shockTherapyConfig.clear();
							global.window.location.reload();
						}
					}
				)
				dialog.show();
			});

	}

	return constructor;

})(this);

});
