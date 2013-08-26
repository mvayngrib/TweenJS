/*
* CSSPlugin
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

/**
* @module TweenJS
*/

// namespace:
this.createjs = this.createjs||{};

(function() {
  "use strict";
  /**
   * A TweenJS plugin for working with numeric CSS string properties (ex. top, left). To use simply install after
   * TweenJS has loaded:
   *
   *      createjs.CSSPlugin.install();
   *
   * You can adjust the CSS properties it will work with by modifying the <code>cssSuffixMap</code> property. Currently,
   * the top, left, bottom, right, width, height have a "px" suffix appended.
   *
   * Please note that the CSS Plugin is not included in the TweenJS minified file.
   * @class CSSPlugin
   * @constructor
   **/
  var CSSPlugin = function() {
    throw("CSSPlugin cannot be instantiated.")
  }

  /**
   * Defaults to 'px' in all browsers. Can be set to something else, like 'em', for Firefox only.  
   * @property TRANSLATION_UNITS
   * @protected
   * @static
   **/
  CSSPlugin.TRANSFORM_TRANSLATION_UNITS = 'px'; // feel free to set it to 'em', etc.
  var vendorPrefix = (function () {
    var styles = window.getComputedStyle(document.documentElement, ''),
        pre = (Array.prototype.slice
        .call(styles)
        .join('') 
        .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
      )[1];
  
    return '-' + pre + '-';
  })();
  
  var TRANSFORM = 'transform';
  var TRANSFORM_W_PREFIX = vendorPrefix + 'transform';
  var isFirefox = /(mozilla)(?:.*? rv:([\w.]+))?/.test(navigator.userAgent); // Firefox wants units for translation transform - px, em, etc. This plugin uses px.
  var IDENTITY_MATRIX = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
//  var IDENTITY_ARRAY = asArray(IDENTITY_MATRIX);
//
//  function asArray(matrix) {
//    return Array.prototype.concat.apply(Array.prototype, matrix);
//  }
//
//  function asMatrix(array) {
//    return [array.slice(0, 4), array.slice(4, 8), array.slice(8, 12), array.slice(12)];
//  }


// static interface:
  /**
   * Defines the default suffix map for CSS tweens. This can be overridden on a per tween basis by specifying a
   * cssSuffixMap value for the individual tween. The object maps CSS property names to the suffix to use when
   * reading or setting those properties. For example a map in the form {top:"px"} specifies that when tweening
   * the "top" CSS property, it should use the "px" suffix (ex. target.style.top = "20.5px"). This only applies
   * to tweens with the "css" config property set to true.
   * @property cssSuffixMap
   * @type Object
   * @static
   **/
  CSSPlugin.cssSuffixMap = {top:"px",left:"px",bottom:"px",right:"px",width:"px",height:"px",opacity:"",transform:""};

  /**
   * @property priority
   * @protected
   * @static
   **/
  CSSPlugin.priority = -100; // very low priority, should run last

  /**
   * Installs this plugin for use with TweenJS. Call this once after TweenJS is loaded to enable this plugin.
   * @method install
   * @static
   **/
  CSSPlugin.install = function() {
    var arr = [], map = CSSPlugin.cssSuffixMap;
    for (var n in map) { arr.push(n); }
    createjs.Tween.installPlugin(CSSPlugin, arr);
  }


  /**
   * @method init
   * @protected
   * @static
   **/
  CSSPlugin.init = function(tween, prop, value) {
    var sfx0,sfx1,style,map = CSSPlugin.cssSuffixMap;
    if ((sfx0 = map[prop]) == null || !(style = tween.target.style)) { return value; }
    var str = style[prop];
    if (prop == 'transform')
      return parseTransform(str);
    
    if (!str) { return 0; } // no style set.
    var i = str.length-sfx0.length;
    if ((sfx1 = str.substr(i)) != sfx0) {
      throw("CSSPlugin Error: Suffixes do not match. ("+sfx0+":"+sfx1+")");
    } else {
      return parseInt(str.substr(0,i));
    }
  }

  /**
   * @method step
   * @protected
   * @static
   **/
  CSSPlugin.step = function(tween, prop, startValue, endValue, injectProps) {
    // unused
  }


  /**
   * @method tween
   * @protected
   * @static
   **/
  CSSPlugin.tween = function(tween, prop, value, startValues, endValues, ratio, wait, end) {
    var style,map = CSSPlugin.cssSuffixMap;
    if (map[prop] == null || !(style = tween.target.style)) { return value; }
    
    if (prop == 'transform') {
      value = tweenMatrix(startValues[prop], endValues[prop], ratio);
      style[TRANSFORM_W_PREFIX] = style[TRANSFORM] = toMatrix3DString(value); // set both, in case we don't need prefix
    }
    else {
      style[prop] = value+map[prop];
    }
    
    return createjs.Tween.IGNORE;
  }

  function toMatrix3DString(transform) {
    var s = "matrix3d(";
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        s += transform[i][j].toFixed(10);
        if (isFirefox && i == 3 && j < 3)
          s+= CSSPlugin.TRANSFORM_TRANSLATION_UNITS;
        
        s+= ',';
      }
    }
    
    s = s.slice(0, s.length - 1);
    s += ")";
    return s;
  };

//  function extractTransform(el) {
//    var computedStyle = window.getComputedStyle(el, null); // "null" means this is not a pesudo style.
//    // You can retrieve the CSS3 matrix string by the following method.
//    var transform = computedStyle.getPropertyValue(TRANSFORM_W_PREFIX);
//    if (!transform || transform == 'none')
//      transform = computedStyle.getPropertyValue(TRANSFORM);
//    
//    return !transform || transform == 'none' ? IDENTITY_MATRIX : parseTransform(transform);
//
//  }

  function parseTransform(transformStr) {
    if (!transformStr)
      return IDENTITY_MATRIX;
    
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

// public properties:

// private properties:

// constructor:

// public methods:


// private methods:

createjs.CSSPlugin = CSSPlugin;
}());
