/*
* Matrix3DPlugin
*/

/**
* @module TweenJS
*/

(function() {
	"use strict";
  /**
   * A TweenJS plugin for using the matrix3d transform. To use simply install after
   * TweenJS has loaded:
   *
   *      createjs.Matrix3DPlugin.install();
   *
   * Please note that the Matrix3DPlugin is not included in the TweenJS minified file.
   * @class Matrix3DPlugin
   * @constructor
   **/
  var Matrix3DPlugin = function() {
    throw("Matrix3DPlugin cannot be instantiated.")
  }
  
  var vendorPrefix = (function () {
    var styles = window.getComputedStyle(document.documentElement, ''),
        pre = (Array.prototype.slice
        .call(styles)
        .join('') 
        .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
      )[1];
    
      return '-' + pre + '-';
  })();
  
  /**
   * Defaults to 'px' in all browsers. Can be set to something else, like 'em', for Firefox only.  
   * @property TRANSLATION_UNITS
   * @protected
   * @static
   **/
  Matrix3DPlugin.TRANSLATION_UNITS = 'px'; // feel free to set it to 'em', etc.
  var TRANSFORM = 'transform';
  var TRANSFORM_W_PREFIX = vendorPrefix + 'transform';
  var isFirefox = /(mozilla)(?:.*? rv:([\w.]+))?/.test(navigator.userAgent); // Firefox wants units for translation transform - px, em, etc. This plugin uses px.
  var IDENTITY = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
//  var IDENTITY_ARRAY = asArray(IDENTITY_MATRIX);
//
//  function asArray(matrix) {
//    return Array.prototype.concat.apply(Array.prototype, matrix);
//  }
//
//  function asMatrix(array) {
//    return [array.slice(0, 4), array.slice(4, 8), array.slice(8, 12), array.slice(12)];
//  }

  function toMatrix3DString(transform) {
  	var s = "matrix3d(";
  	for (var i = 0; i < 4; i++) {
  		for (var j = 0; j < 4; j++) {
  			s += transform[i][j].toFixed(10);
  			if (isFirefox && i == 3 && j < 3)
  			  s+= Matrix3DPlugin.TRANSLATION_UNITS;
  			
  			s+= ',';
  		}
  	}
  	
  	s = s.slice(0, s.length - 1);
  	s += ")";
  	return s;
  };

	function extractTransform(el) {
		var computedStyle = window.getComputedStyle(el, null); // "null" means this is not a pesudo style.
		// You can retrieve the CSS3 matrix string by the following method.
		var transform = computedStyle.getPropertyValue(TRANSFORM_W_PREFIX);
		if (!transform || transform == 'none')
		  transform = computedStyle.getPropertyValue(TRANSFORM);
		
		return !transform || transform == 'none' ? IDENTITY : parseTransform(transform);

	}

	function parseTransform(transformStr) {
		// matrix(a, b, c, d, tx, ty) is a shorthand for matrix3d(a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1).
		var matrixMatch = transformStr.match(/^matrix\((.*)\)/),
  			matrix3dMatch = !matrixMatch && transformStr.match(/^matrix3d\((.*)\)/),
  			nums = (matrixMatch || matrix3dMatch)[1].split(','),
  			matrix = [];
		
		if (matrixMatch)
			nums = [nums[0], nums[1], "0", "0", nums[2], nums[3], "0", "0", "0", "0", "1", "0", nums[4], nums[5], "0", "1"];
		
		for (var i = 0; i < 4; i++) {
			var row = matrix[i] = [];
			for (var j = 0; j < 4; j++) {
				row[j] = parseFloat(nums[i * 4 + j].trim());
			}
		}
		
		return matrix;
	}
	
	/**
	 * @property priority
	 * @protected
	 * @static
	 **/
	Matrix3DPlugin.priority = -100; // very low priority, should run last

	/**
	 * Installs this plugin for use with TweenJS. Call this once after TweenJS is loaded to enable this plugin.
	 * @method install
	 * @static
	 **/
	Matrix3DPlugin.install = function() {
		createjs.Tween.installPlugin(Matrix3DPlugin, ['transform']);
	}

	/**
	 * @method init
	 * @protected
	 * @static
	 **/
	Matrix3DPlugin.init = function(tween, prop, value) {
		return extractTransform(tween.target) || IDENTITY;
	}

	/**
	 * @method step
	 * @protected
	 * @static
	 **/
	Matrix3DPlugin.step = function(tween, prop, startValue, endValue, injectProps) {
		// unused
	}


	/**
	 * @method tween
	 * @protected
	 * @static
	 **/
	Matrix3DPlugin.tween = function(tween, prop, value, startValues, endValues, ratio, wait, end) {
		var style;
		if (prop != 'transform' || !(style = tween.target.style)) 
			return value; 
		
		value = tweenMatrix(startValues[prop], endValues[prop], ratio);
		style[TRANSFORM_W_PREFIX] = style[TRANSFORM] = toMatrix3DString(value); // set both, in case we don't need prefix
		return value;
	}
	
	function tweenMatrix(v0, v1, ratio) {
		var v = [],
			multiply = createjs.Tween.prototype._multiply;
			
		for (var i = 0; i < 4; i++) {
			var row = v[i] = [],
				v0i = v0[i],
				v1i = v1[i];
			for (var j = 0; j < 4; j++) {
				row[j] = step(v0i[j], v1i[j], ratio);
			}
		}
		
		return v;
	};

	function step(v0, v1, ratio) {
		return v0+(v1-v0)*ratio;
	}

createjs.Matrix3DPlugin = Matrix3DPlugin;
}());
