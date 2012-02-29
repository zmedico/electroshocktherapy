
require([
	"ContextMenu",
	"ShockTherapyWidget"
], function() {

this.ShockTherapyMainView = (function(global) {

	var constructor = function(config) {
		this._config = config
		this._canvas = null;
		this._resize_timeout_id = null;
		this._bound_resize_listener = this._resize_listener.bind(this);
		this._bound_resize_timeout = this._resize_timeout.bind(this);
	}

	constructor.prototype.configureActionBar = function(actionBar) {
		actionBar.setTitle("Shock Therapy");
		actionBar.setUpButtonUri(null);
		actionBar.setActions(["Options", "About"]);
		actionBar.hide();
	}

	constructor.prototype.display = function(container, callback) {
		if (this._canvas === null)
			this._initCanvas();
		this._canvas.width = global.window.innerWidth;
		this._canvas.height = global.window.innerHeight;
		container.appendChild(this._canvas);
		global.window.addEventListener("resize",
			this._bound_resize_listener);
		if (callback)
			callback.apply(global);
	}

	constructor.prototype.undisplay = function() {
		global.window.removeEventListener("resize",
			this._bound_resize_listener);
	}

	constructor.prototype._resize_listener = function() {
		if (this._resize_timeout_id === null)
		{
			this._resize_timeout_id = global.window.setTimeout(
				this._bound_resize_timeout, 250);
		}
	}

	constructor.prototype._resize_timeout = function() {
		this._canvas.width = global.window.innerWidth;
		this._canvas.height = global.window.innerHeight;
		this._resize_timeout_id = null;
	}

	constructor.prototype._initCanvas = function() {
		this._canvas = global.document.createElement("canvas");
		var c = this._canvas;
		c.setAttribute("class", "fullscreen black");
		c.width = global.window.innerWidth;
		c.height = global.window.innerHeight;
		var widget = new ShockTherapyWidget("..", this._config, c);

		var contextMenu = null;

		widget.canvas.addEventListener("contextmenu", function(e) {
			if (widget.running)
				return;
			if (contextMenu === null) {
				var button, hr;
				contextMenu = new ContextMenu(
					global.window.document.createElement("div"), widget.canvas);

				button = global.window.document.createElement("button");
				button.setAttribute("class", "contextMenuButton");
				button.appendChild(button.ownerDocument.createTextNode("Options"));
				button.addEventListener("click",
					function(e) {
						contextMenu.onblur();
						global.window.location.assign("main.html#options");
					});
				contextMenu.container.appendChild(button);

				hr = global.window.document.createElement("hr");
				hr.setAttribute("class", "listViewBorder");
				contextMenu.container.appendChild(hr);

				button = global.window.document.createElement("button");
				button.setAttribute("class", "contextMenuButton");
				button.appendChild(button.ownerDocument.createTextNode("About"));
				button.addEventListener("click",
					function(e) {
						contextMenu.onblur();
						global.window.location.assign("main.html#about");
					});
				contextMenu.container.appendChild(button);

				global.window.document.body.appendChild(contextMenu.container);
				widget.addEventListener("click", function(e) {
					contextMenu.onblur();
				});
			}
			contextMenu.onContextMenu(e);
		});

	}

	return constructor;

})(this);

});