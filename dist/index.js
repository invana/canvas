import { Point, Ticker, Container, Graphics, Assets, FillGradient, RenderLayer, Texture, TilingSprite, Application, Rectangle, Text, HTMLText, CanvasTextMetrics, GlobalResourceRegistry, TexturePool, GraphicsPath, TextStyle, Matrix } from 'pixi.js';
import { EventEmitter, PickingIndex } from '@invana/canvas-store';
import { boundsOfCircle, scaleCircle, containsCircle, boundsOfEllipse, scaleEllipse, containsEllipse, boundsOfRect, scaleRect, containsRect, tabbedRectOutline, tabbedRectFoldLine, tabbedRectBounds, collapsedTabbedRect, fitTabbedRectToContent, scaleTabbedRect, tabbedRectTabWidth, containsTabbedRect, tabbedRectTabBox, boundsOfPath, scalePath, containsPath, boundsOfPolygon, scalePolygon, containsPolygon, rayPolygonIntersection, offsetPolygon, pointInPolygon, boundsOfRegularPolygon, scaleRegularPolygon, containsRegularPolygon, regularPolygonVertices, boundsOfStar, scaleStar, containsStar, starVertices, boundsOfArc, scaleArc, containsArc, resolveCompositeRoot, boundsOfComposite, distanceToPolylineSq, samplePath, trimPathEnds, tangentAt, Tween, linear, easeInOutSine, easeInOutCubic, easeOutCubic, samplePathAt, resolveEasing as resolveEasing$1, straightRouter, orthRouter, manhattanRouter, metroRouter, erRouter, oneSideRouter, normalPathStyle, roundedPathStyle, bezierPathStyle, quadraticPathStyle, bumpRadialPathStyle, bumpHorizontalPathStyle, bundlePathStyle, stepRadialPathStyle, smoothPathStyle, loopCurvePathStyle, loopPolylinePathStyle, centerAnchor, boundaryAnchor, perpendicularAnchor, edgePortAnchor, silhouettePortAnchor, connectorToSvg, shapeSpecToSvg, connectorGeometryKey, resolveBadgePosition, resolveConnectorBadgePosition, DEFAULT_ENDPOINT_BADGE_GAP_PX, resolveLabelScale } from '@invana/canvas-core';

// src/renderer/PixiRenderer.ts
var S = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function M(l) {
  return l && l.__esModule && Object.prototype.hasOwnProperty.call(l, "default") ? l.default : l;
}
var W = { exports: {} };
(function(l, t) {
  (function() {
    var e, n;
    n = function(i) {
      return l.exports = i;
    }, e = {
      linear: function(i, s, h, o) {
        return h * i / o + s;
      },
      easeInQuad: function(i, s, h, o) {
        return h * (i /= o) * i + s;
      },
      easeOutQuad: function(i, s, h, o) {
        return -h * (i /= o) * (i - 2) + s;
      },
      easeInOutQuad: function(i, s, h, o) {
        return (i /= o / 2) < 1 ? h / 2 * i * i + s : -h / 2 * (--i * (i - 2) - 1) + s;
      },
      easeInCubic: function(i, s, h, o) {
        return h * (i /= o) * i * i + s;
      },
      easeOutCubic: function(i, s, h, o) {
        return h * ((i = i / o - 1) * i * i + 1) + s;
      },
      easeInOutCubic: function(i, s, h, o) {
        return (i /= o / 2) < 1 ? h / 2 * i * i * i + s : h / 2 * ((i -= 2) * i * i + 2) + s;
      },
      easeInQuart: function(i, s, h, o) {
        return h * (i /= o) * i * i * i + s;
      },
      easeOutQuart: function(i, s, h, o) {
        return -h * ((i = i / o - 1) * i * i * i - 1) + s;
      },
      easeInOutQuart: function(i, s, h, o) {
        return (i /= o / 2) < 1 ? h / 2 * i * i * i * i + s : -h / 2 * ((i -= 2) * i * i * i - 2) + s;
      },
      easeInQuint: function(i, s, h, o) {
        return h * (i /= o) * i * i * i * i + s;
      },
      easeOutQuint: function(i, s, h, o) {
        return h * ((i = i / o - 1) * i * i * i * i + 1) + s;
      },
      easeInOutQuint: function(i, s, h, o) {
        return (i /= o / 2) < 1 ? h / 2 * i * i * i * i * i + s : h / 2 * ((i -= 2) * i * i * i * i + 2) + s;
      },
      easeInSine: function(i, s, h, o) {
        return -h * Math.cos(i / o * (Math.PI / 2)) + h + s;
      },
      easeOutSine: function(i, s, h, o) {
        return h * Math.sin(i / o * (Math.PI / 2)) + s;
      },
      easeInOutSine: function(i, s, h, o) {
        return -h / 2 * (Math.cos(Math.PI * i / o) - 1) + s;
      },
      easeInExpo: function(i, s, h, o) {
        return i === 0 ? s : h * Math.pow(2, 10 * (i / o - 1)) + s;
      },
      easeOutExpo: function(i, s, h, o) {
        return i === o ? s + h : h * (-Math.pow(2, -10 * i / o) + 1) + s;
      },
      easeInOutExpo: function(i, s, h, o) {
        return (i /= o / 2) < 1 ? h / 2 * Math.pow(2, 10 * (i - 1)) + s : h / 2 * (-Math.pow(2, -10 * --i) + 2) + s;
      },
      easeInCirc: function(i, s, h, o) {
        return -h * (Math.sqrt(1 - (i /= o) * i) - 1) + s;
      },
      easeOutCirc: function(i, s, h, o) {
        return h * Math.sqrt(1 - (i = i / o - 1) * i) + s;
      },
      easeInOutCirc: function(i, s, h, o) {
        return (i /= o / 2) < 1 ? -h / 2 * (Math.sqrt(1 - i * i) - 1) + s : h / 2 * (Math.sqrt(1 - (i -= 2) * i) + 1) + s;
      },
      easeInElastic: function(i, s, h, o) {
        var r, a, p;
        return p = 1.70158, a = 0, r = h, i === 0 || (i /= o), a || (a = o * 0.3), r < Math.abs(h) ? (r = h, p = a / 4) : p = a / (2 * Math.PI) * Math.asin(h / r), -(r * Math.pow(2, 10 * (i -= 1)) * Math.sin((i * o - p) * (2 * Math.PI) / a)) + s;
      },
      easeOutElastic: function(i, s, h, o) {
        var r, a, p;
        return p = 1.70158, a = 0, r = h, i === 0 || (i /= o), a || (a = o * 0.3), r < Math.abs(h) ? (r = h, p = a / 4) : p = a / (2 * Math.PI) * Math.asin(h / r), r * Math.pow(2, -10 * i) * Math.sin((i * o - p) * (2 * Math.PI) / a) + h + s;
      },
      easeInOutElastic: function(i, s, h, o) {
        var r, a, p;
        return p = 1.70158, a = 0, r = h, i === 0 || (i /= o / 2), a || (a = o * (0.3 * 1.5)), r < Math.abs(h) ? (r = h, p = a / 4) : p = a / (2 * Math.PI) * Math.asin(h / r), i < 1 ? -0.5 * (r * Math.pow(2, 10 * (i -= 1)) * Math.sin((i * o - p) * (2 * Math.PI) / a)) + s : r * Math.pow(2, -10 * (i -= 1)) * Math.sin((i * o - p) * (2 * Math.PI) / a) * 0.5 + h + s;
      },
      easeInBack: function(i, s, h, o, r) {
        return r === void 0 && (r = 1.70158), h * (i /= o) * i * ((r + 1) * i - r) + s;
      },
      easeOutBack: function(i, s, h, o, r) {
        return r === void 0 && (r = 1.70158), h * ((i = i / o - 1) * i * ((r + 1) * i + r) + 1) + s;
      },
      easeInOutBack: function(i, s, h, o, r) {
        return r === void 0 && (r = 1.70158), (i /= o / 2) < 1 ? h / 2 * (i * i * (((r *= 1.525) + 1) * i - r)) + s : h / 2 * ((i -= 2) * i * (((r *= 1.525) + 1) * i + r) + 2) + s;
      },
      easeInBounce: function(i, s, h, o) {
        var r;
        return r = e.easeOutBounce(o - i, 0, h, o), h - r + s;
      },
      easeOutBounce: function(i, s, h, o) {
        return (i /= o) < 1 / 2.75 ? h * (7.5625 * i * i) + s : i < 2 / 2.75 ? h * (7.5625 * (i -= 1.5 / 2.75) * i + 0.75) + s : i < 2.5 / 2.75 ? h * (7.5625 * (i -= 2.25 / 2.75) * i + 0.9375) + s : h * (7.5625 * (i -= 2.625 / 2.75) * i + 0.984375) + s;
      },
      easeInOutBounce: function(i, s, h, o) {
        var r;
        return i < o / 2 ? (r = e.easeInBounce(i * 2, 0, h, o), r * 0.5 + s) : (r = e.easeOutBounce(i * 2 - o, 0, h, o), r * 0.5 + h * 0.5 + s);
      }
    }, n(e);
  }).call(S);
})(W);
var O = W.exports;
var v = /* @__PURE__ */ M(O);
function x(l, t) {
  if (l) {
    if (typeof l == "function")
      return l;
    if (typeof l == "string")
      return v[l];
  } else
    return v[t];
}
var P = class {
  constructor(t) {
    this.viewport = t, this.touches = [], this.addListeners();
  }
  /** Add input listeners */
  addListeners() {
    this.viewport.eventMode = "static", this.viewport.forceHitArea || (this.viewport.hitArea = new Rectangle(0, 0, this.viewport.worldWidth, this.viewport.worldHeight)), this.viewport.on("pointerdown", this.down, this), this.viewport.options.allowPreserveDragOutside ? this.viewport.on("globalpointermove", this.move, this) : this.viewport.on("pointermove", this.move, this), this.viewport.on("pointerup", this.up, this), this.viewport.on("pointerupoutside", this.up, this), this.viewport.on("pointercancel", this.up, this), this.viewport.options.allowPreserveDragOutside || this.viewport.on("pointerleave", this.up, this), this.wheelFunction = (t) => this.handleWheel(t), this.viewport.options.events.domElement.addEventListener(
      "wheel",
      this.wheelFunction,
      { passive: this.viewport.options.passiveWheel }
    ), this.isMouseDown = false;
  }
  /**
   * Removes all event listeners from viewport
   * (useful for cleanup of wheel when removing viewport)
   */
  destroy() {
    var t;
    (t = this.viewport.options.events.domElement) == null || t.removeEventListener("wheel", this.wheelFunction);
  }
  /**
   * handle down events for viewport
   *
   * @param {PIXI.FederatedPointerEvent} event
   */
  down(t) {
    if (this.viewport.pause || !this.viewport.visible)
      return;
    if (t.pointerType === "mouse" ? this.isMouseDown = true : this.get(t.pointerId) || this.touches.push({ id: t.pointerId, last: null }), this.count() === 1) {
      this.last = t.global.clone();
      const n = this.viewport.plugins.get("decelerate", true), i = this.viewport.plugins.get("bounce", true);
      (!n || !n.isActive()) && (!i || !i.isActive()) ? this.clickedAvailable = true : this.clickedAvailable = false;
    } else
      this.clickedAvailable = false;
    this.viewport.plugins.down(t) && this.viewport.options.stopPropagation && t.stopPropagation();
  }
  /** Clears all pointer events */
  clear() {
    this.isMouseDown = false, this.touches = [], this.last = null;
  }
  /**
   * @param {number} change
   * @returns whether change exceeds threshold
   */
  checkThreshold(t) {
    return Math.abs(t) >= this.viewport.threshold;
  }
  /** Handle move events for viewport */
  move(t) {
    if (this.viewport.pause || !this.viewport.visible)
      return;
    const e = this.viewport.plugins.move(t);
    if (this.clickedAvailable && this.last) {
      const n = t.global.x - this.last.x, i = t.global.y - this.last.y;
      (this.checkThreshold(n) || this.checkThreshold(i)) && (this.clickedAvailable = false);
    }
    e && this.viewport.options.stopPropagation && t.stopPropagation();
  }
  /** Handle up events for viewport */
  up(t) {
    if (this.viewport.pause || !this.viewport.visible)
      return;
    t.pointerType === "mouse" && (this.isMouseDown = false), t.pointerType !== "mouse" && this.remove(t.pointerId);
    const e = this.viewport.plugins.up(t);
    this.clickedAvailable && this.count() === 0 && this.last && (this.viewport.emit("clicked", {
      event: t,
      screen: this.last,
      world: this.viewport.toWorld(this.last),
      viewport: this.viewport
    }), this.clickedAvailable = false), e && this.viewport.options.stopPropagation && t.stopPropagation();
  }
  /** Gets pointer position if this.interaction is set */
  getPointerPosition(t) {
    const e = new Point();
    return this.viewport.options.events.mapPositionToPoint(e, t.clientX, t.clientY), e;
  }
  /** Handle wheel events */
  handleWheel(t) {
    if (this.viewport.pause || !this.viewport.visible)
      return;
    const e = this.viewport.toLocal(this.getPointerPosition(t));
    this.viewport.left <= e.x && e.x <= this.viewport.right && this.viewport.top <= e.y && e.y <= this.viewport.bottom && this.viewport.plugins.wheel(t) && !this.viewport.options.passiveWheel && t.preventDefault();
  }
  pause() {
    this.touches = [], this.isMouseDown = false;
  }
  /** Get touch by id */
  get(t) {
    for (const e of this.touches)
      if (e.id === t)
        return e;
    return null;
  }
  /** Remove touch by number */
  remove(t) {
    for (let e = 0; e < this.touches.length; e++)
      if (this.touches[e].id === t) {
        this.touches.splice(e, 1);
        return;
      }
  }
  /**
   * @returns {number} count of mouse/touch pointers that are down on the viewport
   */
  count() {
    return (this.isMouseDown ? 1 : 0) + this.touches.length;
  }
};
var m = [
  "drag",
  "pinch",
  "wheel",
  "follow",
  "mouse-edges",
  "decelerate",
  "animate",
  "bounce",
  "snap-zoom",
  "clamp-zoom",
  "snap",
  "clamp"
];
var C = class {
  /** This is called by {@link Viewport} to initialize the {@link Viewport.plugins plugins}. */
  constructor(t) {
    this.viewport = t, this.list = [], this.plugins = {};
  }
  /**
   * Inserts a named plugin or a user plugin into the viewport
   * default plugin order: 'drag', 'pinch', 'wheel', 'follow', 'mouse-edges', 'decelerate', 'bounce',
   * 'snap-zoom', 'clamp-zoom', 'snap', 'clamp'
   *
   * @param {string} name of plugin
   * @param {Plugin} plugin - instantiated Plugin class
   * @param {number} index to insert userPlugin (otherwise inserts it at the end)
   */
  add(t, e, n = m.length) {
    const i = this.plugins[t];
    i && i.destroy(), this.plugins[t] = e;
    const s = m.indexOf(t);
    s !== -1 && m.splice(s, 1), m.splice(n, 0, t), this.sort();
  }
  /**
   * Get plugin
   *
   * @param {string} name of plugin
   * @param {boolean} [ignorePaused] return null if plugin is paused
   */
  get(t, e) {
    var n;
    return e && (n = this.plugins[t]) != null && n.paused ? null : this.plugins[t];
  }
  /**
   * Update all active plugins
   *
   * @internal
   * @ignore
   * @param {number} elapsed type in milliseconds since last update
   */
  update(t) {
    for (const e of this.list)
      e.update(t);
  }
  /**
   * Resize all active plugins
   *
   * @internal
   * @ignore
   */
  resize() {
    for (const t of this.list)
      t.resize();
  }
  /** Clamps and resets bounce and decelerate (as needed) after manually moving viewport */
  reset() {
    for (const t of this.list)
      t.reset();
  }
  /** removes all installed plugins */
  removeAll() {
    this.list.forEach((t) => {
      t.destroy();
    }), this.plugins = {}, this.sort();
  }
  /**
   * Removes installed plugin
   *
   * @param {string} name of plugin (e.g., 'drag', 'pinch')
   */
  remove(t) {
    var e;
    this.plugins[t] && ((e = this.plugins[t]) == null || e.destroy(), delete this.plugins[t], this.viewport.emit("plugin-remove", t), this.sort());
  }
  /**
   * Pause plugin
   *
   * @param {string} name of plugin (e.g., 'drag', 'pinch')
   */
  pause(t) {
    var e;
    (e = this.plugins[t]) == null || e.pause();
  }
  /**
   * Resume plugin
   *
   * @param {string} name of plugin (e.g., 'drag', 'pinch')
   */
  resume(t) {
    var e;
    (e = this.plugins[t]) == null || e.resume();
  }
  /**
   * Sort plugins according to PLUGIN_ORDER
   *
   * @internal
   * @ignore
   */
  sort() {
    this.list = [];
    for (const t of m)
      this.plugins[t] && this.list.push(this.plugins[t]);
  }
  /**
   * Handle down for all plugins
   *
   * @internal
   * @ignore
   */
  down(t) {
    let e = false;
    for (const n of this.list)
      n.down(t) && (e = true);
    return e;
  }
  /**
   * Handle move for all plugins
   *
   * @internal
   * @ignore
   */
  move(t) {
    let e = false;
    for (const n of this.viewport.plugins.list)
      n.move(t) && (e = true);
    return e;
  }
  /**
   * Handle up for all plugins
   *
   * @internal
   * @ignore
   */
  up(t) {
    let e = false;
    for (const n of this.list)
      n.up(t) && (e = true);
    return e;
  }
  /**
   * Handle wheel event for all plugins
   *
   * @internal
   * @ignore
   */
  wheel(t) {
    let e = false;
    for (const n of this.list)
      n.wheel(t) && (e = true);
    return e;
  }
};
var u = class {
  /** @param {Viewport} parent */
  constructor(t) {
    this.parent = t, this.paused = false;
  }
  /** Called when plugin is removed */
  destroy() {
  }
  /** Handler for pointerdown PIXI event */
  down(t) {
    return false;
  }
  /** Handler for pointermove PIXI event */
  move(t) {
    return false;
  }
  /** Handler for pointerup PIXI event */
  up(t) {
    return false;
  }
  /** Handler for wheel event on div */
  wheel(t) {
    return false;
  }
  /**
   * Called on each tick
   * @param {number} elapsed time in millisecond since last update
   */
  update(t) {
  }
  /** Called when the viewport is resized */
  resize() {
  }
  /** Called when the viewport is manually moved */
  reset() {
  }
  /** Pause the plugin */
  pause() {
    this.paused = true;
  }
  /** Un-pause the plugin */
  resume() {
    this.paused = false;
  }
};
var I = {
  removeOnInterrupt: false,
  ease: "linear",
  time: 1e3
};
var k = class extends u {
  /**
   * This is called by {@link Viewport.animate}.
   *
   * @param parent
   * @param options
   */
  constructor(t, e = {}) {
    super(t), this.startWidth = null, this.startHeight = null, this.deltaWidth = null, this.deltaHeight = null, this.width = null, this.height = null, this.time = 0, this.options = Object.assign({}, I, e), this.options.ease = x(this.options.ease), this.setupPosition(), this.setupZoom(), this.time = 0;
  }
  /**
   * Setup `startX`, `startY`, `deltaX`, `deltaY`, `keepCenter`.
   *
   * This is called during construction.
   */
  setupPosition() {
    typeof this.options.position < "u" ? (this.startX = this.parent.center.x, this.startY = this.parent.center.y, this.deltaX = this.options.position.x - this.parent.center.x, this.deltaY = this.options.position.y - this.parent.center.y, this.keepCenter = false) : this.keepCenter = true;
  }
  /**
   * Setup `startWidth, `startHeight`, `deltaWidth, `deltaHeight, `width`, `height`.
   *
   * This is called during construction.
   */
  setupZoom() {
    this.width = null, this.height = null, typeof this.options.scale < "u" ? this.width = this.parent.screenWidth / this.options.scale : typeof this.options.scaleX < "u" || typeof this.options.scaleY < "u" ? (typeof this.options.scaleX < "u" && (this.width = this.parent.screenWidth / this.options.scaleX), typeof this.options.scaleY < "u" && (this.height = this.parent.screenHeight / this.options.scaleY)) : (typeof this.options.width < "u" && (this.width = this.options.width), typeof this.options.height < "u" && (this.height = this.options.height)), this.width !== null && (this.startWidth = this.parent.screenWidthInWorldPixels, this.deltaWidth = this.width - this.startWidth), this.height !== null && (this.startHeight = this.parent.screenHeightInWorldPixels, this.deltaHeight = this.height - this.startHeight);
  }
  down() {
    return this.options.removeOnInterrupt && this.parent.plugins.remove("animate"), false;
  }
  complete() {
    this.parent.plugins.remove("animate"), this.width !== null && this.parent.fitWidth(this.width, this.keepCenter, this.height === null), this.height !== null && this.parent.fitHeight(this.height, this.keepCenter, this.width === null), !this.keepCenter && this.options.position && this.parent.moveCenter(this.options.position), this.parent.emit("animate-end", this.parent), this.options.callbackOnComplete && this.options.callbackOnComplete(this.parent);
  }
  update(t) {
    if (this.paused)
      return;
    this.time += t;
    const e = new Point(this.parent.scale.x, this.parent.scale.y);
    if (this.time >= this.options.time) {
      const n = this.parent.width, i = this.parent.height;
      this.complete(), (n !== this.parent.width || i !== this.parent.height) && this.parent.emit("zoomed", { viewport: this.parent, original: e, type: "animate" });
    } else {
      const n = this.options.ease(this.time, 0, 1, this.options.time);
      if (this.width !== null) {
        const i = this.startWidth, s = this.deltaWidth;
        this.parent.fitWidth(
          i + s * n,
          this.keepCenter,
          this.height === null
        );
      }
      if (this.height !== null) {
        const i = this.startHeight, s = this.deltaHeight;
        this.parent.fitHeight(
          i + s * n,
          this.keepCenter,
          this.width === null
        );
      }
      if (this.width === null ? this.parent.scale.x = this.parent.scale.y : this.height === null && (this.parent.scale.y = this.parent.scale.x), !this.keepCenter) {
        const i = this.startX, s = this.startY, h = this.deltaX, o = this.deltaY, r = new Point(this.parent.x, this.parent.y);
        this.parent.moveCenter(i + h * n, s + o * n), this.parent.emit("moved", { viewport: this.parent, original: r, type: "animate" });
      }
      (this.width || this.height) && this.parent.emit("zoomed", { viewport: this.parent, original: e, type: "animate" });
    }
  }
};
var Y = {
  sides: "all",
  friction: 0.5,
  time: 150,
  ease: "easeInOutSine",
  underflow: "center",
  bounceBox: null
};
var X = class extends u {
  /**
   * This is called by {@link Viewport.bounce}.
   */
  constructor(t, e = {}) {
    super(t), this.options = Object.assign({}, Y, e), this.ease = x(this.options.ease, "easeInOutSine"), this.options.sides ? this.options.sides === "all" ? this.top = this.bottom = this.left = this.right = true : this.options.sides === "horizontal" ? (this.right = this.left = true, this.top = this.bottom = false) : this.options.sides === "vertical" ? (this.left = this.right = false, this.top = this.bottom = true) : (this.top = this.options.sides.indexOf("top") !== -1, this.bottom = this.options.sides.indexOf("bottom") !== -1, this.left = this.options.sides.indexOf("left") !== -1, this.right = this.options.sides.indexOf("right") !== -1) : this.left = this.top = this.right = this.bottom = false;
    const n = this.options.underflow.toLowerCase();
    n === "center" ? (this.underflowX = 0, this.underflowY = 0) : (this.underflowX = n.indexOf("left") !== -1 ? -1 : n.indexOf("right") !== -1 ? 1 : 0, this.underflowY = n.indexOf("top") !== -1 ? -1 : n.indexOf("bottom") !== -1 ? 1 : 0), this.reset();
  }
  isActive() {
    return this.toX !== null || this.toY !== null;
  }
  down() {
    return this.toX = this.toY = null, false;
  }
  up() {
    return this.bounce(), false;
  }
  update(t) {
    if (!this.paused) {
      if (this.bounce(), this.toX) {
        const e = this.toX;
        e.time += t, this.parent.emit("moved", { viewport: this.parent, type: "bounce-x" }), e.time >= this.options.time ? (this.parent.x = e.end, this.toX = null, this.parent.emit("bounce-x-end", this.parent)) : this.parent.x = this.ease(e.time, e.start, e.delta, this.options.time);
      }
      if (this.toY) {
        const e = this.toY;
        e.time += t, this.parent.emit("moved", { viewport: this.parent, type: "bounce-y" }), e.time >= this.options.time ? (this.parent.y = e.end, this.toY = null, this.parent.emit("bounce-y-end", this.parent)) : this.parent.y = this.ease(e.time, e.start, e.delta, this.options.time);
      }
    }
  }
  /** @internal */
  calcUnderflowX() {
    let t;
    switch (this.underflowX) {
      case -1:
        t = 0;
        break;
      case 1:
        t = this.parent.screenWidth - this.parent.screenWorldWidth;
        break;
      default:
        t = (this.parent.screenWidth - this.parent.screenWorldWidth) / 2;
    }
    return t;
  }
  /** @internal */
  calcUnderflowY() {
    let t;
    switch (this.underflowY) {
      case -1:
        t = 0;
        break;
      case 1:
        t = this.parent.screenHeight - this.parent.screenWorldHeight;
        break;
      default:
        t = (this.parent.screenHeight - this.parent.screenWorldHeight) / 2;
    }
    return t;
  }
  oob() {
    const t = this.options.bounceBox;
    if (t) {
      const e = typeof t.x > "u" ? 0 : t.x, n = typeof t.y > "u" ? 0 : t.y, i = typeof t.width > "u" ? this.parent.worldWidth : t.width, s = typeof t.height > "u" ? this.parent.worldHeight : t.height;
      return {
        left: this.parent.left < e,
        right: this.parent.right > i,
        top: this.parent.top < n,
        bottom: this.parent.bottom > s,
        topLeft: new Point(
          e * this.parent.scale.x,
          n * this.parent.scale.y
        ),
        bottomRight: new Point(
          i * this.parent.scale.x - this.parent.screenWidth,
          s * this.parent.scale.y - this.parent.screenHeight
        )
      };
    }
    return {
      left: this.parent.left < 0,
      right: this.parent.right > this.parent.worldWidth,
      top: this.parent.top < 0,
      bottom: this.parent.bottom > this.parent.worldHeight,
      topLeft: new Point(0, 0),
      bottomRight: new Point(
        this.parent.worldWidth * this.parent.scale.x - this.parent.screenWidth,
        this.parent.worldHeight * this.parent.scale.y - this.parent.screenHeight
      )
    };
  }
  bounce() {
    var s, h;
    if (this.paused)
      return;
    let t, e = this.parent.plugins.get("decelerate", true);
    e && (e.x || e.y) && (e.x && e.percentChangeX === ((s = e.options) == null ? void 0 : s.friction) || e.y && e.percentChangeY === ((h = e.options) == null ? void 0 : h.friction)) && (t = this.oob(), (t.left && this.left || t.right && this.right) && (e.percentChangeX = this.options.friction), (t.top && this.top || t.bottom && this.bottom) && (e.percentChangeY = this.options.friction));
    const n = this.parent.plugins.get("drag", true) || {}, i = this.parent.plugins.get("pinch", true) || {};
    if (e = e || {}, !(n != null && n.active) && !(i != null && i.active) && (!this.toX || !this.toY) && (!e.x || !e.y)) {
      t = t || this.oob();
      const o = t.topLeft, r = t.bottomRight;
      if (!this.toX && !e.x) {
        let a = null;
        t.left && this.left ? a = this.parent.screenWorldWidth < this.parent.screenWidth ? this.calcUnderflowX() : -o.x : t.right && this.right && (a = this.parent.screenWorldWidth < this.parent.screenWidth ? this.calcUnderflowX() : -r.x), a !== null && this.parent.x !== a && (this.toX = { time: 0, start: this.parent.x, delta: a - this.parent.x, end: a }, this.parent.emit("bounce-x-start", this.parent));
      }
      if (!this.toY && !e.y) {
        let a = null;
        t.top && this.top ? a = this.parent.screenWorldHeight < this.parent.screenHeight ? this.calcUnderflowY() : -o.y : t.bottom && this.bottom && (a = this.parent.screenWorldHeight < this.parent.screenHeight ? this.calcUnderflowY() : -r.y), a !== null && this.parent.y !== a && (this.toY = { time: 0, start: this.parent.y, delta: a - this.parent.y, end: a }, this.parent.emit("bounce-y-start", this.parent));
      }
    }
  }
  reset() {
    this.toX = this.toY = null, this.bounce();
  }
};
var z = {
  left: false,
  right: false,
  top: false,
  bottom: false,
  direction: null,
  underflow: "center"
};
var A = class extends u {
  /**
  * This is called by {@link Viewport.clamp}.
  */
  constructor(t, e = {}) {
    super(t), this.options = Object.assign({}, z, e), this.options.direction && (this.options.left = this.options.direction === "x" || this.options.direction === "all" ? true : null, this.options.right = this.options.direction === "x" || this.options.direction === "all" ? true : null, this.options.top = this.options.direction === "y" || this.options.direction === "all" ? true : null, this.options.bottom = this.options.direction === "y" || this.options.direction === "all" ? true : null), this.parseUnderflow(), this.last = { x: null, y: null, scaleX: null, scaleY: null }, this.update();
  }
  parseUnderflow() {
    const t = this.options.underflow.toLowerCase();
    t === "none" ? this.noUnderflow = true : t === "center" ? (this.underflowX = this.underflowY = 0, this.noUnderflow = false) : (this.underflowX = t.indexOf("left") !== -1 ? -1 : t.indexOf("right") !== -1 ? 1 : 0, this.underflowY = t.indexOf("top") !== -1 ? -1 : t.indexOf("bottom") !== -1 ? 1 : 0, this.noUnderflow = false);
  }
  move() {
    return this.update(), false;
  }
  update() {
    if (this.paused || this.parent.x === this.last.x && this.parent.y === this.last.y && this.parent.scale.x === this.last.scaleX && this.parent.scale.y === this.last.scaleY)
      return;
    const t = new Point(this.parent.x, this.parent.y), e = this.parent.plugins.decelerate || {};
    if (this.options.left !== null || this.options.right !== null) {
      let n = false;
      if (!this.noUnderflow && this.parent.screenWorldWidth < this.parent.screenWidth)
        switch (this.underflowX) {
          case -1:
            this.parent.x !== 0 && (this.parent.x = 0, n = true);
            break;
          case 1:
            this.parent.x !== this.parent.screenWidth - this.parent.screenWorldWidth && (this.parent.x = this.parent.screenWidth - this.parent.screenWorldWidth, n = true);
            break;
          default:
            this.parent.x !== (this.parent.screenWidth - this.parent.screenWorldWidth) / 2 && (this.parent.x = (this.parent.screenWidth - this.parent.screenWorldWidth) / 2, n = true);
        }
      else
        this.options.left !== null && this.parent.left < (this.options.left === true ? 0 : this.options.left) && (this.parent.x = -(this.options.left === true ? 0 : this.options.left) * this.parent.scale.x, e.x = 0, n = true), this.options.right !== null && this.parent.right > (this.options.right === true ? this.parent.worldWidth : this.options.right) && (this.parent.x = -(this.options.right === true ? this.parent.worldWidth : this.options.right) * this.parent.scale.x + this.parent.screenWidth, e.x = 0, n = true);
      n && this.parent.emit("moved", {
        viewport: this.parent,
        original: t,
        type: "clamp-x"
      });
    }
    if (this.options.top !== null || this.options.bottom !== null) {
      let n = false;
      if (!this.noUnderflow && this.parent.screenWorldHeight < this.parent.screenHeight)
        switch (this.underflowY) {
          case -1:
            this.parent.y !== 0 && (this.parent.y = 0, n = true);
            break;
          case 1:
            this.parent.y !== this.parent.screenHeight - this.parent.screenWorldHeight && (this.parent.y = this.parent.screenHeight - this.parent.screenWorldHeight, n = true);
            break;
          default:
            this.parent.y !== (this.parent.screenHeight - this.parent.screenWorldHeight) / 2 && (this.parent.y = (this.parent.screenHeight - this.parent.screenWorldHeight) / 2, n = true);
        }
      else
        this.options.top !== null && this.parent.top < (this.options.top === true ? 0 : this.options.top) && (this.parent.y = -(this.options.top === true ? 0 : this.options.top) * this.parent.scale.y, e.y = 0, n = true), this.options.bottom !== null && this.parent.bottom > (this.options.bottom === true ? this.parent.worldHeight : this.options.bottom) && (this.parent.y = -(this.options.bottom === true ? this.parent.worldHeight : this.options.bottom) * this.parent.scale.y + this.parent.screenHeight, e.y = 0, n = true);
      n && this.parent.emit("moved", {
        viewport: this.parent,
        original: t,
        type: "clamp-y"
      });
    }
    this.last.x = this.parent.x, this.last.y = this.parent.y, this.last.scaleX = this.parent.scale.x, this.last.scaleY = this.parent.scale.y;
  }
  reset() {
    this.update();
  }
};
var T = {
  minWidth: null,
  minHeight: null,
  maxWidth: null,
  maxHeight: null,
  minScale: null,
  maxScale: null
};
var _ = class extends u {
  /**
   * This is called by {@link Viewport.clampZoom}.
   */
  constructor(t, e = {}) {
    super(t), this.options = Object.assign({}, T, e), this.clamp();
  }
  resize() {
    this.clamp();
  }
  /** Clamp the viewport scale zoom) */
  clamp() {
    if (!this.paused) {
      if (this.options.minWidth || this.options.minHeight || this.options.maxWidth || this.options.maxHeight) {
        let t = this.parent.worldScreenWidth, e = this.parent.worldScreenHeight;
        if (this.options.minWidth !== null && t < this.options.minWidth) {
          const n = this.parent.scale.x;
          this.parent.fitWidth(this.options.minWidth, false, false, true), this.parent.scale.y *= this.parent.scale.x / n, t = this.parent.worldScreenWidth, e = this.parent.worldScreenHeight, this.parent.emit("zoomed", { viewport: this.parent, type: "clamp-zoom" });
        }
        if (this.options.maxWidth !== null && t > this.options.maxWidth) {
          const n = this.parent.scale.x;
          this.parent.fitWidth(this.options.maxWidth, false, false, true), this.parent.scale.y *= this.parent.scale.x / n, t = this.parent.worldScreenWidth, e = this.parent.worldScreenHeight, this.parent.emit("zoomed", { viewport: this.parent, type: "clamp-zoom" });
        }
        if (this.options.minHeight !== null && e < this.options.minHeight) {
          const n = this.parent.scale.y;
          this.parent.fitHeight(this.options.minHeight, false, false, true), this.parent.scale.x *= this.parent.scale.y / n, t = this.parent.worldScreenWidth, e = this.parent.worldScreenHeight, this.parent.emit("zoomed", { viewport: this.parent, type: "clamp-zoom" });
        }
        if (this.options.maxHeight !== null && e > this.options.maxHeight) {
          const n = this.parent.scale.y;
          this.parent.fitHeight(this.options.maxHeight, false, false, true), this.parent.scale.x *= this.parent.scale.y / n, this.parent.emit("zoomed", { viewport: this.parent, type: "clamp-zoom" });
        }
      } else if (this.options.minScale || this.options.maxScale) {
        const t = { x: null, y: null }, e = { x: null, y: null };
        if (typeof this.options.minScale == "number")
          t.x = this.options.minScale, t.y = this.options.minScale;
        else if (this.options.minScale !== null) {
          const s = this.options.minScale;
          t.x = typeof s.x > "u" ? null : s.x, t.y = typeof s.y > "u" ? null : s.y;
        }
        if (typeof this.options.maxScale == "number")
          e.x = this.options.maxScale, e.y = this.options.maxScale;
        else if (this.options.maxScale !== null) {
          const s = this.options.maxScale;
          e.x = typeof s.x > "u" ? null : s.x, e.y = typeof s.y > "u" ? null : s.y;
        }
        let n = this.parent.scale.x, i = this.parent.scale.y;
        t.x !== null && n < t.x && (n = t.x), e.x !== null && n > e.x && (n = e.x), t.y !== null && i < t.y && (i = t.y), e.y !== null && i > e.y && (i = e.y), (n !== this.parent.scale.x || i !== this.parent.scale.y) && (this.parent.scale.set(n, i), this.parent.emit("zoomed", { viewport: this.parent, type: "clamp-zoom" }));
      }
    }
  }
  reset() {
    this.clamp();
  }
};
var L = {
  friction: 0.98,
  bounce: 0.8,
  minSpeed: 0.01
};
var d = 16;
var E = class extends u {
  /**
   * This is called by {@link Viewport.decelerate}.
   */
  constructor(t, e = {}) {
    super(t), this.options = Object.assign({}, L, e), this.saved = [], this.timeSinceRelease = 0, this.reset(), this.parent.on("moved", (n) => this.handleMoved(n));
  }
  down() {
    return this.saved = [], this.x = this.y = null, false;
  }
  isActive() {
    return !!(this.x || this.y);
  }
  move() {
    if (this.paused)
      return false;
    const t = this.parent.input.count();
    return (t === 1 || t > 1 && !this.parent.plugins.get("pinch", true)) && (this.saved.push({ x: this.parent.x, y: this.parent.y, time: performance.now() }), this.saved.length > 60 && this.saved.splice(0, 30)), false;
  }
  /** Listener to viewport's "moved" event. */
  handleMoved(t) {
    if (this.saved.length) {
      const e = this.saved[this.saved.length - 1];
      t.type === "clamp-x" && t.original ? e.x === t.original.x && (e.x = this.parent.x) : t.type === "clamp-y" && t.original && e.y === t.original.y && (e.y = this.parent.y);
    }
  }
  up() {
    if (this.parent.input.count() === 0 && this.saved.length) {
      const t = performance.now();
      for (const e of this.saved)
        if (e.time >= t - 100) {
          const n = t - e.time;
          this.x = (this.parent.x - e.x) / n, this.y = (this.parent.y - e.y) / n, this.percentChangeX = this.percentChangeY = this.options.friction, this.timeSinceRelease = 0;
          break;
        }
    }
    return false;
  }
  /**
   * Manually activate deceleration, starting from the (x, y) velocity components passed in the options.
   *
   * @param {object} options
   * @param {number} [options.x] - Specify x-component of initial velocity.
   * @param {number} [options.y] - Specify y-component of initial velocity.
   */
  activate(t) {
    t = t || {}, typeof t.x < "u" && (this.x = t.x, this.percentChangeX = this.options.friction), typeof t.y < "u" && (this.y = t.y, this.percentChangeY = this.options.friction);
  }
  update(t) {
    if (this.paused)
      return;
    const e = this.x || this.y, n = this.timeSinceRelease, i = this.timeSinceRelease + t;
    if (this.x) {
      const s = this.percentChangeX, h = Math.log(s);
      this.parent.x += this.x * d / h * (Math.pow(s, i / d) - Math.pow(s, n / d)), this.x *= Math.pow(this.percentChangeX, t / d);
    }
    if (this.y) {
      const s = this.percentChangeY, h = Math.log(s);
      this.parent.y += this.y * d / h * (Math.pow(s, i / d) - Math.pow(s, n / d)), this.y *= Math.pow(this.percentChangeY, t / d);
    }
    this.timeSinceRelease += t, this.x && this.y ? Math.abs(this.x) < this.options.minSpeed && Math.abs(this.y) < this.options.minSpeed && (this.x = 0, this.y = 0) : (Math.abs(this.x || 0) < this.options.minSpeed && (this.x = 0), Math.abs(this.y || 0) < this.options.minSpeed && (this.y = 0)), e && this.parent.emit("moved", { viewport: this.parent, type: "decelerate" });
  }
  reset() {
    this.x = this.y = null;
  }
};
var D = {
  direction: "all",
  pressDrag: true,
  wheel: true,
  wheelScroll: 1,
  reverse: false,
  clampWheel: false,
  underflow: "center",
  factor: 1,
  mouseButtons: "all",
  keyToPress: null,
  ignoreKeyToPressOnTouch: false,
  lineHeight: 20,
  wheelSwapAxes: false
};
var U = class extends u {
  /**
  * This is called by {@link Viewport.drag}.
  */
  constructor(t, e = {}) {
    super(t), this.windowEventHandlers = [], this.options = Object.assign({}, D, e), this.moved = false, this.reverse = this.options.reverse ? 1 : -1, this.xDirection = !this.options.direction || this.options.direction === "all" || this.options.direction === "x", this.yDirection = !this.options.direction || this.options.direction === "all" || this.options.direction === "y", this.keyIsPressed = false, this.parseUnderflow(), this.mouseButtons(this.options.mouseButtons), this.options.keyToPress && this.handleKeyPresses(this.options.keyToPress);
  }
  /**
  * Handles keypress events and set the keyIsPressed boolean accordingly
  *
  * @param {array} codes - key codes that can be used to trigger drag event
  */
  handleKeyPresses(t) {
    const e = (i) => {
      t.includes(i.code) && (this.keyIsPressed = true);
    }, n = (i) => {
      t.includes(i.code) && (this.keyIsPressed = false);
    };
    this.addWindowEventHandler("keyup", n), this.addWindowEventHandler("keydown", e);
  }
  addWindowEventHandler(t, e) {
    typeof window > "u" || (window.addEventListener(t, e), this.windowEventHandlers.push({ event: t, handler: e }));
  }
  destroy() {
    typeof window > "u" || this.windowEventHandlers.forEach(({ event: t, handler: e }) => {
      window.removeEventListener(t, e);
    });
  }
  /**
  * initialize mousebuttons array
  * @param {string} buttons
  */
  mouseButtons(t) {
    !t || t === "all" ? this.mouse = [true, true, true] : this.mouse = [
      t.indexOf("left") !== -1,
      t.indexOf("middle") !== -1,
      t.indexOf("right") !== -1
    ];
  }
  parseUnderflow() {
    const t = this.options.underflow.toLowerCase();
    t === "center" ? (this.underflowX = 0, this.underflowY = 0) : (t.includes("left") ? this.underflowX = -1 : t.includes("right") ? this.underflowX = 1 : this.underflowX = 0, t.includes("top") ? this.underflowY = -1 : t.includes("bottom") ? this.underflowY = 1 : this.underflowY = 0);
  }
  /**
  * @param {PIXI.FederatedPointerEvent} event
  * @returns {boolean}
  */
  checkButtons(t) {
    const e = t.pointerType === "mouse", n = this.parent.input.count();
    return !!((n === 1 || n > 1 && !this.parent.plugins.get("pinch", true)) && (!e || this.mouse[t.button]));
  }
  /**
  * @param {PIXI.FederatedPointerEvent} event
  * @returns {boolean}
  */
  checkKeyPress(t) {
    return !this.options.keyToPress || this.keyIsPressed || this.options.ignoreKeyToPressOnTouch && t.data.pointerType === "touch";
  }
  down(t) {
    return this.paused || !this.options.pressDrag ? false : this.checkButtons(t) && this.checkKeyPress(t) ? (this.last = { x: t.global.x, y: t.global.y }, (this.parent.parent || this.parent).toLocal(
      this.last,
      void 0,
      this.last
    ), this.current = t.pointerId, true) : (this.last = null, false);
  }
  get active() {
    return this.moved;
  }
  move(t) {
    if (this.paused || !this.options.pressDrag)
      return false;
    if (this.last && this.current === t.data.pointerId) {
      const e = t.global.x, n = t.global.y, i = this.parent.input.count();
      if (i === 1 || i > 1 && !this.parent.plugins.get("pinch", true)) {
        const s = { x: e, y: n };
        (this.parent.parent || this.parent).toLocal(
          s,
          void 0,
          s
        );
        const h = s.x - this.last.x, o = s.y - this.last.y;
        if (this.moved || this.xDirection && this.parent.input.checkThreshold(h) || this.yDirection && this.parent.input.checkThreshold(o))
          return this.xDirection && (this.parent.x += (s.x - this.last.x) * this.options.factor), this.yDirection && (this.parent.y += (s.y - this.last.y) * this.options.factor), this.last = s, this.moved || this.parent.emit("drag-start", {
            event: t,
            screen: new Point(this.last.x, this.last.y),
            world: this.parent.toWorld(new Point(this.last.x, this.last.y)),
            viewport: this.parent
          }), this.moved = true, this.parent.emit("moved", { viewport: this.parent, type: "drag" }), true;
      } else
        this.moved = false;
    }
    return false;
  }
  up(t) {
    if (this.paused)
      return false;
    const e = this.parent.input.touches;
    if (e.length === 1) {
      const n = e[0];
      return n.last && (this.last = { x: n.last.x, y: n.last.y }, this.current = n.id), this.moved = false, true;
    } else if (this.last && this.moved) {
      const n = new Point(this.last.x, this.last.y);
      return (this.parent.parent || this.parent).toGlobal(n, n, true), this.parent.emit("drag-end", {
        event: t,
        screen: n,
        world: this.parent.toWorld(n),
        viewport: this.parent
      }), this.last = null, this.moved = false, true;
    }
    return false;
  }
  wheel(t) {
    if (this.paused)
      return false;
    if (this.options.wheel) {
      const e = this.parent.plugins.get("wheel", true);
      if (!e || !e.options.wheelZoom && !t.ctrlKey) {
        const n = t.deltaMode ? this.options.lineHeight : 1, i = [t.deltaX, t.deltaY], [s, h] = this.options.wheelSwapAxes ? i.reverse() : i;
        return this.xDirection && (this.parent.x += s * n * this.options.wheelScroll * this.reverse), this.yDirection && (this.parent.y += h * n * this.options.wheelScroll * this.reverse), this.options.clampWheel && this.clamp(), this.parent.emit("wheel-scroll", this.parent), this.parent.emit("moved", { viewport: this.parent, type: "wheel" }), this.parent.options.passiveWheel || t.preventDefault(), this.parent.options.stopPropagation && t.stopPropagation(), true;
      }
    }
    return false;
  }
  resume() {
    this.last = null, this.paused = false;
  }
  clamp() {
    const t = this.parent.plugins.get("decelerate", true) || {};
    if (this.options.clampWheel !== "y")
      if (this.parent.screenWorldWidth < this.parent.screenWidth)
        switch (this.underflowX) {
          case -1:
            this.parent.x = 0;
            break;
          case 1:
            this.parent.x = this.parent.screenWidth - this.parent.screenWorldWidth;
            break;
          default:
            this.parent.x = (this.parent.screenWidth - this.parent.screenWorldWidth) / 2;
        }
      else
        this.parent.left < 0 ? (this.parent.x = 0, t.x = 0) : this.parent.right > this.parent.worldWidth && (this.parent.x = -this.parent.worldWidth * this.parent.scale.x + this.parent.screenWidth, t.x = 0);
    if (this.options.clampWheel !== "x")
      if (this.parent.screenWorldHeight < this.parent.screenHeight)
        switch (this.underflowY) {
          case -1:
            this.parent.y = 0;
            break;
          case 1:
            this.parent.y = this.parent.screenHeight - this.parent.screenWorldHeight;
            break;
          default:
            this.parent.y = (this.parent.screenHeight - this.parent.screenWorldHeight) / 2;
        }
      else
        this.parent.top < 0 && (this.parent.y = 0, t.y = 0), this.parent.bottom > this.parent.worldHeight && (this.parent.y = -this.parent.worldHeight * this.parent.scale.y + this.parent.screenHeight, t.y = 0);
  }
};
var F = {
  speed: 0,
  acceleration: null,
  radius: null
};
var B = class extends u {
  /**
   * This is called by {@link Viewport.follow}.
   *
   * @param parent
   * @param target - target to follow
   * @param options
   */
  constructor(t, e, n = {}) {
    super(t), this.target = e, this.options = Object.assign({}, F, n), this.velocity = { x: 0, y: 0 };
  }
  update(t) {
    if (this.paused)
      return;
    const e = this.parent.center;
    let n = this.target.x, i = this.target.y;
    if (this.options.radius)
      if (Math.sqrt(Math.pow(this.target.y - e.y, 2) + Math.pow(this.target.x - e.x, 2)) > this.options.radius) {
        const r = Math.atan2(this.target.y - e.y, this.target.x - e.x);
        n = this.target.x - Math.cos(r) * this.options.radius, i = this.target.y - Math.sin(r) * this.options.radius;
      } else
        return;
    const s = n - e.x, h = i - e.y;
    if (s || h)
      if (this.options.speed)
        if (this.options.acceleration) {
          const o = Math.atan2(i - e.y, n - e.x), r = Math.sqrt(Math.pow(s, 2) + Math.pow(h, 2));
          if (r) {
            const a = (Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2)) / (2 * this.options.acceleration);
            r > a ? this.velocity = {
              x: Math.min(this.velocity.x + (this.options.acceleration * t, this.options.speed)),
              y: Math.min(this.velocity.y + (this.options.acceleration * t, this.options.speed))
            } : this.velocity = {
              x: Math.max(this.velocity.x - this.options.acceleration * this.options.speed, 0),
              y: Math.max(this.velocity.y - this.options.acceleration * this.options.speed, 0)
            };
            const p = Math.cos(o) * this.velocity.x, f = Math.sin(o) * this.velocity.y, g = Math.abs(p) > Math.abs(s) ? n : e.x + p, w = Math.abs(f) > Math.abs(h) ? i : e.y + f;
            this.parent.moveCenter(g, w), this.parent.emit("moved", { viewport: this.parent, type: "follow" });
          }
        } else {
          const o = Math.atan2(i - e.y, n - e.x), r = Math.cos(o) * this.options.speed, a = Math.sin(o) * this.options.speed, p = Math.abs(r) > Math.abs(s) ? n : e.x + r, f = Math.abs(a) > Math.abs(h) ? i : e.y + a;
          this.parent.moveCenter(p, f), this.parent.emit("moved", { viewport: this.parent, type: "follow" });
        }
      else
        this.parent.moveCenter(n, i), this.parent.emit("moved", { viewport: this.parent, type: "follow" });
  }
};
var N = {
  radius: null,
  distance: null,
  top: null,
  bottom: null,
  left: null,
  right: null,
  speed: 8,
  reverse: false,
  noDecelerate: false,
  linear: false,
  allowButtons: false
};
var V = class extends u {
  /**
   * This is called by {@link Viewport.mouseEdges}.
   */
  constructor(t, e = {}) {
    super(t), this.options = Object.assign({}, N, e), this.reverse = this.options.reverse ? 1 : -1, this.radiusSquared = typeof this.options.radius == "number" ? Math.pow(this.options.radius, 2) : null, this.resize();
  }
  resize() {
    const t = this.options.distance;
    t !== null ? (this.left = t, this.top = t, this.right = this.parent.screenWidth - t, this.bottom = this.parent.screenHeight - t) : this.options.radius || (this.left = this.options.left, this.top = this.options.top, this.right = this.options.right === null ? null : this.parent.screenWidth - this.options.right, this.bottom = this.options.bottom === null ? null : this.parent.screenHeight - this.options.bottom);
  }
  down() {
    return this.paused || this.options.allowButtons || (this.horizontal = this.vertical = null), false;
  }
  move(t) {
    if (this.paused || t.pointerType !== "mouse" && t.pointerId !== 1 || !this.options.allowButtons && t.buttons !== 0)
      return false;
    const e = t.global.x, n = t.global.y;
    if (this.radiusSquared) {
      const i = this.parent.toScreen(this.parent.center);
      if (Math.pow(i.x - e, 2) + Math.pow(i.y - n, 2) >= this.radiusSquared) {
        const h = Math.atan2(i.y - n, i.x - e);
        this.options.linear ? (this.horizontal = Math.round(Math.cos(h)) * this.options.speed * this.reverse * (60 / 1e3), this.vertical = Math.round(Math.sin(h)) * this.options.speed * this.reverse * (60 / 1e3)) : (this.horizontal = Math.cos(h) * this.options.speed * this.reverse * (60 / 1e3), this.vertical = Math.sin(h) * this.options.speed * this.reverse * (60 / 1e3));
      } else
        this.horizontal && this.decelerateHorizontal(), this.vertical && this.decelerateVertical(), this.horizontal = this.vertical = 0;
    } else
      this.left !== null && e < this.left ? this.horizontal = Number(this.reverse) * this.options.speed * (60 / 1e3) : this.right !== null && e > this.right ? this.horizontal = -1 * this.reverse * this.options.speed * (60 / 1e3) : (this.decelerateHorizontal(), this.horizontal = 0), this.top !== null && n < this.top ? this.vertical = Number(this.reverse) * this.options.speed * (60 / 1e3) : this.bottom !== null && n > this.bottom ? this.vertical = -1 * this.reverse * this.options.speed * (60 / 1e3) : (this.decelerateVertical(), this.vertical = 0);
    return false;
  }
  decelerateHorizontal() {
    const t = this.parent.plugins.get("decelerate", true);
    this.horizontal && t && !this.options.noDecelerate && t.activate({ x: this.horizontal * this.options.speed * this.reverse / (1e3 / 60) });
  }
  decelerateVertical() {
    const t = this.parent.plugins.get("decelerate", true);
    this.vertical && t && !this.options.noDecelerate && t.activate({ y: this.vertical * this.options.speed * this.reverse / (1e3 / 60) });
  }
  up() {
    return this.paused || (this.horizontal && this.decelerateHorizontal(), this.vertical && this.decelerateVertical(), this.horizontal = this.vertical = null), false;
  }
  update() {
    if (!this.paused && (this.horizontal || this.vertical)) {
      const t = this.parent.center;
      this.horizontal && (t.x += this.horizontal * this.options.speed), this.vertical && (t.y += this.vertical * this.options.speed), this.parent.moveCenter(t), this.parent.emit("moved", { viewport: this.parent, type: "mouse-edges" });
    }
  }
};
var Z = {
  noDrag: false,
  percent: 1,
  center: null,
  factor: 1,
  axis: "all"
};
var R = new Point();
var j = class extends u {
  /**
  * This is called by {@link Viewport.pinch}.
  */
  constructor(t, e = {}) {
    super(t), this.active = false, this.pinching = false, this.moved = false, this.options = Object.assign({}, Z, e);
  }
  down() {
    return this.parent.input.count() >= 2 ? (this.active = true, true) : false;
  }
  isAxisX() {
    return ["all", "x"].includes(this.options.axis);
  }
  isAxisY() {
    return ["all", "y"].includes(this.options.axis);
  }
  move(t) {
    if (this.paused || !this.active)
      return false;
    const { x: e, y: n } = (this.parent.parent || this.parent).toLocal(
      t.global,
      void 0,
      R
    ), i = this.parent.input.touches;
    if (i.length >= 2) {
      const s = i[0], h = i[1], o = s.last && h.last ? Math.sqrt(
        Math.pow(h.last.x - s.last.x, 2) + Math.pow(h.last.y - s.last.y, 2)
      ) : null;
      if (s.id === t.pointerId ? s.last = { x: e, y: n, data: t } : h.id === t.pointerId && (h.last = { x: e, y: n, data: t }), o) {
        let r;
        const a = new Point(
          s.last.x + (h.last.x - s.last.x) / 2,
          s.last.y + (h.last.y - s.last.y) / 2
        );
        this.options.center || (r = this.parent.toLocal(
          a,
          this.parent.parent || this.parent
        ));
        let p = Math.sqrt(
          Math.pow(
            h.last.x - s.last.x,
            2
          ) + Math.pow(
            h.last.y - s.last.y,
            2
          )
        );
        p = p === 0 ? p = 1e-10 : p;
        const f = (1 - o / p) * this.options.percent * (this.isAxisX() ? this.parent.scale.x : this.parent.scale.y);
        this.isAxisX() && (this.parent.scale.x += f), this.isAxisY() && (this.parent.scale.y += f), this.parent.emit("zoomed", {
          viewport: this.parent,
          type: "pinch",
          center: a
        });
        const g = this.parent.plugins.get("clamp-zoom", true);
        if (g && g.clamp(), this.options.center)
          this.parent.moveCenter(this.options.center);
        else {
          const w = (this.parent.parent || this.parent).toLocal(
            r,
            this.parent
          );
          this.parent.x += (a.x - w.x) * this.options.factor, this.parent.y += (a.y - w.y) * this.options.factor, this.parent.emit("moved", { viewport: this.parent, type: "pinch" });
        }
        !this.options.noDrag && this.lastCenter && (this.parent.x += (a.x - this.lastCenter.x) * this.options.factor, this.parent.y += (a.y - this.lastCenter.y) * this.options.factor, this.parent.emit("moved", { viewport: this.parent, type: "pinch" })), this.lastCenter = a, this.moved = true;
      } else
        this.pinching || (this.parent.emit("pinch-start", this.parent), this.pinching = true);
      return true;
    }
    return false;
  }
  up() {
    return this.pinching && this.parent.input.touches.length <= 1 ? (this.active = false, this.lastCenter = null, this.pinching = false, this.moved = false, this.parent.emit("pinch-end", this.parent), true) : false;
  }
};
var K = {
  topLeft: false,
  friction: 0.8,
  time: 1e3,
  ease: "easeInOutSine",
  interrupt: true,
  removeOnComplete: false,
  removeOnInterrupt: false,
  forceStart: false
};
var q = class extends u {
  /**
   * This is called by {@link Viewport.snap}.
   */
  constructor(t, e, n, i = {}) {
    super(t), this.options = Object.assign({}, K, i), this.ease = x(i.ease, "easeInOutSine"), this.x = e, this.y = n, this.options.forceStart && this.snapStart();
  }
  snapStart() {
    this.percent = 0, this.snapping = { time: 0 };
    const t = this.options.topLeft ? this.parent.corner : this.parent.center;
    this.deltaX = this.x - t.x, this.deltaY = this.y - t.y, this.startX = t.x, this.startY = t.y, this.parent.emit("snap-start", this.parent);
  }
  wheel() {
    return this.options.removeOnInterrupt && this.parent.plugins.remove("snap"), false;
  }
  down() {
    return this.options.removeOnInterrupt ? this.parent.plugins.remove("snap") : this.options.interrupt && (this.snapping = null), false;
  }
  up() {
    if (this.parent.input.count() === 0) {
      const t = this.parent.plugins.get("decelerate", true);
      t && (t.x || t.y) && (t.percentChangeX = t.percentChangeY = this.options.friction);
    }
    return false;
  }
  update(t) {
    if (!this.paused && !(this.options.interrupt && this.parent.input.count() !== 0))
      if (this.snapping) {
        const e = this.snapping;
        e.time += t;
        let n, i, s;
        const h = this.startX, o = this.startY, r = this.deltaX, a = this.deltaY;
        if (e.time > this.options.time)
          n = true, i = h + r, s = o + a;
        else {
          const p = this.ease(e.time, 0, 1, this.options.time);
          i = h + r * p, s = o + a * p;
        }
        this.options.topLeft ? this.parent.moveCorner(i, s) : this.parent.moveCenter(i, s), this.parent.emit("moved", { viewport: this.parent, type: "snap" }), n && (this.options.removeOnComplete && this.parent.plugins.remove("snap"), this.parent.emit("snap-end", this.parent), this.snapping = null);
      } else {
        const e = this.options.topLeft ? this.parent.corner : this.parent.center;
        (e.x !== this.x || e.y !== this.y) && this.snapStart();
      }
  }
};
var Q = {
  width: 0,
  height: 0,
  time: 1e3,
  ease: "easeInOutSine",
  center: null,
  interrupt: true,
  removeOnComplete: false,
  removeOnInterrupt: false,
  forceStart: false,
  noMove: false
};
var G = class extends u {
  /**
   * This is called by {@link Viewport.snapZoom}.
   */
  constructor(t, e = {}) {
    super(t), this.options = Object.assign({}, Q, e), this.ease = x(this.options.ease), this.xIndependent = false, this.yIndependent = false, this.xScale = 0, this.yScale = 0, this.options.width > 0 && (this.xScale = t.screenWidth / this.options.width, this.xIndependent = true), this.options.height > 0 && (this.yScale = t.screenHeight / this.options.height, this.yIndependent = true), this.xScale = this.xIndependent ? this.xScale : this.yScale, this.yScale = this.yIndependent ? this.yScale : this.xScale, this.options.time === 0 ? (t.container.scale.x = this.xScale, t.container.scale.y = this.yScale, this.options.removeOnComplete && this.parent.plugins.remove("snap-zoom")) : e.forceStart && this.createSnapping();
  }
  createSnapping() {
    const t = this.parent.worldScreenWidth, e = this.parent.worldScreenHeight, n = this.parent.screenWidth / this.xScale, i = this.parent.screenHeight / this.yScale;
    this.snapping = {
      time: 0,
      startX: t,
      startY: e,
      deltaX: n - t,
      deltaY: i - e
    }, this.parent.emit("snap-zoom-start", this.parent);
  }
  resize() {
    this.snapping = null, this.options.width > 0 && (this.xScale = this.parent.screenWidth / this.options.width), this.options.height > 0 && (this.yScale = this.parent.screenHeight / this.options.height), this.xScale = this.xIndependent ? this.xScale : this.yScale, this.yScale = this.yIndependent ? this.yScale : this.xScale;
  }
  wheel() {
    return this.options.removeOnInterrupt && this.parent.plugins.remove("snap-zoom"), false;
  }
  down() {
    return this.options.removeOnInterrupt ? this.parent.plugins.remove("snap-zoom") : this.options.interrupt && (this.snapping = null), false;
  }
  update(t) {
    if (this.paused || this.options.interrupt && this.parent.input.count() !== 0)
      return;
    let e;
    if (!this.options.center && !this.options.noMove && (e = this.parent.center), !this.snapping)
      (this.parent.scale.x !== this.xScale || this.parent.scale.y !== this.yScale) && this.createSnapping();
    else if (this.snapping) {
      const n = this.snapping;
      if (n.time += t, n.time >= this.options.time)
        this.parent.scale.set(this.xScale, this.yScale), this.options.removeOnComplete && this.parent.plugins.remove("snap-zoom"), this.parent.emit("snap-zoom-end", this.parent), this.snapping = null;
      else {
        const s = this.snapping, h = this.ease(s.time, s.startX, s.deltaX, this.options.time), o = this.ease(s.time, s.startY, s.deltaY, this.options.time);
        this.parent.scale.x = this.parent.screenWidth / h, this.parent.scale.y = this.parent.screenHeight / o;
      }
      const i = this.parent.plugins.get("clamp-zoom", true);
      i && i.clamp(), this.options.noMove || (this.options.center ? this.parent.moveCenter(this.options.center) : this.parent.moveCenter(e));
    }
  }
  resume() {
    this.snapping = null, super.resume();
  }
};
var J = {
  percent: 0.1,
  smooth: false,
  interrupt: true,
  reverse: false,
  center: null,
  lineHeight: 20,
  axis: "all",
  keyToPress: null,
  trackpadPinch: false,
  wheelZoom: true
};
var $ = class extends u {
  /**
  * This is called by {@link Viewport.wheel}.
  */
  constructor(t, e = {}) {
    super(t), this.options = Object.assign({}, J, e), this.keyIsPressed = false, this.options.keyToPress && this.handleKeyPresses(this.options.keyToPress);
  }
  /**
  * Handles keypress events and set the keyIsPressed boolean accordingly
  *
  * @param {array} codes - key codes that can be used to trigger zoom event
  */
  handleKeyPresses(t) {
    typeof window > "u" || (window.addEventListener("keydown", (e) => {
      t.includes(e.code) && (this.keyIsPressed = true);
    }), window.addEventListener("keyup", (e) => {
      t.includes(e.code) && (this.keyIsPressed = false);
    }));
  }
  checkKeyPress() {
    return !this.options.keyToPress || this.keyIsPressed;
  }
  down() {
    return this.options.interrupt && (this.smoothing = null), false;
  }
  isAxisX() {
    return ["all", "x"].includes(this.options.axis);
  }
  isAxisY() {
    return ["all", "y"].includes(this.options.axis);
  }
  update() {
    if (this.smoothing) {
      const t = this.smoothingCenter, e = this.smoothing;
      let n;
      this.options.center || (n = this.parent.toLocal(t)), this.isAxisX() && (this.parent.scale.x += e.x), this.isAxisY() && (this.parent.scale.y += e.y), this.parent.emit("zoomed", { viewport: this.parent, type: "wheel" });
      const i = this.parent.plugins.get("clamp-zoom", true);
      if (i && i.clamp(), this.options.center)
        this.parent.moveCenter(this.options.center);
      else {
        const s = this.parent.parent || this.parent;
        s.toLocal(n, this.parent, n);
        const h = s.toLocal(t);
        this.parent.x += h.x - n.x, this.parent.y += h.y - n.y;
      }
      this.parent.emit("moved", { viewport: this.parent, type: "wheel" }), this.smoothingCount++, typeof this.options.smooth == "number" && this.smoothingCount >= this.options.smooth && (this.smoothing = null);
    }
  }
  pinch(t) {
    if (this.paused)
      return;
    const e = this.parent.input.getPointerPosition(t), n = -t.deltaY * (t.deltaMode ? this.options.lineHeight : 1) / 200, i = Math.pow(2, (1 + this.options.percent) * n);
    let s;
    this.options.center || (s = this.parent.toLocal(e)), this.isAxisX() && (this.parent.scale.x *= i), this.isAxisY() && (this.parent.scale.y *= i), this.parent.emit("zoomed", { viewport: this.parent, type: "wheel" });
    const h = this.parent.plugins.get("clamp-zoom", true);
    if (h && h.clamp(), this.options.center)
      this.parent.moveCenter(this.options.center);
    else {
      const o = this.parent.parent || this.parent;
      o.toLocal(s, this.parent, s);
      const r = o.toLocal(e);
      this.parent.x += r.x - s.x, this.parent.y += r.y - s.y;
    }
    this.parent.emit("moved", { viewport: this.parent, type: "wheel" }), this.parent.emit("wheel-start", { event: t, viewport: this.parent });
  }
  wheel(t) {
    if (this.paused || !this.checkKeyPress())
      return false;
    if (t.ctrlKey && this.options.trackpadPinch)
      this.pinch(t);
    else if (this.options.wheelZoom) {
      const e = this.parent.input.getPointerPosition(t), i = (this.options.reverse ? -1 : 1) * -t.deltaY * (t.deltaMode ? this.options.lineHeight : 1) / 500, s = Math.pow(2, (1 + this.options.percent) * i);
      if (this.options.smooth) {
        const h = {
          x: this.smoothing ? this.smoothing.x * (this.options.smooth - this.smoothingCount) : 0,
          y: this.smoothing ? this.smoothing.y * (this.options.smooth - this.smoothingCount) : 0
        };
        this.smoothing = {
          x: ((this.parent.scale.x + h.x) * s - this.parent.scale.x) / this.options.smooth,
          y: ((this.parent.scale.y + h.y) * s - this.parent.scale.y) / this.options.smooth
        }, this.smoothingCount = 0, this.smoothingCenter = e;
      } else {
        let h;
        this.options.center || (h = this.parent.toLocal(e)), this.isAxisX() && (this.parent.scale.x *= s), this.isAxisY() && (this.parent.scale.y *= s), this.parent.emit("zoomed", { viewport: this.parent, type: "wheel" });
        const o = this.parent.plugins.get("clamp-zoom", true);
        if (o && o.clamp(), this.options.center)
          this.parent.moveCenter(this.options.center);
        else {
          const r = this.parent.parent || this.parent;
          r.toLocal(h, this.parent, h);
          const a = r.toLocal(e);
          this.parent.x += a.x - h.x, this.parent.y += a.y - h.y;
        }
      }
      this.parent.emit("moved", { viewport: this.parent, type: "wheel" }), this.parent.emit("wheel-start", { event: t, viewport: this.parent });
    }
    return !this.parent.options.passiveWheel;
  }
};
var tt = {
  screenWidth: typeof window > "u" ? 0 : window.innerWidth,
  screenHeight: typeof window > "u" ? 0 : window.innerHeight,
  worldWidth: null,
  worldHeight: null,
  threshold: 5,
  passiveWheel: true,
  stopPropagation: false,
  forceHitArea: null,
  noTicker: false,
  disableOnContextMenu: false,
  ticker: Ticker.shared,
  allowPreserveDragOutside: false
};
var it = class extends Container {
  /**
   * @param {IViewportOptions} ViewportOptions
   * @param {number} [options.screenWidth=window.innerWidth]
   * @param {number} [options.screenHeight=window.innerHeight]
   * @param {number} [options.worldWidth=this.width]
   * @param {number} [options.worldHeight=this.height]
   * @param {number} [options.threshold=5] number of pixels to move to trigger an input event (e.g., drag, pinch)
   * or disable a clicked event
   * @param {boolean} [options.passiveWheel=true] whether the 'wheel' event is set to passive (note: if false,
   * e.preventDefault() will be called when wheel is used over the viewport)
   * @param {boolean} [options.stopPropagation=false] whether to stopPropagation of events that impact the viewport
   * (except wheel events, see options.passiveWheel)
   * @param {HitArea} [options.forceHitArea] change the default hitArea from world size to a new value
   * @param {boolean} [options.noTicker] set this if you want to manually call update() function on each frame
   * @param {PIXI.Ticker} [options.ticker=PIXI.Ticker.shared] use this PIXI.ticker for updates
   * @param {PIXI.EventSystem} [options.events] EventSystem available from app.events or added manually and passed here
   * location on screen
   * @param {boolean} [options.disableOnContextMenu] remove oncontextmenu=() => {} from the pixi's events.domElement
   */
  constructor(t) {
    super(), this._disableOnContextMenu = (e) => e.preventDefault(), this.options = {
      ...tt,
      ...t
    }, this.screenWidth = this.options.screenWidth, this.screenHeight = this.options.screenHeight, this._worldWidth = this.options.worldWidth, this._worldHeight = this.options.worldHeight, this.forceHitArea = this.options.forceHitArea, this.threshold = this.options.threshold, this.options.disableOnContextMenu && this.options.events.domElement.addEventListener("contextmenu", this._disableOnContextMenu), this.options.noTicker || (this.tickerFunction = () => this.update(this.options.ticker.elapsedMS), this.options.ticker.add(this.tickerFunction)), this.input = new P(this), this.plugins = new C(this);
  }
  /** Overrides PIXI.Container's destroy to also remove the 'wheel' and PIXI.Ticker listeners */
  destroy(t) {
    var e;
    !this.options.noTicker && this.tickerFunction && this.options.ticker.remove(this.tickerFunction), this.options.disableOnContextMenu && ((e = this.options.events.domElement) == null || e.removeEventListener("contextmenu", this._disableOnContextMenu)), this.input.destroy(), super.destroy(t);
  }
  /**
   * Update viewport on each frame.
   *
   * By default, you do not need to call this unless you set `options.noTicker=true`.
   *
   * @param {number} elapsed time in milliseconds since last update
   */
  update(t) {
    this.pause || (this.plugins.update(t), this.lastViewport && (this.lastViewport.x !== this.x || this.lastViewport.y !== this.y ? this.moving = true : this.moving && (this.emit("moved-end", this), this.moving = false), this.lastViewport.scaleX !== this.scale.x || this.lastViewport.scaleY !== this.scale.y ? this.zooming = true : this.zooming && (this.emit("zoomed-end", this), this.zooming = false)), this.forceHitArea || (this._hitAreaDefault = new Rectangle(this.left, this.top, this.worldScreenWidth, this.worldScreenHeight), this.hitArea = this._hitAreaDefault), this._dirty = this._dirty || !this.lastViewport || this.lastViewport.x !== this.x || this.lastViewport.y !== this.y || this.lastViewport.scaleX !== this.scale.x || this.lastViewport.scaleY !== this.scale.y, this.lastViewport = {
      x: this.x,
      y: this.y,
      scaleX: this.scale.x,
      scaleY: this.scale.y
    }, this.emit("frame-end", this));
  }
  /**
   * Use this to set screen and world sizes, needed for pinch/wheel/clamp/bounce.
   * @param {number} screenWidth=window.innerWidth
   * @param {number} screenHeight=window.innerHeight
   * @param {number} [worldWidth]
   * @param {number} [worldHeight]
   */
  resize(t = typeof window > "u" ? 0 : window.innerWidth, e = typeof window > "u" ? 0 : window.innerHeight, n, i) {
    this.screenWidth = t, this.screenHeight = e, typeof n < "u" && (this._worldWidth = n), typeof i < "u" && (this._worldHeight = i), this.plugins.resize(), this.dirty = true;
  }
  /** World width, in pixels */
  get worldWidth() {
    return this._worldWidth ? this._worldWidth : this.width / this.scale.x;
  }
  set worldWidth(t) {
    this._worldWidth = t, this.plugins.resize();
  }
  /** World height, in pixels */
  get worldHeight() {
    return this._worldHeight ? this._worldHeight : this.height / this.scale.y;
  }
  set worldHeight(t) {
    this._worldHeight = t, this.plugins.resize();
  }
  /** Get visible world bounds of viewport */
  getVisibleBounds() {
    return new Rectangle(this.left, this.top, this.worldScreenWidth, this.worldScreenHeight);
  }
  /**
   * Changes coordinate from screen to world
   * @param {number|PIXI.Point} x
   * @param {number} y
   * @returns {PIXI.Point}
   */
  toWorld(t, e) {
    return arguments.length === 2 ? this.toLocal(new Point(t, e)) : this.toLocal(t);
  }
  /**
   * Changes coordinate from world to screen
   * @param {number|PIXI.Point} x
   * @param {number} y
   * @returns {PIXI.Point}
   */
  toScreen(t, e) {
    return arguments.length === 2 ? this.toGlobal(new Point(t, e)) : this.toGlobal(t);
  }
  /** Screen width in world coordinates */
  get worldScreenWidth() {
    return this.screenWidth / this.scale.x;
  }
  /** Screen height in world coordinates */
  get worldScreenHeight() {
    return this.screenHeight / this.scale.y;
  }
  /** World width in screen coordinates */
  get screenWorldWidth() {
    return this.worldWidth * this.scale.x;
  }
  /** World height in screen coordinates */
  get screenWorldHeight() {
    return this.worldHeight * this.scale.y;
  }
  /** Center of screen in world coordinates */
  get center() {
    return new Point(
      this.worldScreenWidth / 2 - this.x / this.scale.x,
      this.worldScreenHeight / 2 - this.y / this.scale.y
    );
  }
  set center(t) {
    this.moveCenter(t);
  }
  /**
   * Move center of viewport to (x, y)
   * @param {number|PIXI.Point} x
   * @param {number} [y]
   * @return {Viewport}
   */
  moveCenter(...t) {
    let e, n;
    typeof t[0] == "number" ? (e = t[0], n = t[1]) : (e = t[0].x, n = t[0].y);
    const i = (this.worldScreenWidth / 2 - e) * this.scale.x, s = (this.worldScreenHeight / 2 - n) * this.scale.y;
    return (this.x !== i || this.y !== s) && (this.position.set(i, s), this.plugins.reset(), this.dirty = true), this;
  }
  /** Top-left corner of Viewport */
  get corner() {
    return new Point(-this.x / this.scale.x, -this.y / this.scale.y);
  }
  set corner(t) {
    this.moveCorner(t);
  }
  /**
   * MoveCorner
   * @param {number|PIXI.Point} x
   * @param {number} [y]
   * @returns {Viewport}
   */
  moveCorner(...t) {
    let e, n;
    return t.length === 1 ? (e = -t[0].x * this.scale.x, n = -t[0].y * this.scale.y) : (e = -t[0] * this.scale.x, n = -t[1] * this.scale.y), (e !== this.x || n !== this.y) && (this.position.set(e, n), this.plugins.reset(), this.dirty = true), this;
  }
  /** Get how many world pixels fit in screen's width */
  get screenWidthInWorldPixels() {
    return this.screenWidth / this.scale.x;
  }
  /** Get how many world pixels fit on screen's height */
  get screenHeightInWorldPixels() {
    return this.screenHeight / this.scale.y;
  }
  /**
   * Find the scale value that fits a world width on the screen
   * does not change the viewport (use fit... to change)
   *
   * @param width - Width in world pixels
   * @return - scale
   */
  findFitWidth(t) {
    return this.screenWidth / t;
  }
  /**
   * Finds the scale value that fits a world height on the screens
   * does not change the viewport (use fit... to change)
   *
   * @param height - Height in world pixels
   * @return - scale
   */
  findFitHeight(t) {
    return this.screenHeight / t;
  }
  /**
   * Finds the scale value that fits the smaller of a world width and world height on the screen
   * does not change the viewport (use fit... to change)
   *
   * @param {number} width in world pixels
   * @param {number} height in world pixels
   * @returns {number} scale
   */
  findFit(t, e) {
    const n = this.screenWidth / t, i = this.screenHeight / e;
    return Math.min(n, i);
  }
  /**
   * Finds the scale value that fits the larger of a world width and world height on the screen
   * does not change the viewport (use fit... to change)
   *
   * @param {number} width in world pixels
   * @param {number} height in world pixels
   * @returns {number} scale
   */
  findCover(t, e) {
    const n = this.screenWidth / t, i = this.screenHeight / e;
    return Math.max(n, i);
  }
  /**
   * Change zoom so the width fits in the viewport
   *
   * @param width - width in world coordinates
   * @param center - maintain the same center
   * @param scaleY - whether to set scaleY=scaleX
   * @param noClamp - whether to disable clamp-zoom
   * @returns {Viewport} this
   */
  fitWidth(t = this.worldWidth, e, n = true, i) {
    let s;
    e && (s = this.center), this.scale.x = this.screenWidth / t, n && (this.scale.y = this.scale.x);
    const h = this.plugins.get("clamp-zoom", true);
    return !i && h && h.clamp(), e && s && this.moveCenter(s), this;
  }
  /**
   * Change zoom so the height fits in the viewport
   *
   * @param {number} [height=this.worldHeight] in world coordinates
   * @param {boolean} [center] maintain the same center of the screen after zoom
   * @param {boolean} [scaleX=true] whether to set scaleX = scaleY
   * @param {boolean} [noClamp] whether to disable clamp-zoom
   * @returns {Viewport} this
   */
  fitHeight(t = this.worldHeight, e, n = true, i) {
    let s;
    e && (s = this.center), this.scale.y = this.screenHeight / t, n && (this.scale.x = this.scale.y);
    const h = this.plugins.get("clamp-zoom", true);
    return !i && h && h.clamp(), e && s && this.moveCenter(s), this;
  }
  /**
   * Change zoom so it fits the entire world in the viewport
   *
   * @param {boolean} center maintain the same center of the screen after zoom
   * @returns {Viewport} this
   */
  fitWorld(t) {
    let e;
    t && (e = this.center), this.scale.x = this.screenWidth / this.worldWidth, this.scale.y = this.screenHeight / this.worldHeight, this.scale.x < this.scale.y ? this.scale.y = this.scale.x : this.scale.x = this.scale.y;
    const n = this.plugins.get("clamp-zoom", true);
    return n && n.clamp(), t && e && this.moveCenter(e), this;
  }
  /**
   * Change zoom so it fits the size or the entire world in the viewport
   *
   * @param {boolean} [center] maintain the same center of the screen after zoom
   * @param {number} [width=this.worldWidth] desired width
   * @param {number} [height=this.worldHeight] desired height
   * @returns {Viewport} this
   */
  fit(t, e = this.worldWidth, n = this.worldHeight) {
    let i;
    t && (i = this.center), this.scale.x = this.screenWidth / e, this.scale.y = this.screenHeight / n, this.scale.x < this.scale.y ? this.scale.y = this.scale.x : this.scale.x = this.scale.y;
    const s = this.plugins.get("clamp-zoom", true);
    return s && s.clamp(), t && i && this.moveCenter(i), this;
  }
  /**
   * Zoom viewport to specific value.
   *
   * @param {number} scale value (e.g., 1 would be 100%, 0.25 would be 25%)
   * @param {boolean} [center] maintain the same center of the screen after zoom
   * @return {Viewport} this
   */
  setZoom(t, e) {
    let n;
    e && (n = this.center), this.scale.set(t);
    const i = this.plugins.get("clamp-zoom", true);
    return i && i.clamp(), e && n && this.moveCenter(n), this;
  }
  /**
   * Zoom viewport by a certain percent (in both x and y direction).
   *
   * @param {number} percent change (e.g., 0.25 would increase a starting scale of 1.0 to 1.25)
   * @param {boolean} [center] maintain the same center of the screen after zoom
   * @return {Viewport} this
   */
  zoomPercent(t, e) {
    return this.setZoom(this.scale.x + this.scale.x * t, e);
  }
  /**
   * Zoom viewport by increasing/decreasing width by a certain number of pixels.
   *
   * @param {number} change in pixels
   * @param {boolean} [center] maintain the same center of the screen after zoom
   * @return {Viewport} this
   */
  zoom(t, e) {
    return this.fitWidth(t + this.worldScreenWidth, e), this;
  }
  /** Changes scale of viewport and maintains center of viewport */
  get scaled() {
    return this.scale.x;
  }
  set scaled(t) {
    this.setZoom(t, true);
  }
  /**
   * Returns zoom to the desired scale
   *
   * @param {ISnapZoomOptions} options
   * @param {number} [options.width=0] - the desired width to snap (to maintain aspect ratio, choose width or height)
   * @param {number} [options.height=0] - the desired height to snap (to maintain aspect ratio, choose width or height)
   * @param {number} [options.time=1000] - time for snapping in ms
   * @param {(string|function)} [options.ease=easeInOutSine] ease function or name (see http://easings.net/
   *   for supported names)
   * @param {PIXI.Point} [options.center] - place this point at center during zoom instead of center of the viewport
   * @param {boolean} [options.interrupt=true] - pause snapping with any user input on the viewport
   * @param {boolean} [options.removeOnComplete] - removes this plugin after snapping is complete
   * @param {boolean} [options.removeOnInterrupt] - removes this plugin if interrupted by any user input
   * @param {boolean} [options.forceStart] - starts the snap immediately regardless of whether the viewport is at the
   *   desired zoom
   * @param {boolean} [options.noMove] - zoom but do not move
   */
  snapZoom(t) {
    return this.plugins.add("snap-zoom", new G(this, t)), this;
  }
  /** Is container out of world bounds */
  OOB() {
    return {
      left: this.left < 0,
      right: this.right > this.worldWidth,
      top: this.top < 0,
      bottom: this.bottom > this.worldHeight,
      cornerPoint: new Point(
        this.worldWidth * this.scale.x - this.screenWidth,
        this.worldHeight * this.scale.y - this.screenHeight
      )
    };
  }
  /** World coordinates of the right edge of the screen */
  get right() {
    return -this.x / this.scale.x + this.worldScreenWidth;
  }
  set right(t) {
    this.x = -t * this.scale.x + this.screenWidth, this.plugins.reset();
  }
  /** World coordinates of the left edge of the screen */
  get left() {
    return -this.x / this.scale.x;
  }
  set left(t) {
    this.x = -t * this.scale.x, this.plugins.reset();
  }
  /** World coordinates of the top edge of the screen */
  get top() {
    return -this.y / this.scale.y;
  }
  set top(t) {
    this.y = -t * this.scale.y, this.plugins.reset();
  }
  /** World coordinates of the bottom edge of the screen */
  get bottom() {
    return -this.y / this.scale.y + this.worldScreenHeight;
  }
  set bottom(t) {
    this.y = -t * this.scale.y + this.screenHeight, this.plugins.reset();
  }
  /**
   * Determines whether the viewport is dirty (i.e., needs to be rendered to the screen because of a change)
   */
  get dirty() {
    return !!this._dirty;
  }
  set dirty(t) {
    this._dirty = t;
  }
  /**
   * Permanently changes the Viewport's hitArea
   *
   * NOTE: if not set then hitArea = PIXI.Rectangle(Viewport.left, Viewport.top, Viewport.worldScreenWidth,
   * Viewport.worldScreenHeight)
   */
  get forceHitArea() {
    return this._forceHitArea;
  }
  set forceHitArea(t) {
    t ? (this._forceHitArea = t, this.hitArea = t) : (this._forceHitArea = null, this.hitArea = new Rectangle(0, 0, this.worldWidth, this.worldHeight));
  }
  /**
   * Enable one-finger touch to drag
   *
   * NOTE: if you expect users to use right-click dragging, you should enable `viewport.options.disableOnContextMenu`
   * to avoid the context menu popping up on each right-click drag.
   *
   * @param {IDragOptions} [options]
   * @param {string} [options.direction=all] direction to drag
   * @param {boolean} [options.pressDrag=true] whether click to drag is active
   * @param {boolean} [options.wheel=true] use wheel to scroll in direction (unless wheel plugin is active)
   * @param {number} [options.wheelScroll=1] number of pixels to scroll with each wheel spin
   * @param {boolean} [options.reverse] reverse the direction of the wheel scroll
   * @param {(boolean|string)} [options.clampWheel=false] clamp wheel(to avoid weird bounce with mouse wheel)
   * @param {string} [options.underflow=center] where to place world if too small for screen
   * @param {number} [options.factor=1] factor to multiply drag to increase the speed of movement
   * @param {string} [options.mouseButtons=all] changes which mouse buttons trigger drag, use: 'all', 'left',
   *  'right' 'middle', or some combination, like, 'middle-right'; you may want to set
   *   viewport.options.disableOnContextMenu if you want to use right-click dragging
   * @param {string[]} [options.keyToPress=null] - array containing
   *  {@link key|https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code} codes of keys that can be
   *  pressed for the drag to be triggered, e.g.: ['ShiftLeft', 'ShiftRight'}.
   * @param {boolean} [options.ignoreKeyToPressOnTouch=false] - ignore keyToPress for touch events
   * @param {number} [options.lineHeight=20] - scaling factor for non-DOM_DELTA_PIXEL scrolling events
   * @returns {Viewport} this
   */
  drag(t) {
    return this.plugins.add("drag", new U(this, t)), this;
  }
  /**
   * Clamp to world boundaries or other provided boundaries
   * There are three ways to clamp:
   * 1. direction: 'all' = the world is clamped to its world boundaries, ie, you cannot drag any part of offscreen
   *    direction: 'x' | 'y' = only the x or y direction is clamped to its world boundary
   * 2. left, right, top, bottom = true | number = the world is clamped to the world's pixel location for each side;
   *    if any of these are set to true, then the location is set to the boundary
   *    [0, viewport.worldWidth/viewport.worldHeight], eg: to allow the world to be completely dragged offscreen,
   *    set [-viewport.worldWidth, -viewport.worldHeight, viewport.worldWidth * 2, viewport.worldHeight * 2]
   *
   * Underflow determines what happens when the world is smaller than the viewport
   * 1. none = the world is clamped but there is no special behavior
   * 2. center = the world is centered on the viewport
   * 3. combination of top/bottom/center and left/right/center (case insensitive) = the world is stuck to the
   *     appropriate boundaries
   *
   * NOTES:
   *   clamp is disabled if called with no options; use { direction: 'all' } for all edge clamping
   *   screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
   *
   * @param {object} [options]
   * @param {(number|boolean)} [options.left=false] - clamp left; true = 0
   * @param {(number|boolean)} [options.right=false] - clamp right; true = viewport.worldWidth
   * @param {(number|boolean)} [options.top=false] - clamp top; true = 0
   * @param {(number|boolean)} [options.bottom=false] - clamp bottom; true = viewport.worldHeight
   * @param {string} [direction] - (all, x, or y) using clamps of [0, viewport.worldWidth/viewport.worldHeight];
   *  replaces left/right/top/bottom if set
   * @param {string} [underflow=center] - where to place world if too small for screen (e.g., top-right, center,
   *  none, bottomLeft)     * @returns {Viewport} this
   */
  clamp(t) {
    return this.plugins.add("clamp", new A(this, t)), this;
  }
  /**
   * Decelerate after a move
   *
   * NOTE: this fires 'moved' event during deceleration
   *
   * @param {IDecelerateOptions} [options]
   * @param {number} [options.friction=0.95] - percent to decelerate after movement
   * @param {number} [options.bounce=0.8] - percent to decelerate when past boundaries (only applicable when
   *   viewport.bounce() is active)
   * @param {number} [options.minSpeed=0.01] - minimum velocity before stopping/reversing acceleration
   * @return {Viewport} this
   */
  decelerate(t) {
    return this.plugins.add("decelerate", new E(this, t)), this;
  }
  /**
   * Bounce on borders
   * NOTES:
   *    screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
   *    fires 'moved', 'bounce-x-start', 'bounce-y-start', 'bounce-x-end', and 'bounce-y-end' events
   * @param {object} [options]
   * @param {string} [options.sides=all] - all, horizontal, vertical, or combination of top, bottom, right, left
   *  (e.g., 'top-bottom-right')
   * @param {number} [options.friction=0.5] - friction to apply to decelerate if active
   * @param {number} [options.time=150] - time in ms to finish bounce
   * @param {object} [options.bounceBox] - use this bounceBox instead of (0, 0, viewport.worldWidth, viewport.worldHeight)
   * @param {number} [options.bounceBox.x=0]
   * @param {number} [options.bounceBox.y=0]
   * @param {number} [options.bounceBox.width=viewport.worldWidth]
   * @param {number} [options.bounceBox.height=viewport.worldHeight]
   * @param {string|function} [options.ease=easeInOutSine] - ease function or name
   *  (see http://easings.net/ for supported names)
   * @param {string} [options.underflow=center] - (top/bottom/center and left/right/center, or center)
   *  where to place world if too small for screen
   * @return {Viewport} this
   */
  bounce(t) {
    return this.plugins.add("bounce", new X(this, t)), this;
  }
  /**
   * Enable pinch to zoom and two-finger touch to drag
   *
   * @param {PinchOptions} [options]
   * @param {boolean} [options.noDrag] - disable two-finger dragging
   * @param {number} [options.percent=1] - percent to modify pinch speed
   * @param {number} [options.factor=1] - factor to multiply two-finger drag to increase the speed of movement
   * @param {PIXI.Point} [options.center] - place this point at center during zoom instead of center of two fingers
   * @param {('all'|'x'|'y')} [options.axis=all] - axis to zoom
   * @return {Viewport} this
   */
  pinch(t) {
    return this.plugins.add("pinch", new j(this, t)), this;
  }
  /**
   * Snap to a point
   *
   * @param {number} x
   * @param {number} y
   * @param {ISnapOptions} [options]
   * @param {boolean} [options.topLeft] - snap to the top-left of viewport instead of center
   * @param {number} [options.friction=0.8] - friction/frame to apply if decelerate is active
   * @param {number} [options.time=1000] - time in ms to snap
   * @param {string|function} [options.ease=easeInOutSine] - ease function or name (see http://easings.net/
   *   for supported names)
   * @param {boolean} [options.interrupt=true] - pause snapping with any user input on the viewport
   * @param {boolean} [options.removeOnComplete] - removes this plugin after snapping is complete
   * @param {boolean} [options.removeOnInterrupt] - removes this plugin if interrupted by any user input
   * @param {boolean} [options.forceStart] - starts the snap immediately regardless of whether the viewport is at
   *   the desired location
   * @return {Viewport} this
   */
  snap(t, e, n) {
    return this.plugins.add("snap", new q(this, t, e, n)), this;
  }
  /**
   * Follow a target
   *
   * NOTES:
   *    uses the (x, y) as the center to follow; for PIXI.Sprite to work properly, use sprite.anchor.set(0.5)
   *    options.acceleration is not perfect as it doesn't know the velocity of the target. It adds acceleration
   *    to the start of movement and deceleration to the end of movement when the target is stopped.
   *    To cancel the follow, use: `viewport.plugins.remove('follow')`
   *
   * @fires 'moved' event
   *
   * @param {PIXI.DisplayObject} target to follow
   * @param {IFollowOptions} [options]
   * @param {number} [options.speed=0] - to follow in pixels/frame (0=teleport to location)
   * @param {number} [options.acceleration] - set acceleration to accelerate and decelerate at this rate; speed
   *   cannot be 0 to use acceleration
   * @param {number} [options.radius] - radius (in world coordinates) of center circle where movement is allowed
   *   without moving the viewport     * @returns {Viewport} this
   * @returns {Viewport} this
   */
  follow(t, e) {
    return this.plugins.add("follow", new B(this, t, e)), this;
  }
  /**
   * Zoom using mouse wheel
   *
   * NOTE: the default event listener for 'wheel' event is the options.events.domElement.
   *
   * @param {IWheelOptions} [options]
   * @param {number} [options.percent=0.1] - percent to scroll with each spin
   * @param {number} [options.smooth] - smooth the zooming by providing the number of frames to zoom between wheel spins
   * @param {boolean} [options.interrupt=true] - stop smoothing with any user input on the viewport
   * @param {boolean} [options.reverse] - reverse the direction of the scroll
   * @param {PIXI.Point} [options.center] - place this point at center during zoom instead of current mouse position
   * @param {number} [options.lineHeight=20] - scaling factor for non-DOM_DELTA_PIXEL scrolling events
   * @param {('all'|'x'|'y')} [options.axis=all] - axis to zoom
   * @return {Viewport} this
   */
  wheel(t) {
    return this.plugins.add("wheel", new $(this, t)), this;
  }
  /**
   * Animate the position and/or scale of the viewport
   * To set the zoom level, use: (1) scale, (2) scaleX and scaleY, or (3) width and/or height
   * @param {object} options
   * @param {number} [options.time=1000] - time to animate
   * @param {PIXI.Point} [options.position=viewport.center] - position to move viewport
   * @param {number} [options.width] - desired viewport width in world pixels (use instead of scale;
   *  aspect ratio is maintained if height is not provided)
   * @param {number} [options.height] - desired viewport height in world pixels (use instead of scale;
   *  aspect ratio is maintained if width is not provided)
   * @param {number} [options.scale] - scale to change zoom (scale.x = scale.y)
   * @param {number} [options.scaleX] - independently change zoom in x-direction
   * @param {number} [options.scaleY] - independently change zoom in y-direction
   * @param {(function|string)} [options.ease=linear] - easing function to use
   * @param {function} [options.callbackOnComplete]
   * @param {boolean} [options.removeOnInterrupt] removes this plugin if interrupted by any user input
   * @returns {Viewport} this
   */
  animate(t) {
    return this.plugins.add("animate", new k(this, t)), this;
  }
  /**
   * Enable clamping of zoom to constraints
   *
   * The minWidth/Height settings are how small the world can get (as it would appear on the screen)
   * before clamping. The maxWidth/maxHeight is how larger the world can scale (as it would appear on
   * the screen) before clamping.
   *
   * For example, if you have a world size of 1000 x 1000 and a screen size of 100 x 100, if you set
   * minWidth/Height = 100 then the world will not be able to zoom smaller than the screen size (ie,
   * zooming out so it appears smaller than the screen). Similarly, if you set maxWidth/Height = 100
   * the world will not be able to zoom larger than the screen size (ie, zooming in so it appears
   * larger than the screen).
   *
   * @param {object} [options]
   * @param {number} [options.minWidth] - minimum width
   * @param {number} [options.minHeight] - minimum height
   * @param {number} [options.maxWidth] - maximum width
   * @param {number} [options.maxHeight] - maximum height
   * @param {number} [options.minScale] - minimum scale
   * @param {number} [options.maxScale] - minimum scale
   * @return {Viewport} this
   */
  clampZoom(t) {
    return this.plugins.add("clamp-zoom", new _(this, t)), this;
  }
  /**
   * Scroll viewport when mouse hovers near one of the edges or radius-distance from center of screen.
   *
   * NOTES: fires 'moved' event; there's a known bug where the mouseEdges does not work properly with "windowed" viewports
   *
   * @param {IMouseEdgesOptions} [options]
   * @param {number} [options.radius] - distance from center of screen in screen pixels
   * @param {number} [options.distance] - distance from all sides in screen pixels
   * @param {number} [options.top] - alternatively, set top distance (leave unset for no top scroll)
   * @param {number} [options.bottom] - alternatively, set bottom distance (leave unset for no top scroll)
   * @param {number} [options.left] - alternatively, set left distance (leave unset for no top scroll)
   * @param {number} [options.right] - alternatively, set right distance (leave unset for no top scroll)
   * @param {number} [options.speed=8] - speed in pixels/frame to scroll viewport
   * @param {boolean} [options.reverse] - reverse direction of scroll
   * @param {boolean} [options.noDecelerate] - don't use decelerate plugin even if it's installed
   * @param {boolean} [options.linear] - if using radius, use linear movement (+/- 1, +/- 1) instead of angled
   *   movement (Math.cos(angle from center), Math.sin(angle from center))
   * @param {boolean} [options.allowButtons] allows plugin to continue working even when there's a mousedown event
   */
  mouseEdges(t) {
    return this.plugins.add("mouse-edges", new V(this, t)), this;
  }
  /** Pause viewport (including animation updates such as decelerate) */
  get pause() {
    return !!this._pause;
  }
  set pause(t) {
    this._pause = t, this.lastViewport = null, this.moving = false, this.zooming = false, t && this.input.pause();
  }
  /**
   * Move the viewport so the bounding box is visible
   *
   * @param x - left
   * @param y - top
   * @param width
   * @param height
   * @param resizeToFit - Resize the viewport so the box fits within the viewport
   */
  ensureVisible(t, e, n, i, s) {
    s && (n > this.worldScreenWidth || i > this.worldScreenHeight) && (this.fit(true, n, i), this.emit("zoomed", { viewport: this, type: "ensureVisible" }));
    let h = false;
    t < this.left ? (this.left = t, h = true) : t + n > this.right && (this.right = t + n, h = true), e < this.top ? (this.top = e, h = true) : e + i > this.bottom && (this.bottom = e + i, h = true), h && this.emit("moved", { viewport: this, type: "ensureVisible" });
  }
};

// src/renderer/PixiViewportBinding.ts
var MODIFIER_KEYS = {
  control: ["ControlLeft", "ControlRight"],
  shift: ["ShiftLeft", "ShiftRight"],
  alt: ["AltLeft", "AltRight"],
  meta: ["MetaLeft", "MetaRight"],
  space: ["Space"]
};
var PixiViewportBinding = class {
  constructor(viewport) {
    this.viewport = viewport;
  }
  /**
   * Suppresses the `moved` / `zoomed` echo while this binding is the one
   * writing. Direct `position.set` / `scale.set` don't fire those events, but
   * {@link zoomToCentre} goes through `viewport.setZoom`, which does — and
   * `Camera` has already emitted for that change.
   */
  _writing = false;
  getTransform() {
    return {
      x: this.viewport.position.x,
      y: this.viewport.position.y,
      zoom: this.viewport.scale.x
    };
  }
  setTransform(t) {
    this._writing = true;
    try {
      if (this.viewport.scale.x !== t.zoom) this.viewport.scale.set(t.zoom);
      this.viewport.position.set(t.x, t.y);
    } finally {
      this._writing = false;
    }
  }
  zoomToCentre(zoom) {
    this._writing = true;
    try {
      this.viewport.setZoom(zoom, true);
    } finally {
      this._writing = false;
    }
  }
  resize(screenWidth, screenHeight) {
    this.viewport.resize(screenWidth, screenHeight);
  }
  toWorld(screenX, screenY) {
    const p = this.viewport.toWorld(screenX, screenY);
    return { x: p.x, y: p.y };
  }
  toScreen(worldX, worldY) {
    const p = this.viewport.toScreen(worldX, worldY);
    return { x: p.x, y: p.y };
  }
  getVisibleBounds() {
    const r = this.viewport.getVisibleBounds();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }
  configureInput(config) {
    if (config.drag !== void 0) {
      this.viewport.plugins.remove("drag");
      this.viewport.plugins.remove("decelerate");
      const d2 = config.drag;
      if (d2) {
        const modifier = d2.modifier ?? null;
        this.viewport.drag({
          mouseButtons: d2.mouseButtons ?? "left",
          keyToPress: modifier ? MODIFIER_KEYS[modifier] : void 0
        });
        if (d2.decelerate ?? true) this.viewport.decelerate();
      }
    }
    if (config.wheel !== void 0) {
      this.viewport.plugins.remove("wheel");
      const w = config.wheel;
      if (w) {
        const modifier = w.modifier ?? null;
        this.viewport.wheel({
          percent: w.percent ?? 0.1,
          smooth: w.smooth ?? false,
          keyToPress: modifier ? MODIFIER_KEYS[modifier] : void 0,
          trackpadPinch: w.trackpadPinch ?? true
        });
      }
    }
    if (config.pinch !== void 0) {
      this.viewport.plugins.remove("pinch");
      const p = config.pinch;
      if (p) {
        this.viewport.pinch({ noDrag: p.noDrag ?? false, percent: p.percent ?? 0.1 });
      }
    }
  }
  setDragSuspended(suspended) {
    if (suspended) this.viewport.plugins.pause("drag");
    else this.viewport.plugins.resume("drag");
  }
  onTransformChange(fn) {
    const onMoved = () => {
      if (!this._writing) fn("pan");
    };
    const onZoomed = () => {
      if (!this._writing) fn("zoom");
    };
    this.viewport.on("moved", onMoved);
    this.viewport.on("zoomed", onZoomed);
    return () => {
      this.viewport.off("moved", onMoved);
      this.viewport.off("zoomed", onZoomed);
    };
  }
  onDragStart(fn) {
    this.viewport.on("drag-start", fn);
    return () => this.viewport.off("drag-start", fn);
  }
  tick(dtMs) {
    this.viewport.update(dtMs);
  }
};
var liveCanvasCount = 0;
function acquireSharedTexturePool() {
  if (liveCanvasCount === 0) {
    GlobalResourceRegistry.unregister(TexturePool);
  }
  liveCanvasCount++;
}
function releaseSharedTexturePool() {
  if (liveCanvasCount === 0) return;
  liveCanvasCount--;
  if (liveCanvasCount === 0) {
    TexturePool.clear(true);
  }
}

// src/renderer/rendererSupport.ts
function hasWebGPUApi() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}
var webglProbe = null;
function hasWebGL() {
  if (webglProbe !== null) return webglProbe;
  if (typeof document === "undefined") return false;
  try {
    const el = document.createElement("canvas");
    const gl = el.getContext("webgl2") || el.getContext("webgl") || el.getContext("experimental-webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    webglProbe = !!gl;
  } catch {
    webglProbe = false;
  }
  return webglProbe;
}
function isWebKit() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/.test(ua)) return false;
  return /Safari/.test(ua) || /iPhone|iPad|iPod/.test(ua);
}
function canUseWebGPU() {
  return hasWebGPUApi() && !isWebKit();
}
function resolveRenderPreference(pref) {
  if (pref === "webgpu" && !canUseWebGPU()) return "webgl";
  return pref;
}
function bestRenderPreference() {
  if (canUseWebGPU()) return "webgpu";
  if (hasWebGL()) return "webgl";
  return "canvas";
}

// src/primitives/paint/dashedStroke.ts
function emitDashedStroke(g, points, opts) {
  const [dash, gap] = opts.dashArray;
  const period = dash + gap;
  if (points.length < 2 || dash <= 0 || period <= 0 || opts.width <= 0) return;
  const rawOffset = opts.dashOffset ?? 0;
  let phase = rawOffset % period;
  if (phase < 0) phase += period;
  let inDash = phase < dash;
  let remaining = inDash ? dash - phase : period - phase;
  let penX = points[0].x;
  let penY = points[0].y;
  let segIdx = 0;
  const segmentCount = opts.closed ? points.length : points.length - 1;
  while (segIdx < segmentCount) {
    points[segIdx];
    const b2 = points[(segIdx + 1) % points.length];
    const dx = b2.x - penX;
    const dy = b2.y - penY;
    const segLen = Math.hypot(dx, dy);
    if (segLen <= 0) {
      segIdx++;
      if (segIdx < segmentCount) {
        const next = points[segIdx];
        penX = next.x;
        penY = next.y;
      }
      continue;
    }
    if (remaining >= segLen) {
      if (inDash) {
        g.moveTo(penX, penY);
        g.lineTo(b2.x, b2.y);
      }
      remaining -= segLen;
      penX = b2.x;
      penY = b2.y;
      segIdx++;
    } else {
      const t = remaining / segLen;
      const cx = penX + dx * t;
      const cy = penY + dy * t;
      if (inDash) {
        g.moveTo(penX, penY);
        g.lineTo(cx, cy);
      }
      penX = cx;
      penY = cy;
      inDash = !inDash;
      remaining = inDash ? dash : gap;
    }
  }
  g.stroke({
    color: opts.color,
    alpha: opts.alpha ?? 1,
    width: opts.width,
    cap: opts.cap,
    join: opts.join
  });
}

// src/renderer/PixiOverlayDevice.ts
var PixiOverlayDevice = class {
  root;
  gfx;
  /** Points of the current sub-path, kept for dashed strokes (pixi has no dash). */
  current = [];
  closed = false;
  constructor(parent, label, zIndex = 9999) {
    this.root = new Container();
    this.root.label = label;
    this.root.zIndex = zIndex;
    this.gfx = new Graphics();
    this.gfx.label = `${label}:path`;
    this.root.addChild(this.gfx);
    parent.addChild(this.root);
    parent.sortableChildren = true;
  }
  clear() {
    this.gfx.clear();
    this.current = [];
    this.closed = false;
    return this;
  }
  moveTo(x2, y2) {
    this.gfx.moveTo(x2, y2);
    this.current = [{ x: x2, y: y2 }];
    this.closed = false;
    return this;
  }
  lineTo(x2, y2) {
    this.gfx.lineTo(x2, y2);
    this.current.push({ x: x2, y: y2 });
    return this;
  }
  quadraticCurveTo(cx, cy, x2, y2) {
    this.gfx.quadraticCurveTo(cx, cy, x2, y2);
    this.current.push({ x: x2, y: y2 });
    return this;
  }
  closePath() {
    this.gfx.closePath();
    this.closed = true;
    return this;
  }
  rect(x2, y2, width, height) {
    this.gfx.rect(x2, y2, width, height);
    this.current = [
      { x: x2, y: y2 },
      { x: x2 + width, y: y2 },
      { x: x2 + width, y: y2 + height },
      { x: x2, y: y2 + height }
    ];
    this.closed = true;
    return this;
  }
  roundRect(x2, y2, width, height, radius) {
    this.gfx.roundRect(x2, y2, width, height, radius);
    this.current = [
      { x: x2, y: y2 },
      { x: x2 + width, y: y2 },
      { x: x2 + width, y: y2 + height },
      { x: x2, y: y2 + height }
    ];
    this.closed = true;
    return this;
  }
  ellipse(cx, cy, radiusX, radiusY) {
    this.gfx.ellipse(cx, cy, radiusX, radiusY);
    this.current = [];
    this.closed = true;
    return this;
  }
  poly(points, close = true) {
    const pts = toPoints(points);
    if (pts.length === 0) return this;
    this.gfx.poly(pts.flatMap((p) => [p.x, p.y]), close);
    this.current = pts;
    this.closed = close;
    return this;
  }
  fill(style) {
    if (typeof style === "number" || typeof style === "string") {
      this.gfx.fill(style);
      return this;
    }
    this.gfx.fill({ color: style.color, alpha: style.alpha ?? 1 });
    return this;
  }
  stroke(style) {
    if (style.dashArray && style.dashArray[0] > 0 && style.dashArray[1] > 0) {
      if (this.current.length > 1) {
        emitDashedStroke(this.gfx, this.current, {
          color: style.color,
          alpha: style.alpha ?? 1,
          width: style.width,
          dashArray: style.dashArray,
          closed: this.closed
        });
      }
      return this;
    }
    this.gfx.stroke({ color: style.color, width: style.width, alpha: style.alpha ?? 1 });
    return this;
  }
  setVisible(visible) {
    this.root.visible = visible;
    return this;
  }
  setZIndex(z2) {
    this.root.zIndex = z2;
    return this;
  }
  setPosition(x2, y2) {
    this.root.position.set(x2, y2);
    return this;
  }
  destroy() {
    this.root.destroy({ children: true });
  }
};
function toPoints(points) {
  if (points.length === 0) return [];
  if (typeof points[0] === "number") {
    const flat = points;
    const out = [];
    for (let i = 0; i + 1 < flat.length; i += 2) out.push({ x: flat[i], y: flat[i + 1] });
    return out;
  }
  return [...points];
}

// src/renderer/mounted/ConnectorInstance.ts
var ConnectorInstance = class {
  constructor(id, spec, connector) {
    this.id = id;
    this.spec = spec;
    this.connector = connector;
  }
  decorations = /* @__PURE__ */ new Map();
  /**
   * Active effects keyed by slot. Effects modulate the host connector's
   * style each frame; the renderer aggregates contributions from every
   * entry and writes the result onto `connector.gfx`.
   */
  effects = /* @__PURE__ */ new Map();
  /** Last router-resolved path. Reused by decoration update + hit-testing. */
  path = [];
  /**
   * Memoised densified polyline of {@link path} — the form hit-testing needs
   * (`samplePath` is otherwise re-run per candidate on every `pointermove`, the
   * hover cost on a dense graph). `null` = stale; the renderer recomputes it
   * lazily and clears it whenever {@link path} is re-routed.
   */
  sampledPolyline = null;
  /**
   * Render-time multiplier applied to `spec.stroke.width` at draw time.
   * Defaults to `1` (no extra scale). Written by `EdgeScaleLODBehaviour`
   * to `1 / cameraScale` so spec stroke widths render as pixel-constant
   * regardless of camera zoom — symmetric with `ShapeInstance.gfxScale`.
   *
   * The multiplier lives outside `spec` so `setConnectorStroke` /
   * `updateConnector` callers (and the state-config-driven full-spec
   * replacement in `GraphLayer.rerenderEdge`) can rewrite `spec.stroke`
   * without clobbering the LOD intent. The renderer's draw helper reads
   * this field on every draw and applies the multiplication on a
   * shallow-cloned spec, so the canonical `inst.spec` always carries the
   * caller-authored width.
   */
  strokeWidthScale = 1;
  /**
   * The text-LOD channel for this connector's `'label'` decoration — what
   * `setConnectorTextVisible` last asked for.
   */
  textWanted = true;
  /**
   * The label-collision channel — what `setDecorationVisible(id, 'label', …)`
   * last asked for. The label is drawn only when both channels allow it; both
   * survive a label remount. Mirrors `ShapeInstance`.
   */
  labelWanted = true;
};

// src/renderer/mounted/ShapeInstance.ts
var ShapeInstance = class {
  constructor(id, spec, shape) {
    this.id = id;
    this.spec = spec;
    this.shape = shape;
  }
  decorations = /* @__PURE__ */ new Map();
  /**
   * Active effects keyed by slot. Effects modulate the host's transform
   * and/or style each frame; the renderer aggregates contributions from
   * every entry and writes the result onto `shape.gfx`.
   */
  effects = /* @__PURE__ */ new Map();
  /**
   * Uniform gfx-transform scale most recently written by
   * `PrimitivesRenderer.scaleShape`. Defaults to `1` (no extra scale).
   *
   * The spec's geometry (`radius` / `width` / `height`) describes the
   * shape in unscaled local units; `gfxScale` is the *visual* multiplier
   * the renderer applies on top, used by behaviours like
   * `NodeScaleLODBehaviour` to keep shapes pixel-constant across camera
   * zoom without rebuilding geometry every frame.
   *
   * Anchor / obstacle / endpoint-centre computations multiply the local
   * bounds by this factor so connectors stay glued to the *visible*
   * silhouette — without it, edges anchor to the pre-scaled bounds and
   * visibly fall short of the smaller shape.
   */
  gfxScale = 1;
  /**
   * Display-only override (`PrimitivesRenderer.setShapeDisplayOverride`), or
   * `null`. Layered on top of `spec.x/y` and {@link gfxScale}; neither of those
   * writers touches it.
   */
  displayOverride = null;
  /**
   * Offset of the **drawn** gfx origin from `(spec.x, spec.y)` — the override's
   * `dx/dy` plus the shift that keeps an override scale centred on the shape.
   * `0` without an override. Cached by `PrimitivesRenderer.applyDisplayTransform`
   * so geometry answers (anchors, picking) don't recompute it per query.
   */
  drawnDx = 0;
  /** See {@link drawnDx}. */
  drawnDy = 0;
  /**
   * The text-LOD channel: what `setShapeTextVisible` last asked for. Governs the
   * `'label'` decoration **and** the shape's internal text.
   */
  textWanted = true;
  /**
   * The label-collision channel: what `setDecorationVisible(id, 'label', …)`
   * last asked for. Governs the `'label'` decoration only.
   *
   * The two channels are separate so neither writer overwrites the other: the
   * label is drawn only when both allow it ({@link textWanted} ∧ this), and a
   * display override's `showText` forces it on. Both survive a label remount.
   */
  labelWanted = true;
  /**
   * `true` for a badge plate (`PrimitivesRenderer.setBadge`). A badge's text is
   * part of the badge, so a label-size policy never rescales it.
   */
  isBadge = false;
  /** Visual scale actually drawn: {@link gfxScale} × the override's `scale`. */
  get drawnScale() {
    return this.gfxScale * (this.displayOverride?.scale ?? 1);
  }
};
var TextureRegistry = class {
  /** Textures we loaded — we own the lifecycle. */
  owned = /* @__PURE__ */ new Map();
  /** Textures registered externally — caller owns the lifecycle. */
  external = /* @__PURE__ */ new Map();
  /** Look up a cached texture by URL or atlas frame name. */
  get(url) {
    return this.owned.get(url) ?? this.external.get(url);
  }
  has(url) {
    return this.owned.has(url) || this.external.has(url);
  }
  /**
   * Register a pre-built texture. Useful for programmatically generated or
   * SVG-constructed textures. The caller retains ownership — `destroy()` will
   * not unload this texture.
   */
  register(url, texture) {
    this.external.set(url, texture);
  }
  /**
   * Load a single URL and cache it. Returns the cached texture on subsequent
   * calls (synchronous fast path). Uses pixi's `Assets` pipeline so the
   * result integrates with the global asset manager.
   *
   * For URLs without a recognised image extension (e.g. picsum.photos,
   * signed CDN URLs, API endpoints) the `loadTextures` parser is explicitly
   * requested so PixiJS doesn't skip loading due to an unknown file type.
   */
  async load(url) {
    const existing = this.owned.get(url) ?? this.external.get(url);
    if (existing) return existing;
    if (!hasImageExtension(url)) {
      Assets.add({ alias: url, src: url, loadParser: "loadTextures" });
    }
    const texture = await Assets.load(url);
    this.owned.set(url, texture);
    return texture;
  }
  /** Batch-preload a list of URLs in parallel. Await before first render to avoid mid-frame async loads. */
  async preload(urls) {
    await Promise.all(urls.map((url) => this.load(url)));
  }
  /**
   * Load a PixiJS spritesheet atlas JSON. After this resolves, individual
   * frame textures are accessible via `get(frameName)` where `frameName`
   * matches the keys declared in the atlas JSON.
   *
   * All 1k-icon atlases packed into a single PNG → one GPU upload, one
   * draw call for every sprite sharing that atlas page.
   */
  async loadAtlas(jsonUrl) {
    const result = await Assets.load(jsonUrl);
    if (result && typeof result === "object" && "textures" in result) {
      for (const [name, tex] of Object.entries(result.textures)) {
        this.owned.set(name, tex);
      }
    }
  }
  /**
   * Unload and destroy all textures owned by this registry. External textures
   * (registered via `register`) are not touched. Call when the host Layer
   * unmounts.
   */
  destroy() {
    for (const url of this.owned.keys()) {
      Assets.unload(url).catch(() => {
      });
    }
    this.owned.clear();
    this.external.clear();
  }
};
var IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?|$)/i;
function hasImageExtension(url) {
  return IMAGE_EXT_RE.test(url);
}
var PrimitiveBase = class {
  gfx;
  constructor() {
    this.gfx = new Container();
  }
  destroy() {
    this.gfx.destroy({ children: true });
  }
};
function isInsetLayer(layer) {
  return layer.kind === "glyph" || layer.kind === "svg" || layer.kind === "svg-url";
}
function mountInsetContent(parent, layer, bounds, visualCenter) {
  const gfx = new Container();
  gfx.label = `inset:${layer.kind}`;
  gfx.zIndex = 10;
  const reposition = () => positionAndScale(gfx, view.child, layer, bounds, visualCenter);
  const child = renderChild(layer, reposition);
  gfx.addChild(child);
  parent.addChild(gfx);
  const view = { gfx, child, key: layerKey(layer) };
  positionAndScale(gfx, child, layer, bounds, visualCenter);
  return view;
}
function updateInsetContent(view, layer, bounds, visualCenter) {
  const key = layerKey(layer);
  if (key !== view.key) {
    view.child.destroy();
    const reposition = () => positionAndScale(view.gfx, view.child, layer, bounds, visualCenter);
    const fresh = renderChild(layer, reposition);
    view.gfx.removeChildren();
    view.gfx.addChild(fresh);
    view.child = fresh;
    view.key = key;
  }
  positionAndScale(view.gfx, view.child, layer, bounds, visualCenter);
}
function destroyInsetContent(view) {
  view.gfx.destroy({ children: true });
}
function renderChild(layer, onAsyncReady) {
  const color = layer.color ?? 16777215;
  const alpha = layer.alpha ?? 1;
  if (layer.kind === "glyph") {
    const style = {
      fontFamily: layer.fontFamily ?? "sans-serif",
      fontSize: 100,
      // baseline; positionAndScale rescales
      fill: color,
      align: "center"
    };
    if (layer.fontWeight !== void 0) style.fontWeight = layer.fontWeight;
    if (layer.fontStyle !== void 0) style.fontStyle = layer.fontStyle;
    const t = new Text({ text: layer.char, style });
    t.label = "glyph";
    t.alpha = alpha;
    return t;
  }
  if (layer.kind === "svg") {
    const g2 = new Graphics();
    g2.label = "svg";
    g2.path(new GraphicsPath(layer.pathD));
    g2.stroke({
      color,
      alpha,
      width: layer.strokeWidth ?? 2
    });
    return g2;
  }
  const g = new Graphics();
  g.label = "svg-url";
  void fetchSvgPathD(layer.url).then((pathD) => {
    if (g.destroyed) return;
    g.path(new GraphicsPath(pathD));
    g.stroke({
      color,
      alpha,
      width: layer.strokeWidth ?? 2
    });
    onAsyncReady();
  }).catch((err) => {
    if (g.destroyed) return;
    console.warn(`[insetContentLayer] svg-url fetch failed for ${layer.url}:`, err);
  });
  return g;
}
function positionAndScale(host, child, layer, bounds, visualCenter) {
  if (layer.kind === "svg-url") {
    const lb = child.getLocalBounds();
    if (lb.width === 0 && lb.height === 0) return;
  }
  const local = child.getLocalBounds();
  const scale = resolveScale(layer, bounds, local);
  child.scale.set(scale);
  const anchor = layer.anchor ?? "center";
  const [ax, ay] = anchorPoint(anchor, bounds, visualCenter);
  host.position.set(ax, ay);
  child.position.set(
    -(local.x + local.width / 2) * scale,
    -(local.y + local.height / 2) * scale
  );
  host.alpha = layer.alpha ?? 1;
}
function resolveScale(layer, bounds, local) {
  const ratio = layer.sizeRatio ?? 0.6;
  const targetSize = Math.min(bounds.width, bounds.height) * ratio;
  const naturalSize = Math.max(local.width, local.height) || 1;
  return targetSize / naturalSize;
}
function anchorPoint(anchor, b2, visualCenter) {
  const inset = Math.min(b2.width, b2.height) * 0.15;
  switch (anchor) {
    case "top-left":
      return [b2.x + inset, b2.y + inset];
    case "top-right":
      return [b2.x + b2.width - inset, b2.y + inset];
    case "bottom-left":
      return [b2.x + inset, b2.y + b2.height - inset];
    case "bottom-right":
      return [b2.x + b2.width - inset, b2.y + b2.height - inset];
    case "center":
    default:
      return visualCenter ? [visualCenter.x, visualCenter.y] : [b2.x + b2.width / 2, b2.y + b2.height / 2];
  }
}
function layerKey(layer) {
  if (layer.kind === "glyph") {
    return `g:${layer.char}:${layer.fontFamily ?? ""}:${layer.fontWeight ?? ""}:${layer.fontStyle ?? ""}:${layer.color ?? 16777215}:${layer.alpha ?? 1}`;
  }
  if (layer.kind === "svg") {
    return `s:${layer.pathD.length}:${hashString(layer.pathD)}:${layer.strokeWidth ?? 2}:${layer.color ?? 16777215}:${layer.alpha ?? 1}`;
  }
  return `u:${layer.url}:${layer.strokeWidth ?? 2}:${layer.color ?? 16777215}:${layer.alpha ?? 1}`;
}
function hashString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h << 5) + h + s.charCodeAt(i) | 0;
  return h;
}
var svgCache = /* @__PURE__ */ new Map();
function fetchSvgPathD(url) {
  let pending = svgCache.get(url);
  if (!pending) {
    pending = (async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`svg-url HTTP ${res.status}: ${url}`);
      }
      const text = await res.text();
      return svgMarkupToPathD(text);
    })();
    svgCache.set(url, pending);
  }
  return pending;
}
function svgMarkupToPathD(svg) {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const num = (el, attr) => Number(el.getAttribute(attr) ?? 0);
  const pointsToPath = (pts, close) => {
    const c2 = pts.trim().split(/[\s,]+/).map(Number);
    if (c2.length < 4) return "";
    let d2 = `M${c2[0]},${c2[1]}`;
    for (let i = 2; i < c2.length; i += 2) d2 += ` L${c2[i]},${c2[i + 1]}`;
    return close ? `${d2} Z` : d2;
  };
  const ds = [];
  for (const el of doc.querySelectorAll(
    "path, ellipse, circle, rect, line, polyline, polygon"
  )) {
    switch (el.tagName.toLowerCase()) {
      case "path": {
        const d2 = el.getAttribute("d");
        if (d2) ds.push(d2);
        break;
      }
      case "ellipse": {
        const cx = num(el, "cx"), cy = num(el, "cy");
        const rx = num(el, "rx"), ry = num(el, "ry");
        ds.push(`M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0 Z`);
        break;
      }
      case "circle": {
        const cx = num(el, "cx"), cy = num(el, "cy"), r = num(el, "r");
        ds.push(`M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`);
        break;
      }
      case "rect": {
        const x2 = num(el, "x"), y2 = num(el, "y");
        const w = num(el, "width"), h = num(el, "height");
        ds.push(`M${x2},${y2} h${w} v${h} h${-w} Z`);
        break;
      }
      case "line": {
        ds.push(`M${num(el, "x1")},${num(el, "y1")} L${num(el, "x2")},${num(el, "y2")}`);
        break;
      }
      case "polyline": {
        const d2 = pointsToPath(el.getAttribute("points") ?? "", false);
        if (d2) ds.push(d2);
        break;
      }
      case "polygon": {
        const d2 = pointsToPath(el.getAttribute("points") ?? "", true);
        if (d2) ds.push(d2);
        break;
      }
    }
  }
  return ds.join(" ");
}

// src/primitives/base/ShapeBase.ts
var ShapeBase = class extends PrimitiveBase {
  constructor(host) {
    super();
    this.host = host;
    this.gfx.sortableChildren = true;
    this.bodyGfx = new Graphics();
    this.bodyGfx.label = "body";
    this.bodyGfx.zIndex = 0;
    this.gfx.addChild(this.bodyGfx);
    this.gfx.eventMode = "static";
    this.gfx.cursor = "pointer";
    this.gfx.hitArea = this.getHitArea();
  }
  bodyGfx;
  insetViews = /* @__PURE__ */ new Map();
  spec;
  /**
   * When true, inset-content (`glyph` / `svg` / `svg-url` icon) views are
   * hidden. Persists across {@link draw} so a zoom-visibility toggle survives
   * later repaints. Driven by {@link setInsetContentVisible}.
   */
  iconHidden = false;
  /**
   * When true, `image` silhouette-fill layers are skipped when painting the
   * body. Persists across {@link draw}. Driven by {@link setImageFillVisible}.
   */
  imageHidden = false;
  /**
   * Hit-test region for this shape, derived from {@link drawGeometry}.
   *
   * **No longer the picking path for built-in kinds** — `hitTest`'s narrow
   * phase answers from the spec (`containsSpec` in `specs/shapeGeometry/`), so
   * picking needs no display object and both backends agree. This stays as the
   * pixi `gfx.hitArea` wiring, and as the fallback for `registerShape` kinds
   * the spec geometry has never heard of.
   *
   * Default behaviour: the returned `IHitArea`'s `contains(x, y)` delegates
   * to `bodyGfx.containsPoint({ x, y })`. Because `drawGeometry` is the
   * single function that paints the silhouette into `bodyGfx` (see
   * {@link draw}), the hit region tracks the rendered silhouette exactly —
   * including any stroke (Pixi's `containsPoint` uses `strokeContains` for
   * stroke instructions, with a half-stroke-width tolerance).
   *
   * The returned object is stable across `draw()` calls: the closure reads
   * `bodyGfx` by reference, so subsequent `drawGeometry` repaints
   * automatically update the hit region. No re-wiring of `gfx.hitArea`.
   *
   * Subclasses with cheap analytical hit tests — `CircleShape`
   * (`x² + y² ≤ r²`), `RectShape` (AABB) — may override to skip Pixi's
   * path-walk on hot paths. Keep the contract: input is shape-local
   * coordinates; `true` iff the point is inside the silhouette.
   */
  getHitArea() {
    return {
      contains: (x2, y2) => this.bodyGfx.containsPoint({ x: x2, y: y2 })
    };
  }
  /**
   * Update the spec used by {@link paintInto} / {@link bounds} / {@link contains}
   * **without** drawing this shape's own `gfx`. For *container* shapes (e.g.
   * {@link CompositeShape}) that compose another shape purely as a silhouette
   * provider — they trace the borrowed shape into their *own* graphics via
   * `paintInto`, so the borrowed instance's `gfx` must stay untouched. Regular
   * rendering goes through {@link draw}, not this.
   */
  setGeometrySpec(spec) {
    this.spec = spec;
  }
  draw(spec) {
    this.spec = spec;
    this.gfx.position.set(spec.x, spec.y);
    this.gfx.rotation = spec.rotation ?? 0;
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    this.gfx.zIndex = spec.zIndex ?? 0;
    this.bodyGfx.clear();
    this.drawGeometry(this.bodyGfx, this.bodyPaintSpec(spec));
    this.syncInsetLayers(spec);
  }
  paintInto(g, style) {
    this.drawGeometry(g, this.spec, style);
  }
  /**
   * Toggle inset-content (`glyph` / `svg` / `svg-url` icon) visibility. A pure
   * `.visible` flip on the inset containers — no repaint. The flag persists, so
   * a later {@link draw} keeps icons hidden until re-shown. Zoom-visibility LOD
   * uses this to drop icons at low zoom without touching the body.
   */
  setInsetContentVisible(visible) {
    this.iconHidden = !visible;
    for (const view of this.insetViews.values()) view.gfx.visible = visible;
  }
  /**
   * Toggle the silhouette `image` fill. Unlike icons, an image is painted
   * *into* the body, so hiding it repaints the body with `image` layers
   * stripped (solid fills / borders / other layers untouched). The flag
   * persists across {@link draw}. No-op when the state is unchanged.
   */
  setImageFillVisible(visible) {
    if (this.imageHidden === !visible) return;
    this.imageHidden = !visible;
    if (this.spec !== void 0) {
      this.bodyGfx.clear();
      this.drawGeometry(this.bodyGfx, this.bodyPaintSpec(this.spec));
    }
  }
  /** Spec used to paint the body — strips `image` fill layers while hidden. */
  bodyPaintSpec(spec) {
    if (!this.imageHidden) return spec;
    return { ...spec, fill: fillWithoutImages(spec.fill) };
  }
  /**
   * Default boundary intersection: ray from the shape's geometric centre
   * `(0, 0)` toward `localFromCenter`, intersected with a centred AABB
   * derived from `this.bounds()`. Correct for `RectShape` (anchored
   * top-left) and any shape whose silhouette can be approximated by its
   * bounding box.
   *
   * Geometric shapes with non-rectangular silhouettes (`CircleShape`,
   * `EllipseShape`, `PolygonShape`) should override this for pixel-accurate
   * perimeter snapping. Input and output are both centre-relative.
   */
  boundaryIntersect(localFromCenter) {
    const b2 = this.bounds();
    const centred = {
      x: -b2.width / 2,
      y: -b2.height / 2,
      width: b2.width,
      height: b2.height
    };
    return aabbRayExit(localFromCenter, centred);
  }
  destroy() {
    for (const view of this.insetViews.values()) destroyInsetContent(view);
    this.insetViews.clear();
    super.destroy();
  }
  /**
   * Visual centre — the point inset content with `anchor: 'center'` snaps
   * to. Default is the AABB midpoint of `bounds()`, which is correct for
   * `CircleShape` (bounds is centred on origin) and `RectShape` (bounds is
   * the rect itself). Shapes whose silhouette doesn't fill its AABB —
   * triangle, hexagon, star, free-form polygon — override to return the
   * geometric centroid so a glyph drawn on a triangle sits on the visual
   * centroid instead of floating above it.
   */
  visualCenter() {
    const b2 = this.bounds();
    return { x: b2.x + b2.width / 2, y: b2.y + b2.height / 2 };
  }
  /**
   * Diff the spec's inset-content fill layers (`glyph` / `svg` / `svg-url`)
   * against the current `insetViews` map, keyed by layer index. Mounts new
   * layers, updates existing ones, destroys removed ones.
   */
  syncInsetLayers(spec) {
    const layers = insetLayersByIndex(spec.fill);
    const bounds = this.bounds();
    const centre = this.visualCenter();
    for (const [index, layer] of layers) {
      const existing = this.insetViews.get(index);
      if (existing) {
        updateInsetContent(existing, layer, bounds, centre);
      } else {
        const view = mountInsetContent(this.gfx, layer, bounds, centre);
        this.insetViews.set(index, view);
      }
    }
    for (const [index, view] of this.insetViews) {
      if (!layers.has(index)) {
        destroyInsetContent(view);
        this.insetViews.delete(index);
      }
    }
    if (this.iconHidden) {
      for (const view of this.insetViews.values()) view.gfx.visible = false;
    }
  }
};
function fillWithoutImages(fill) {
  if (fill === void 0 || typeof fill === "number") return fill;
  const arr = Array.isArray(fill) ? fill : [fill];
  const kept = arr.filter((l) => l.kind !== "image");
  if (kept.length === arr.length) return fill;
  return kept.length === 0 ? void 0 : kept.length === 1 ? kept[0] : kept;
}
function aabbRayExit(localFrom, bounds) {
  const x2 = localFrom.x;
  const y2 = localFrom.y;
  if (x2 === 0 && y2 === 0) return { x: bounds.x, y: bounds.y };
  let tMin = Infinity;
  if (x2 !== 0) {
    const tx = (x2 > 0 ? bounds.x + bounds.width : bounds.x) / x2;
    if (tx > 0 && tx < tMin) tMin = tx;
  }
  if (y2 !== 0) {
    const ty = (y2 > 0 ? bounds.y + bounds.height : bounds.y) / y2;
    if (ty > 0 && ty < tMin) tMin = ty;
  }
  if (!isFinite(tMin)) return { x: 0, y: 0 };
  return { x: x2 * tMin, y: y2 * tMin };
}
function insetLayersByIndex(fill) {
  const out = /* @__PURE__ */ new Map();
  if (fill === void 0 || typeof fill === "number") return out;
  const arr = Array.isArray(fill) ? fill : [fill];
  for (let i = 0; i < arr.length; i++) {
    const layer = arr[i];
    if (isInsetLayer(layer)) out.set(i, layer);
  }
  return out;
}
function applyFill(g, spec, style, host, bounds, retrace) {
  if (style) {
    if (style.fill === false) return;
    if (style.color === void 0) return;
    g.fill({ color: style.color, alpha: style.alpha ?? 1 });
    return;
  }
  if (spec.fill === void 0) return;
  const layers = silhouetteLayersOf(spec.fill);
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const inset = layerInset(layer);
    if (i > 0 || inset > 0) retrace(inset);
    paintSilhouetteLayer(g, layer, host, insetBounds(bounds, inset));
  }
}
function applyStroke(g, spec, style, retrace) {
  if (style?.strokeWidth !== void 0) {
    retrace?.();
    g.stroke({
      color: style.color ?? 0,
      alpha: style.alpha ?? 1,
      width: style.strokeWidth,
      alignment: alignmentFor(style.alignment ?? "outside")
    });
    return;
  }
  const s = spec.stroke;
  if (!s) return;
  const width = s.width ?? 1;
  if (width <= 0) return;
  retrace?.();
  g.stroke({
    color: s.color,
    alpha: s.alpha ?? 1,
    width,
    alignment: alignmentFor(s.alignment),
    cap: s.cap,
    join: s.join
  });
}
function applyMarkerFill(g, fill, style) {
  if (style?.fill !== false && style?.color !== void 0) {
    g.fill({ color: style.color, alpha: style.alpha ?? 1 });
    return;
  }
  if (fill === void 0) return;
  if (typeof fill === "number") {
    g.fill({ color: fill });
    return;
  }
  for (const layer of toLayerArray(fill)) {
    if (layer.kind === "solid") {
      g.fill({ color: layer.color, alpha: layer.alpha ?? 1 });
      return;
    }
  }
}
function silhouetteLayersOf(fill) {
  if (typeof fill === "number") return [{ kind: "shorthand", color: fill }];
  return toLayerArray(fill).filter(isSilhouetteLayer);
}
function toLayerArray(fill) {
  return Array.isArray(fill) ? fill : [fill];
}
function isSilhouetteLayer(layer) {
  return layer.kind === "solid" || layer.kind === "image";
}
function paintSilhouetteLayer(g, layer, host, bounds) {
  if (layer.kind === "shorthand") {
    g.fill({ color: layer.color });
    return;
  }
  if (layer.kind === "solid") {
    g.fill({ color: layer.color, alpha: layer.alpha ?? 1 });
    return;
  }
  const tex = host.textureRegistry.get(layer.url);
  if (!tex) {
    void host.textureRegistry.load(layer.url).then(() => host.requestRedraw()).catch((err) => {
      console.warn(`[applyFill] image load failed for ${layer.url}:`, err);
    });
    return;
  }
  const style = tex.source.style;
  if (style.addressModeU !== "clamp-to-edge" || style.addressModeV !== "clamp-to-edge") {
    style.addressMode = "clamp-to-edge";
    style.update();
  }
  const matrix = textureFitMatrix(layer.fit ?? "cover", tex, bounds);
  g.fill({ texture: tex, alpha: layer.alpha ?? 1, matrix, textureSpace: "global" });
}
function textureFitMatrix(fit, tex, bounds) {
  const tw = tex.width || 1;
  const th = tex.height || 1;
  const sx = bounds.width / tw;
  const sy = bounds.height / th;
  const s = fit === "cover" ? Math.max(sx, sy) : Math.min(sx, sy);
  const mappedW = tw * s;
  const mappedH = th * s;
  const tx = bounds.x + (bounds.width - mappedW) / 2;
  const ty = bounds.y + (bounds.height - mappedH) / 2;
  return new Matrix().set(s, 0, 0, s, tx, ty);
}
function layerInset(layer) {
  return layer.kind === "image" ? layer.padding ?? 0 : 0;
}
function insetBounds(bounds, inset) {
  if (inset <= 0) return bounds;
  return {
    x: bounds.x + inset,
    y: bounds.y + inset,
    width: Math.max(0, bounds.width - inset * 2),
    height: Math.max(0, bounds.height - inset * 2)
  };
}
function alignmentFor(a) {
  return a === "inside" ? 1 : a === "outside" ? 0 : 0.5;
}
function finishMarkerPaint(g, fill, style) {
  if (style?.fill === false) {
    if (style.color !== void 0 && (style.strokeWidth ?? 0) > 0) {
      g.stroke({ width: style.strokeWidth, color: style.color, alpha: style.alpha ?? 1 });
    }
    return;
  }
  if (style?.color !== void 0) {
    g.fill({ color: style.color, alpha: style.alpha ?? 1 });
    return;
  }
  if (fill !== void 0) {
    applyMarkerFill(g, fill, style);
    return;
  }
  g.fill({ color: 0 });
}

// src/primitives/shapes/CircleShape.ts
var CircleShape = class _CircleShape extends ShapeBase {
  static kind = "circle";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    const baseInset = style?.inset ?? 0;
    const r = Math.max(0, spec.radius - baseInset);
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, sampleCircleOutline(r), {
        color: style?.color ?? spec.stroke?.color ?? 0,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: true
      });
      return;
    }
    const trace = (extra = 0) => {
      const rr = Math.max(0, spec.radius - baseInset - extra);
      const segments = Math.max(32, Math.ceil(Math.PI * 2 * rr / 4));
      g.regularPoly(0, 0, rr, segments);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }
  bounds() {
    return _CircleShape.boundsOf(this.spec);
  }
  static boundsOf(spec) {
    return boundsOfCircle(spec);
  }
  static scaleSpec(spec, factor) {
    return scaleCircle(spec, factor);
  }
  contains(localX, localY) {
    return containsCircle(this.spec, localX, localY);
  }
  /**
   * Analytical perimeter intersection. `CircleShape` is centred at its
   * origin, so "centre-relative" and "origin-relative" local coords are the
   * same here. The boundary point along the ray from `(0, 0)` toward
   * `localFromCenter` is just the unit vector scaled by the radius.
   * When `localFromCenter` coincides with the centre the ray is degenerate;
   * we return `(r, 0)` as a stable sentinel.
   */
  boundaryIntersect(localFromCenter) {
    const d2 = Math.hypot(localFromCenter.x, localFromCenter.y);
    const r = this.spec.radius;
    if (d2 === 0) return { x: r, y: 0 };
    return { x: localFromCenter.x / d2 * r, y: localFromCenter.y / d2 * r };
  }
  /**
   * Silhouette obstacle-test for routers. Returns a closure over the
   * circle's current `(centre, radius)` that tests world points against
   * the inflated disc — pixel-tight, not the AABB-square. Routes hug the
   * circle's tangent instead of avoiding its bounding box corners.
   */
  obstacleTest() {
    const cx = this.spec.x;
    const cy = this.spec.y;
    const r = this.spec.radius;
    return (worldX, worldY, inflate) => {
      const dx = worldX - cx;
      const dy = worldY - cy;
      const limit = r + inflate;
      return dx * dx + dy * dy <= limit * limit;
    };
  }
  /**
   * Static paint surface for marker rendering. Connectors call this when
   * a circle is used as a source/target marker (no instantiation, just a
   * paint into someone else's Graphics). Only the first solid layer of
   * `spec.fill` is honoured here — markers don't support image fills or
   * inset content.
   */
  static paintInto(g, spec, anchor, _angleRad, style) {
    const r = Math.max(0, spec.radius - (style?.inset ?? 0));
    const segments = Math.max(32, Math.ceil(Math.PI * 2 * r / 4));
    g.regularPoly(anchor.x, anchor.y, r, segments);
    applyMarkerFill(g, spec.fill, style);
  }
};
function sampleCircleOutline(r) {
  if (r <= 0) return [];
  const n = Math.max(24, Math.ceil(Math.PI * 2 * r / 4));
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    out[i] = { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
  return out;
}
var EllipseShape = class _EllipseShape extends ShapeBase {
  static kind = "ellipse";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    const baseInset = style?.inset ?? 0;
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      const rx = Math.max(0, spec.radiusX - baseInset);
      const ry = Math.max(0, spec.radiusY - baseInset);
      emitDashedStroke(g, sampleEllipseOutline(rx, ry), {
        color: style?.color ?? spec.stroke?.color ?? 0,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: true
      });
      return;
    }
    const trace = (extra = 0) => {
      const rx = Math.max(0, spec.radiusX - baseInset - extra);
      const ry = Math.max(0, spec.radiusY - baseInset - extra);
      g.ellipse(0, 0, rx, ry);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }
  bounds() {
    return _EllipseShape.boundsOf(this.spec);
  }
  static boundsOf(spec) {
    return boundsOfEllipse(spec);
  }
  static scaleSpec(spec, factor) {
    return scaleEllipse(spec, factor);
  }
  contains(localX, localY) {
    return containsEllipse(this.spec, localX, localY);
  }
  /**
   * Analytical perimeter intersection. The ellipse is centred at its origin,
   * so the boundary point along the ray from `(0, 0)` toward `localFromCenter`
   * scales the direction so it lands on the ellipse: solve
   * `((t·dx)/rx)² + ((t·dy)/ry)² = 1` for `t`. Degenerate ray → `(rx, 0)`.
   */
  boundaryIntersect(localFromCenter) {
    const { radiusX: rx, radiusY: ry } = this.spec;
    const dx = localFromCenter.x;
    const dy = localFromCenter.y;
    if (dx === 0 && dy === 0 || rx <= 0 || ry <= 0) return { x: rx, y: 0 };
    const denom = Math.sqrt(dx / rx * (dx / rx) + dy / ry * (dy / ry));
    if (denom === 0) return { x: rx, y: 0 };
    const t = 1 / denom;
    return { x: dx * t, y: dy * t };
  }
  /**
   * Static paint surface for marker rendering — paints into a connector's
   * Graphics at `anchor` with no instantiation. Only the first solid layer of
   * `spec.fill` applies (markers don't support image fills / inset content).
   */
  static paintInto(g, spec, anchor, _angleRad, style) {
    const inset = style?.inset ?? 0;
    g.ellipse(anchor.x, anchor.y, Math.max(0, spec.radiusX - inset), Math.max(0, spec.radiusY - inset));
    applyMarkerFill(g, spec.fill, style);
  }
};
function sampleEllipseOutline(rx, ry) {
  if (rx <= 0 || ry <= 0) return [];
  const perim = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const n = Math.max(24, Math.ceil(perim / 4));
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    out[i] = { x: Math.cos(a) * rx, y: Math.sin(a) * ry };
  }
  return out;
}
var RectShape = class _RectShape extends ShapeBase {
  static kind = "rect";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    const baseInset = style?.inset ?? 0;
    const w0 = Math.max(0, spec.width - baseInset * 2);
    const h0 = Math.max(0, spec.height - baseInset * 2);
    const cr0 = Math.max(0, (spec.cornerRadius ?? 0) - baseInset);
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, sampleRectOutline(baseInset, baseInset, w0, h0, cr0), {
        color: style?.color ?? spec.stroke?.color ?? 0,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: true
      });
      return;
    }
    const trace = (extra = 0) => {
      const i = baseInset + extra;
      const w = Math.max(0, spec.width - i * 2);
      const h = Math.max(0, spec.height - i * 2);
      const cr = Math.max(0, (spec.cornerRadius ?? 0) - i);
      if (cr > 0) g.roundRect(i, i, w, h, cr);
      else g.rect(i, i, w, h);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }
  bounds() {
    return _RectShape.boundsOf(this.spec);
  }
  static boundsOf(spec) {
    return boundsOfRect(spec);
  }
  static scaleSpec(spec, factor) {
    return scaleRect(spec, factor);
  }
  /** Rounded corners are honoured — the fillet is cut out of the box, not ignored. */
  contains(localX, localY) {
    return containsRect(this.spec, localX, localY);
  }
  /**
   * Silhouette-aware ray exit. For `cornerRadius > 0` the AABB face isn't
   * the actual outline — the rendered rect rounds inward at each corner.
   * Take the AABB exit first; if it falls in one of the four corner zones
   * (within `R` of a corner in both axes), re-cast the ray against that
   * corner's quarter-circle so the returned point sits on the visible
   * silhouette. For sharp rects this is unchanged from the AABB fallback.
   */
  boundaryIntersect(localFromCenter) {
    const cr = this.spec.cornerRadius ?? 0;
    if (cr <= 0) return super.boundaryIntersect(localFromCenter);
    const halfW = this.spec.width / 2;
    const halfH = this.spec.height / 2;
    const R2 = Math.min(cr, halfW, halfH);
    const aabb = super.boundaryIntersect(localFromCenter);
    if (!aabb) return null;
    const onRight = aabb.x > halfW - R2;
    const onLeft = aabb.x < -halfW + R2;
    const onTop = aabb.y < -halfH + R2;
    const onBot = aabb.y > halfH - R2;
    let cornerX;
    let cornerY;
    if (onRight && onTop) {
      cornerX = halfW - R2;
      cornerY = -halfH + R2;
    } else if (onRight && onBot) {
      cornerX = halfW - R2;
      cornerY = halfH - R2;
    } else if (onLeft && onTop) {
      cornerX = -halfW + R2;
      cornerY = -halfH + R2;
    } else if (onLeft && onBot) {
      cornerX = -halfW + R2;
      cornerY = halfH - R2;
    } else return aabb;
    const len = Math.hypot(localFromCenter.x, localFromCenter.y);
    if (len === 0) return aabb;
    const ux = localFromCenter.x / len;
    const uy = localFromCenter.y / len;
    const dot = ux * cornerX + uy * cornerY;
    const c2 = cornerX * cornerX + cornerY * cornerY - R2 * R2;
    const disc = dot * dot - c2;
    if (disc < 0) return aabb;
    const t = dot + Math.sqrt(disc);
    return { x: ux * t, y: uy * t };
  }
  static paintInto(g, spec, anchor, _angleRad, style) {
    const cr = spec.cornerRadius ?? 0;
    const x2 = anchor.x - spec.width / 2;
    const y2 = anchor.y - spec.height / 2;
    if (cr > 0) g.roundRect(x2, y2, spec.width, spec.height, cr);
    else g.rect(x2, y2, spec.width, spec.height);
    applyMarkerFill(g, spec.fill, style);
  }
};
function sampleRectOutline(x2, y2, w, h, cr) {
  if (w <= 0 || h <= 0) return [];
  const r = Math.min(cr, w / 2, h / 2);
  if (r <= 0) {
    return [
      { x: x2, y: y2 },
      { x: x2 + w, y: y2 },
      { x: x2 + w, y: y2 + h },
      { x: x2, y: y2 + h }
    ];
  }
  const arcSteps = Math.max(4, Math.ceil(Math.PI * 0.5 * r / 2));
  const out = [];
  const corners = [
    { cx: x2 + r, cy: y2 + r, a0: Math.PI },
    // TL: π → 1.5π
    { cx: x2 + w - r, cy: y2 + r, a0: Math.PI * 1.5 },
    // TR: 1.5π → 2π
    { cx: x2 + w - r, cy: y2 + h - r, a0: 0 },
    // BR: 0 → 0.5π
    { cx: x2 + r, cy: y2 + h - r, a0: Math.PI * 0.5 }
    // BL: 0.5π → π
  ];
  for (const c2 of corners) {
    for (let i = 0; i <= arcSteps; i++) {
      const t = i / arcSteps;
      const a = c2.a0 + t * (Math.PI * 0.5);
      out.push({ x: c2.cx + Math.cos(a) * r, y: c2.cy + Math.sin(a) * r });
    }
  }
  return out;
}
var TabbedRectShape = class _TabbedRectShape extends ShapeBase {
  static kind = "tabbed-rect";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    const baseInset = style?.inset ?? 0;
    const verts = tabbedRectOutline(spec, baseInset);
    if (verts.length < 3) return;
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      const dash = {
        color: style?.color ?? spec.stroke?.color ?? 0,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset
      };
      emitDashedStroke(g, verts, { ...dash, closed: true });
      const fold = style === void 0 ? tabbedRectFoldLine(spec, baseInset) : void 0;
      if (fold) emitDashedStroke(g, fold, { ...dash, closed: false });
      return;
    }
    const trace = (extra = 0) => {
      const v2 = extra > 0 ? tabbedRectOutline(spec, baseInset + extra) : verts;
      if (v2.length >= 3) tracePolygon(g, v2);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
    if (style === void 0 && spec.stroke && (spec.stroke.width ?? 1) > 0) {
      const fold = tabbedRectFoldLine(spec, baseInset);
      if (fold) {
        g.moveTo(fold[0].x, fold[0].y);
        g.lineTo(fold[1].x, fold[1].y);
        g.stroke({
          color: spec.stroke.color,
          alpha: spec.stroke.alpha ?? 1,
          width: spec.stroke.width ?? 1,
          cap: spec.stroke.cap
        });
      }
    }
  }
  bounds() {
    return _TabbedRectShape.boundsOf(this.spec);
  }
  static boundsOf(spec) {
    return tabbedRectBounds(spec);
  }
  /** The folder, closed: body gone, tab kept. */
  static collapsedOf(spec) {
    return collapsedTabbedRect(spec);
  }
  /** Size the tab to the title it carries. */
  static fitToContent(spec, content) {
    return fitTabbedRectToContent(spec, content);
  }
  static scaleSpec(spec, factor) {
    return scaleTabbedRect(spec, factor);
  }
  /**
   * The body's midpoint, not the AABB's — the tab band shifts the AABB
   * centre upward by `tabHeight / 2`, which would float a centred glyph or
   * label off the rectangle the eye reads as the object.
   *
   * With no body (`height <= 0`) the tab *is* the object, so its own midpoint
   * is the answer.
   */
  visualCenter() {
    const { width, height, tabHeight } = this.spec;
    if (height <= 0) return { x: tabbedRectTabWidth(this.spec) / 2, y: tabHeight / 2 };
    return { x: width / 2, y: tabHeight + height / 2 };
  }
  contains(localX, localY) {
    return containsTabbedRect(this.spec, localX, localY);
  }
  /**
   * Ray exit against the **body** rectangle only. Input and output are
   * relative to the AABB centre per the `IShape` contract, so the body is
   * expressed as an off-centre box: the tab band sits entirely above the
   * AABB centre line, shifting the body's top edge down by `tabHeight / 2`.
   *
   * Excluding the tab is deliberate — a connector should terminate on the
   * container's body, not on the little title flag above it. The one exception
   * is a bodyless spec (`height <= 0`, the closed folder): with no body to aim
   * at, the tab band becomes the target.
   */
  boundaryIntersect(localFromCenter) {
    const { width, height, tabHeight } = this.spec;
    const halfW = (height <= 0 ? tabbedRectTabWidth(this.spec) : width) / 2;
    const bodyTop = height <= 0 ? -tabHeight / 2 : (tabHeight - height) / 2;
    const bodyBottom = height <= 0 ? tabHeight / 2 : (tabHeight + height) / 2;
    const dx = localFromCenter.x;
    const dy = localFromCenter.y;
    if (dx === 0 && dy === 0) return null;
    let tMin = Infinity;
    if (dx !== 0) {
      const t = (dx > 0 ? halfW : -halfW) / dx;
      if (t > 0 && t < tMin) tMin = t;
    }
    if (dy !== 0) {
      const t = (dy > 0 ? bodyBottom : bodyTop) / dy;
      if (t > 0 && t < tMin) tMin = t;
    }
    if (!isFinite(tMin)) return null;
    return { x: dx * tMin, y: dy * tMin };
  }
  /**
   * Route every `inside-*` placement into the **tab**.
   *
   * The rule is one-line on purpose: this silhouette exists to be a frame
   * around *other* content, so its body interior belongs to whatever it
   * contains — the only place the shape's own label belongs is the tab.
   * `inside-center` therefore centres the title on the tab, `inside-left`
   * left-aligns it there, and so on: the placement still means what it says,
   * just against the tab's box rather than the body's.
   *
   * The box returned is the tab's **upright** portion — the slant is excluded
   * on whichever side is angled, so a centred title reads centred against the
   * part of the tab that's actually full height rather than drifting into the
   * taper. Because that box is small and fixed, the inside-placement inset
   * (proportional to the box) stays visually identical no matter how large the
   * body grows underneath.
   *
   * Two deliberate escapes: bare `'center'` resolves through
   * {@link visualCenter} to the **body** centre, and the outside placements
   * fall through to the full AABB so they clear the whole silhouette.
   */
  labelAnchorBox(placement) {
    if (!placement.startsWith("inside-")) return void 0;
    return tabbedRectTabBox(this.spec, 0);
  }
  static paintInto(g, spec, anchor, angleRad, style) {
    const verts = tabbedRectOutline(spec, style?.inset ?? 0);
    if (verts.length < 3) return;
    const box = _TabbedRectShape.boundsOf(spec);
    const cx = box.width / 2;
    const cy = box.height / 2;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const placed = verts.map((v2) => {
      const x2 = v2.x - cx;
      const y2 = v2.y - cy;
      return { x: anchor.x + x2 * cos - y2 * sin, y: anchor.y + x2 * sin + y2 * cos };
    });
    tracePolygon(g, placed);
    applyMarkerFill(g, spec.fill, style);
  }
};
function tracePolygon(g, vertices) {
  const first = vertices[0];
  g.moveTo(first.x, first.y);
  for (let i = 1; i < vertices.length; i++) {
    const v2 = vertices[i];
    g.lineTo(v2.x, v2.y);
  }
  g.closePath();
}
var PathShape = class _PathShape extends ShapeBase {
  static kind = "path";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    const pts = spec.points;
    if (pts.length < 2) return;
    const closed = spec.closed === true || spec.smooth === true;
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, pts, {
        color: style?.color ?? spec.stroke?.color ?? 0,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed
      });
      return;
    }
    const trace = () => {
      if (spec.smooth === true) {
        traceSmoothClosed(g, pts);
        return;
      }
      const [first, ...rest] = pts;
      if (!first) return;
      g.moveTo(first.x, first.y);
      for (const p of rest) g.lineTo(p.x, p.y);
      if (closed) g.closePath();
    };
    trace();
    if (closed) applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }
  bounds() {
    return _PathShape.boundsOf(this.spec);
  }
  static boundsOf(spec) {
    return boundsOfPath(spec);
  }
  static scaleSpec(spec, factor) {
    return scalePath(spec, factor);
  }
  /** Points are authored centre-relative, so the local origin is the centre. */
  visualCenter() {
    return { x: 0, y: 0 };
  }
  contains(localX, localY) {
    return containsPath(this.spec, localX, localY);
  }
};
function traceSmoothClosed(g, pts) {
  const n = pts.length;
  if (n < 3) return;
  const last = pts[n - 1];
  const first = pts[0];
  let mx = (last.x + first.x) * 0.5;
  let my = (last.y + first.y) * 0.5;
  g.moveTo(mx, my);
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b2 = pts[(i + 1) % n];
    mx = (a.x + b2.x) * 0.5;
    my = (a.y + b2.y) * 0.5;
    g.quadraticCurveTo(a.x, a.y, mx, my);
  }
  g.closePath();
}
var PolygonShape = class _PolygonShape extends ShapeBase {
  static kind = "polygon";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    const baseInset = style?.inset ?? 0;
    const verts = resolveVertices(spec.vertices, baseInset);
    if (verts.length < 3) return;
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, verts, {
        color: style?.color ?? spec.stroke?.color ?? 0,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: true
      });
      return;
    }
    const trace = (extra = 0) => {
      const v2 = extra > 0 ? resolveVertices(spec.vertices, baseInset + extra) : verts;
      if (v2.length >= 3) tracePolygon2(g, v2);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }
  bounds() {
    return _PolygonShape.boundsOf(this.spec);
  }
  static boundsOf(spec) {
    return boundsOfPolygon(spec);
  }
  static scaleSpec(spec, factor) {
    return scalePolygon(spec, factor);
  }
  /**
   * Vertices are authored centre-relative, so the local origin is the
   * natural visual centre. Returning `(0, 0)` instead of the AABB midpoint
   * keeps inset glyphs / icons sitting where the user expects when the
   * polygon's silhouette doesn't fill its AABB (e.g. the chevron's notch
   * leaves empty space on the left of the box).
   */
  visualCenter() {
    return { x: 0, y: 0 };
  }
  contains(localX, localY) {
    return containsPolygon(this.spec, localX, localY);
  }
  /**
   * Analytical ray-to-edge intersection. Polygon vertices are already
   * centre-relative, so `localFromCenter` shares the same frame as the
   * stored vertices.
   */
  boundaryIntersect(localFromCenter) {
    return rayPolygonIntersection(localFromCenter, this.spec.vertices);
  }
  /**
   * Silhouette obstacle-test for routers. Translates the world point into
   * shape-local space and runs an even-odd point-in-polygon test against the
   * polygon expanded by `inflate`. Tight against the actual silhouette
   * instead of the AABB, so routes hug concave / angular outlines.
   */
  obstacleTest() {
    const cx = this.spec.x;
    const cy = this.spec.y;
    const baseVerts = this.spec.vertices;
    let cachedInflate = Number.NaN;
    let cachedVerts = baseVerts;
    return (worldX, worldY, inflate) => {
      if (inflate !== cachedInflate) {
        cachedInflate = inflate;
        cachedVerts = inflate === 0 ? baseVerts : offsetPolygon(baseVerts, -inflate);
      }
      return pointInPolygon(worldX - cx, worldY - cy, cachedVerts);
    };
  }
  /**
   * Marker paint surface. Rotates the vertex list by `angleRad`, translates
   * to `anchor`, then traces + fills. Only the first solid layer of
   * `spec.fill` is honoured (markers don't support image / inset fills).
   */
  static paintInto(g, spec, anchor, angleRad, style) {
    const verts = resolveVertices(spec.vertices, style?.inset ?? 0);
    if (verts.length < 3) return;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const placed = verts.map((v2) => ({
      x: anchor.x + v2.x * cos - v2.y * sin,
      y: anchor.y + v2.x * sin + v2.y * cos
    }));
    tracePolygon2(g, placed);
    applyMarkerFill(g, spec.fill, style);
  }
};
function resolveVertices(vertices, inset) {
  if (inset === 0) return vertices;
  return offsetPolygon(vertices, inset);
}
function tracePolygon2(g, vertices) {
  const first = vertices[0];
  g.moveTo(first.x, first.y);
  for (let i = 1; i < vertices.length; i++) {
    const v2 = vertices[i];
    g.lineTo(v2.x, v2.y);
  }
  g.closePath();
}
var RegularPolygonShape = class _RegularPolygonShape extends ShapeBase {
  static kind = "regular-polygon";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    const baseInset = style?.inset ?? 0;
    const verts = computeVertices(spec, baseInset);
    if (verts.length < 3) return;
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, verts, {
        color: style?.color ?? spec.stroke?.color ?? 0,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: true
      });
      return;
    }
    const trace = (extra = 0) => {
      const v2 = extra > 0 ? computeVertices(spec, baseInset + extra) : verts;
      if (v2.length >= 3) tracePolygon3(g, v2);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }
  bounds() {
    return _RegularPolygonShape.boundsOf(this.spec);
  }
  static boundsOf(spec) {
    return boundsOfRegularPolygon(spec);
  }
  static scaleSpec(spec, factor) {
    return scaleRegularPolygon(spec, factor);
  }
  /**
   * Vertices are placed symmetrically around the origin by
   * `regularPolygonVertices`, so the local origin is the centroid. The AABB
   * midpoint is offset for odd-sided polygons (triangle / pentagon /
   * heptagon) — using the origin instead keeps an inset glyph centred on
   * the visual mass rather than floating toward the apex.
   */
  visualCenter() {
    return { x: 0, y: 0 };
  }
  contains(localX, localY) {
    return containsRegularPolygon(this.spec, localX, localY);
  }
  boundaryIntersect(localFromCenter) {
    return rayPolygonIntersection(localFromCenter, computeVertices(this.spec, 0));
  }
  obstacleTest() {
    const cx = this.spec.x;
    const cy = this.spec.y;
    const baseVerts = computeVertices(this.spec, 0);
    let cachedInflate = Number.NaN;
    let cachedVerts = baseVerts;
    return (worldX, worldY, inflate) => {
      if (inflate !== cachedInflate) {
        cachedInflate = inflate;
        cachedVerts = inflate === 0 ? baseVerts : offsetPolygon(baseVerts, -inflate);
      }
      return pointInPolygon(worldX - cx, worldY - cy, cachedVerts);
    };
  }
  static paintInto(g, spec, anchor, angleRad, style) {
    const base = regularPolygonVertices(
      spec.sides,
      Math.max(0, spec.radius - (style?.inset ?? 0)),
      spec.rotation ?? 0
    );
    if (base.length < 3) return;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const placed = base.map((v2) => ({
      x: anchor.x + v2.x * cos - v2.y * sin,
      y: anchor.y + v2.x * sin + v2.y * cos
    }));
    tracePolygon3(g, placed);
    applyMarkerFill(g, spec.fill, style);
  }
};
function computeVertices(spec, inset) {
  const r = Math.max(0, spec.radius - inset);
  return regularPolygonVertices(spec.sides, r, spec.rotation ?? 0);
}
function tracePolygon3(g, vertices) {
  const first = vertices[0];
  g.moveTo(first.x, first.y);
  for (let i = 1; i < vertices.length; i++) {
    const v2 = vertices[i];
    g.lineTo(v2.x, v2.y);
  }
  g.closePath();
}
var StarShape = class _StarShape extends ShapeBase {
  static kind = "star";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    const baseInset = style?.inset ?? 0;
    const verts = computeVertices2(spec, baseInset);
    if (verts.length < 3) return;
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, verts, {
        color: style?.color ?? spec.stroke?.color ?? 0,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: true
      });
      return;
    }
    const trace = (extra = 0) => {
      const v2 = extra > 0 ? computeVertices2(spec, baseInset + extra) : verts;
      if (v2.length >= 3) tracePolygon4(g, v2);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }
  bounds() {
    return _StarShape.boundsOf(this.spec);
  }
  static boundsOf(spec) {
    return boundsOfStar(spec);
  }
  static scaleSpec(spec, factor) {
    return scaleStar(spec, factor);
  }
  /**
   * Star vertices are placed symmetrically around the origin by
   * `starVertices`, so the local origin is the centroid. For odd-pointed
   * stars (5-point being the canonical case) the AABB midpoint is offset
   * from the visual mass — using the origin instead keeps an inset glyph
   * sitting where the eye reads as "centre".
   */
  visualCenter() {
    return { x: 0, y: 0 };
  }
  contains(localX, localY) {
    return containsStar(this.spec, localX, localY);
  }
  boundaryIntersect(localFromCenter) {
    return rayPolygonIntersection(localFromCenter, computeVertices2(this.spec, 0));
  }
  obstacleTest() {
    const cx = this.spec.x;
    const cy = this.spec.y;
    const baseVerts = computeVertices2(this.spec, 0);
    let cachedInflate = Number.NaN;
    let cachedVerts = baseVerts;
    return (worldX, worldY, inflate) => {
      if (inflate !== cachedInflate) {
        cachedInflate = inflate;
        cachedVerts = inflate === 0 ? baseVerts : offsetPolygon(baseVerts, -inflate);
      }
      return pointInPolygon(worldX - cx, worldY - cy, cachedVerts);
    };
  }
  static paintInto(g, spec, anchor, angleRad, style) {
    const inset = style?.inset ?? 0;
    const base = starVertices(
      spec.points,
      Math.max(0, spec.innerRadius - inset),
      Math.max(0, spec.outerRadius - inset),
      spec.rotation ?? 0
    );
    if (base.length < 3) return;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const placed = base.map((v2) => ({
      x: anchor.x + v2.x * cos - v2.y * sin,
      y: anchor.y + v2.x * sin + v2.y * cos
    }));
    tracePolygon4(g, placed);
    applyMarkerFill(g, spec.fill, style);
  }
};
function computeVertices2(spec, inset) {
  const inner = Math.max(0, spec.innerRadius - inset);
  const outer = Math.max(0, spec.outerRadius - inset);
  return starVertices(spec.points, inner, outer, spec.rotation ?? 0);
}
function tracePolygon4(g, vertices) {
  const first = vertices[0];
  g.moveTo(first.x, first.y);
  for (let i = 1; i < vertices.length; i++) {
    const v2 = vertices[i];
    g.lineTo(v2.x, v2.y);
  }
  g.closePath();
}
var TAU = Math.PI * 2;
var ARC_SAMPLE_STEP = Math.PI / 60;
var ArcShape = class _ArcShape extends ShapeBase {
  static kind = "arc";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    const baseInset = style?.inset ?? 0;
    if (spec.endAngle <= spec.startAngle) return;
    const innerR0 = Math.max(0, spec.innerR + baseInset);
    const outerR0 = Math.max(innerR0, spec.outerR - baseInset);
    if (outerR0 <= 0) return;
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, sampleArcOutline(innerR0, outerR0, spec.startAngle, spec.endAngle), {
        color: style?.color ?? spec.stroke?.color ?? 0,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: true
      });
      return;
    }
    const trace = (extra = 0) => {
      const i = baseInset + extra;
      const inner = Math.max(0, spec.innerR + i);
      const outer = Math.max(inner, spec.outerR - i);
      if (outer <= 0) return;
      traceArc(g, inner, outer, spec.startAngle, spec.endAngle);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);
  }
  bounds() {
    return _ArcShape.boundsOf(this.spec);
  }
  static boundsOf(spec) {
    return boundsOfArc(spec);
  }
  static scaleSpec(spec, factor) {
    return scaleArc(spec, factor);
  }
  /**
   * Visual centre of an annular sector — half-angle direction, midradius
   * distance. Used by inset-content labels (`placement: 'center'`); good
   * enough for visual centring without the (more expensive) area-weighted
   * centroid integral.
   */
  visualCenter() {
    const a0 = this.spec.startAngle;
    const a1 = this.spec.endAngle;
    if (a1 <= a0) return { x: 0, y: 0 };
    const mid = (a0 + a1) / 2;
    const r = (this.spec.innerR + this.spec.outerR) / 2;
    return { x: Math.cos(mid) * r, y: Math.sin(mid) * r };
  }
  contains(localX, localY) {
    return containsArc(this.spec, localX, localY);
  }
};
function traceArc(g, innerR, outerR, a0, a1) {
  const isFullSweep = a1 - a0 >= TAU - 1e-6;
  if (isFullSweep) {
    g.moveTo(outerR, 0);
    g.arc(0, 0, outerR, 0, TAU);
    g.closePath();
    if (innerR > 0) {
      g.moveTo(innerR, 0);
      g.arc(0, 0, innerR, 0, TAU, true);
      g.closePath();
    }
    return;
  }
  const cos0 = Math.cos(a0);
  const sin0 = Math.sin(a0);
  const cos1 = Math.cos(a1);
  const sin1 = Math.sin(a1);
  if (innerR <= 0) {
    g.moveTo(0, 0);
    g.lineTo(outerR * cos0, outerR * sin0);
    g.arc(0, 0, outerR, a0, a1);
    g.lineTo(0, 0);
    g.closePath();
    return;
  }
  g.moveTo(innerR * cos0, innerR * sin0);
  g.lineTo(outerR * cos0, outerR * sin0);
  g.arc(0, 0, outerR, a0, a1);
  g.lineTo(innerR * cos1, innerR * sin1);
  g.arc(0, 0, innerR, a1, a0, true);
  g.closePath();
}
function sampleArcOutline(innerR, outerR, a0, a1) {
  const out = [];
  const sweep = a1 - a0;
  if (sweep <= 0 || outerR <= 0) return out;
  const steps = Math.max(2, Math.ceil(sweep / ARC_SAMPLE_STEP));
  for (let i = 0; i <= steps; i++) {
    const a = a0 + sweep * i / steps;
    out.push({ x: Math.cos(a) * outerR, y: Math.sin(a) * outerR });
  }
  if (innerR > 0) {
    for (let i = 0; i <= steps; i++) {
      const a = a1 - sweep * i / steps;
      out.push({ x: Math.cos(a) * innerR, y: Math.sin(a) * innerR });
    }
  } else {
    out.push({ x: 0, y: 0 });
  }
  return out;
}
function mountLabelContent(content, wrap) {
  if (content.kind === "text") {
    const effectiveWrap = withDerivedMaxLines(wrap);
    const display2 = new Text({ text: content.text, style: textStyleFor(content, effectiveWrap) });
    display2.label = "label:text";
    display2.alpha = content.alpha ?? 1;
    applyMaxLines(display2, content, effectiveWrap);
    return { display: display2, kind: "text" };
  }
  const display = new HTMLText({ text: htmlBodyFor(content), style: htmlStyleFor(content, wrap) });
  display.label = "label:text";
  display.alpha = content.alpha ?? 1;
  return { display, kind: "html-text" };
}
function updateLabelContent(view, content, wrap) {
  if (view.kind !== content.kind) {
    view.display.destroy();
    return mountLabelContent(content, wrap);
  }
  if (content.kind === "text") {
    const t = view.display;
    const effectiveWrap = withDerivedMaxLines(wrap);
    t.style = textStyleFor(content, effectiveWrap);
    t.text = content.text;
    t.alpha = content.alpha ?? 1;
    applyMaxLines(t, content, effectiveWrap);
  } else {
    const h = view.display;
    h.style = htmlStyleFor(content, wrap);
    h.text = htmlBodyFor(content);
    h.alpha = content.alpha ?? 1;
  }
  return view;
}
function applyLabelResolution(view, resolution) {
  if (resolution <= 0 || !Number.isFinite(resolution)) return;
  view.display.resolution = resolution;
}
function contentFontSize(content) {
  return content.kind === "html-text" ? content.defaultFontSize ?? 12 : content.fontSize ?? 12;
}
function zoomAboveHost(surface) {
  let s = 1;
  let p = surface?.parent ?? null;
  while (p) {
    s *= p.scale.x;
    p = p.parent;
  }
  return s;
}
function measureLabelContent(content, wrap) {
  if (content.kind !== "text") return null;
  const options = textStyleFor(content, withDerivedMaxLines(wrap));
  const metrics = CanvasTextMetrics.measureText(content.text, measureStyleFor(options));
  return { width: metrics.width, height: metrics.height };
}
var MEASURE_STYLE_CACHE_LIMIT = 256;
var measureStyleCache = /* @__PURE__ */ new Map();
function measureStyleFor(options) {
  const key = measureStyleKey(options);
  const cached = measureStyleCache.get(key);
  if (cached) {
    measureStyleCache.delete(key);
    measureStyleCache.set(key, cached);
    return cached;
  }
  const style = new TextStyle(options);
  measureStyleCache.set(key, style);
  if (measureStyleCache.size > MEASURE_STYLE_CACHE_LIMIT) {
    const oldest = measureStyleCache.keys().next();
    if (!oldest.done) measureStyleCache.delete(oldest.value);
  }
  return style;
}
function measureStyleKey(o) {
  const stroke = o.stroke;
  const shadow = o.dropShadow;
  return [
    o.fontFamily,
    o.fontSize,
    o.fill,
    o.align,
    o.fontWeight,
    o.fontStyle,
    o.fontVariant,
    o.letterSpacing,
    o.lineHeight,
    o.wordWrap,
    o.wordWrapWidth,
    stroke ? `${String(stroke.color)},${stroke.width}` : "",
    shadow ? `${String(shadow.color)},${shadow.blur},${shadow.distance},${shadow.angle},${shadow.alpha}` : ""
  ].join("|");
}
function textStyleFor(content, wrap) {
  const wantsWrap = wrap?.wordWrap === true || wrap?.maxWidth !== void 0;
  const style = {
    fontFamily: content.fontFamily ?? "sans-serif",
    fontSize: content.fontSize ?? 12,
    fill: content.fill ?? 1120295,
    // Left, matching the `anchor` default the CompositePart contract documents.
    // A wrapped label with no explicit `align` used to centre its lines, which
    // silently disagreed with the horizontal anchor.
    align: content.align ?? "left"
  };
  if (content.fontWeight !== void 0) style.fontWeight = content.fontWeight;
  if (content.fontStyle !== void 0) style.fontStyle = content.fontStyle;
  if (content.fontVariant !== void 0) style.fontVariant = content.fontVariant;
  if (content.letterSpacing !== void 0) style.letterSpacing = content.letterSpacing;
  if (content.lineHeight !== void 0) style.lineHeight = content.lineHeight;
  if (wantsWrap) {
    style.wordWrap = true;
    if (wrap?.maxWidth !== void 0) style.wordWrapWidth = wrap.maxWidth;
  }
  if (content.stroke) {
    style.stroke = { color: content.stroke.color, width: content.stroke.width };
  }
  if (content.shadow) {
    style.dropShadow = {
      color: content.shadow.color,
      blur: content.shadow.blur ?? 0,
      distance: Math.hypot(content.shadow.offsetX ?? 0, content.shadow.offsetY ?? 2),
      angle: Math.atan2(content.shadow.offsetY ?? 2, content.shadow.offsetX ?? 0),
      alpha: content.shadow.alpha ?? 0.5
    };
  }
  return style;
}
function htmlStyleFor(content, wrap) {
  const style = {
    fontFamily: content.defaultFontFamily ?? "sans-serif",
    fontSize: content.defaultFontSize ?? 12,
    fill: content.defaultFill ?? 1120295
  };
  if (content.defaultFontWeight !== void 0) style.fontWeight = content.defaultFontWeight;
  if (content.width !== void 0) style.wordWrapWidth = content.width;
  if (wrap?.maxWidth !== void 0 && style.wordWrapWidth === void 0) {
    style.wordWrapWidth = wrap.maxWidth;
  }
  if (style.wordWrapWidth !== void 0) style.wordWrap = true;
  if (content.tagStyles) style.tagStyles = content.tagStyles;
  if (content.cssOverrides) style.cssOverrides = content.cssOverrides;
  return style;
}
function htmlBodyFor(content) {
  return content.html;
}
function applyMaxLines(display, content, wrap) {
  if (!wrap || !wrap.maxLines || wrap.maxLines < 1) return;
  const overflow = wrap.overflow ?? "ellipsis";
  const lineHeight = effectiveLineHeight(display);
  if (lineHeight <= 0) return;
  if (currentLineCount(display, lineHeight) <= wrap.maxLines) return;
  const original = content.text;
  let lo = 0;
  let hi = original.length;
  while (lo < hi) {
    const mid = lo + hi + 1 >>> 1;
    const candidate = overflow === "ellipsis" ? original.slice(0, mid).replace(/\s+$/, "") + "\u2026" : original.slice(0, mid);
    display.text = candidate;
    if (currentLineCount(display, lineHeight) <= wrap.maxLines) lo = mid;
    else hi = mid - 1;
  }
  display.text = overflow === "ellipsis" ? original.slice(0, lo).replace(/\s+$/, "") + "\u2026" : original.slice(0, lo);
}
function withDerivedMaxLines(wrap) {
  if (!wrap || wrap.maxHeight === void 0 || wrap.maxHeight <= 0) return wrap;
  const approxLineHeight = 14.4;
  const derivedMaxLines = Math.max(1, Math.floor(wrap.maxHeight / approxLineHeight));
  const combinedMaxLines = wrap.maxLines !== void 0 ? Math.min(wrap.maxLines, derivedMaxLines) : derivedMaxLines;
  return { ...wrap, maxLines: combinedMaxLines };
}
function fitInsideBox(view, content, wrap, box, minFontSize) {
  if (box.width <= 0 || box.height <= 0) return { hidden: true };
  if (content.kind !== "text") return { hidden: false };
  const display = view.display;
  const configuredFontSize = content.fontSize ?? 12;
  const floor = Math.max(1, minFontSize);
  const widthBudget = Math.max(1, box.width);
  const heightBudget = Math.max(1, box.height);
  const baseWrap = {
    ...wrap ?? {},
    maxWidth: Math.min(wrap?.maxWidth ?? Infinity, widthBudget),
    maxHeight: Math.min(wrap?.maxHeight ?? Infinity, heightBudget),
    wordWrap: true
  };
  const applyAt = (fontSize) => {
    const sizedContent = { ...content, fontSize };
    display.style = textStyleFor(sizedContent, baseWrap);
    display.text = content.text;
  };
  applyAt(configuredFontSize);
  if (display.width <= widthBudget + 0.5 && display.height <= heightBudget + 0.5) {
    return { hidden: false };
  }
  let lo = floor;
  let hi = configuredFontSize;
  let bestFit = -1;
  while (hi - lo >= 0.5) {
    const mid = (lo + hi) / 2;
    applyAt(mid);
    if (display.width <= widthBudget + 0.5 && display.height <= heightBudget + 0.5) {
      bestFit = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  if (bestFit > 0) {
    applyAt(bestFit);
    return { hidden: false };
  }
  applyAt(floor);
  const lineHeight = effectiveLineHeight(display);
  if (lineHeight <= 0) return { hidden: true };
  const derivedMaxLines = Math.max(1, Math.floor(heightBudget / lineHeight));
  applyMaxLines(display, content, { ...baseWrap, maxLines: derivedMaxLines, overflow: "ellipsis" });
  if (display.width > widthBudget + 0.5) {
    truncateToWidth(display, widthBudget);
  }
  if (display.width > widthBudget + 0.5 || display.height > heightBudget + 0.5) {
    return { hidden: true };
  }
  return { hidden: false };
}
function truncateToWidth(display, widthBudget) {
  const original = display.text;
  let lo = 0;
  let hi = original.length;
  while (lo < hi) {
    const mid = lo + hi + 1 >>> 1;
    display.text = original.slice(0, mid).replace(/\s+$/, "") + "\u2026";
    if (display.width <= widthBudget + 0.5) lo = mid;
    else hi = mid - 1;
  }
  if (lo <= 0) {
    display.text = "";
  } else {
    display.text = original.slice(0, lo).replace(/\s+$/, "") + "\u2026";
  }
}
function effectiveLineHeight(display) {
  const style = display.style;
  const ascent = style.fontSize ?? 12;
  return style.lineHeight && style.lineHeight > 0 ? style.lineHeight : ascent * 1.2;
}
function currentLineCount(display, lineHeight) {
  const lines = display.height / lineHeight;
  return Math.max(1, Math.round(lines + 1e-3));
}
var ROOT_CTORS = {
  rect: (s, h) => new RectShape(s, h),
  circle: (s, h) => new CircleShape(s, h),
  ellipse: (s, h) => new EllipseShape(s, h),
  polygon: (s, h) => new PolygonShape(s, h),
  "regular-polygon": (s, h) => new RegularPolygonShape(s, h),
  star: (s, h) => new StarShape(s, h),
  arc: (s, h) => new ArcShape(s, h)
};
var CompositeShape = class _CompositeShape extends ShapeBase {
  static kind = "composite";
  /** Mounted label displays keyed by their index in `spec.parts`. */
  labelViews = /* @__PURE__ */ new Map();
  /** Mounted `icon` inset views keyed by their index in `spec.parts`. */
  iconViews = /* @__PURE__ */ new Map();
  /**
   * Device resolution for the mounted `label` parts, pushed by the renderer's
   * label-resolution LOD path ({@link setLabelResolution}). Re-applied to every
   * label on each {@link syncLabels} so redraws don't reset crisp text to base.
   */
  labelResolution = null;
  /**
   * Whether the mounted `label` parts are hidden. Persists across
   * {@link syncLabels} (re-applied per redraw, like {@link labelResolution}) so a
   * text zoom-LOD toggle survives updates. Driven by {@link setTextVisible}.
   */
  textHidden = false;
  /** Borrowed background shape — provides the silhouette geometry. */
  rootShape;
  rootKind = "";
  /** Silhouette mask used when {@link CompositeSpec.clip} is set (else undefined). */
  clipMask;
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  /**
   * The effective root spec: explicit {@link CompositeSpec.root} or a default
   * rect. Resolved by the pure spec maths so the hit test (which has no
   * instance to ask) resolves the same silhouette this draws.
   */
  rootSpecOf(spec) {
    return resolveCompositeRoot(spec);
  }
  /**
   * Ensure {@link rootShape} matches the current root spec. Rebuilds the
   * instance only when the kind changes; otherwise refreshes its geometry spec
   * in place (no redraw of the borrowed instance's own — unused — gfx).
   */
  ensureRoot(spec) {
    const rootSpec = this.rootSpecOf(spec);
    if (this.rootShape === void 0 || this.rootKind !== rootSpec.kind) {
      this.rootShape?.destroy();
      const make = ROOT_CTORS[rootSpec.kind] ?? ROOT_CTORS.rect;
      this.rootShape = make(rootSpec, this.host);
      this.rootKind = rootSpec.kind;
    } else {
      this.rootShape.setGeometrySpec(rootSpec);
    }
  }
  drawGeometry(g, spec, style) {
    const root = this.rootShape;
    const b2 = root.bounds();
    const ox = spec.width / 2 - (b2.x + b2.width / 2);
    const oy = spec.height / 2 - (b2.y + b2.height / 2);
    g.translateTransform(ox, oy);
    root.paintInto(g, style);
    g.resetTransform();
    if (style) return;
    for (const p of spec.parts) {
      if (p.part === "rect") {
        if (p.cornerRadius) g.roundRect(p.x, p.y, p.width, p.height, p.cornerRadius);
        else g.rect(p.x, p.y, p.width, p.height);
        if (p.fill !== void 0) g.fill({ color: p.fill, alpha: p.fillAlpha ?? 1 });
        if (p.stroke) g.stroke({ color: p.stroke.color, width: p.stroke.width ?? 1, alpha: p.stroke.alpha ?? 1 });
      } else if (p.part === "circle") {
        g.circle(p.x, p.y, p.radius);
        if (p.fill !== void 0) g.fill({ color: p.fill, alpha: p.fillAlpha ?? 1 });
        if (p.stroke) g.stroke({ color: p.stroke.color, width: p.stroke.width ?? 1, alpha: p.stroke.alpha ?? 1 });
      } else if (p.part === "line") {
        g.moveTo(p.x, p.y);
        g.lineTo(p.x2, p.y2);
        g.stroke({ color: p.stroke.color, width: p.stroke.width ?? 1, alpha: p.stroke.alpha ?? 1 });
      } else if (p.part === "icon" && p.background) {
        const { fill, fillAlpha, cornerRadius } = p.background;
        if (cornerRadius) g.roundRect(p.x, p.y, p.size, p.size, cornerRadius);
        else g.rect(p.x, p.y, p.size, p.size);
        g.fill({ color: fill, alpha: fillAlpha ?? 1 });
      }
    }
  }
  /** Refresh the root shape, geometry via the base `draw`, then labels + icons. */
  draw(spec) {
    this.ensureRoot(spec);
    super.draw(spec);
    this.syncLabels(spec);
    this.syncIcons(spec);
    this.ensureClip(spec);
  }
  /**
   * Maintain the silhouette clip mask per {@link CompositeSpec.clip}. The mask is
   * the root shape traced (filled) at the same centred offset {@link drawGeometry}
   * uses, added as a child of `gfx` and set as `gfx.mask` — so every part /
   * label / icon is clipped to the card outline while the borrowed silhouette
   * (and its decorations, which live outside `gfx`) are untouched.
   */
  ensureClip(spec) {
    if (!spec.clip) {
      if (this.clipMask) {
        this.gfx.mask = null;
        this.clipMask.destroy();
        this.clipMask = void 0;
      }
      return;
    }
    if (!this.clipMask) {
      this.clipMask = new Graphics();
      this.clipMask.label = "clip-mask";
      this.gfx.addChild(this.clipMask);
      this.gfx.mask = this.clipMask;
    }
    const g = this.clipMask;
    g.clear();
    const root = this.rootShape;
    const b2 = root.bounds();
    const ox = spec.width / 2 - (b2.x + b2.width / 2);
    const oy = spec.height / 2 - (b2.y + b2.height / 2);
    g.translateTransform(ox, oy);
    const rootSpec = this.rootSpecOf(spec);
    root.setGeometrySpec({ ...rootSpec, stroke: void 0 });
    root.paintInto(g, { color: 16777215, alpha: 1, fill: true, strokeWidth: 0 });
    root.setGeometrySpec(rootSpec);
    g.resetTransform();
  }
  /**
   * Diff the `label` parts against the mounted `labelViews` map, keyed by part
   * index: mount new labels, update existing ones in place, destroy removed
   * ones. Each label is positioned at its relative `(x, y)` with the requested
   * horizontal anchor (measured against the rendered block width).
   */
  syncLabels(spec) {
    const seen = /* @__PURE__ */ new Set();
    spec.parts.forEach((p, i) => {
      if (p.part !== "label") return;
      seen.add(i);
      const content = {
        kind: "text",
        text: p.text,
        fontSize: p.fontSize,
        fontWeight: p.fontWeight,
        fontStyle: p.fontStyle,
        fontVariant: p.fontVariant,
        lineHeight: p.lineHeight,
        fill: p.fill ?? 16777215,
        align: p.align
      };
      const wrap = p.maxWidth !== void 0 ? { maxWidth: p.maxWidth, maxLines: p.maxLines, overflow: p.overflow ?? "ellipsis" } : void 0;
      let view = this.labelViews.get(i);
      if (!view) {
        view = mountLabelContent(content, wrap);
        this.gfx.addChild(view.display);
        this.labelViews.set(i, view);
      } else {
        const next = updateLabelContent(view, content, wrap);
        if (next !== view) {
          this.gfx.addChild(next.display);
          view = next;
          this.labelViews.set(i, next);
        }
      }
      if (this.labelResolution !== null) applyLabelResolution(view, this.labelResolution);
      const w = view.display.width;
      const h = view.display.height;
      const dx = p.anchor === "right" ? -w : p.anchor === "center" ? -w / 2 : 0;
      const dy = p.vAnchor === "bottom" ? -h : p.vAnchor === "middle" ? -h / 2 : 0;
      view.display.position.set(p.x + dx, p.y + dy);
      view.display.visible = !this.textHidden;
    });
    for (const [i, view] of this.labelViews) {
      if (!seen.has(i)) {
        view.display.destroy();
        this.labelViews.delete(i);
      }
    }
  }
  /**
   * Diff the `icon` parts against the mounted `iconViews`, keyed by part index.
   * Each glyph/svg is mounted as an inset centred in its own `size × size` box
   * at the part's `(x, y)` — reusing the same {@link mountInsetContent} pipeline
   * ShapeBase uses for shape insets (anchor / sizeRatio / async svg-url all
   * carry over). The chip background, if any, is traced in `drawGeometry`.
   */
  syncIcons(spec) {
    const seen = /* @__PURE__ */ new Set();
    spec.parts.forEach((p, i) => {
      if (p.part !== "icon") return;
      seen.add(i);
      const box = { x: p.x, y: p.y, width: p.size, height: p.size };
      const existing = this.iconViews.get(i);
      if (existing) {
        updateInsetContent(existing, p.icon, box);
      } else {
        this.iconViews.set(i, mountInsetContent(this.gfx, p.icon, box));
      }
    });
    for (const [i, view] of this.iconViews) {
      if (!seen.has(i)) {
        destroyInsetContent(view);
        this.iconViews.delete(i);
      }
    }
  }
  bounds() {
    return _CompositeShape.boundsOf(this.spec);
  }
  /**
   * Static AABB from the spec's `width × height` box — the composite's silhouette
   * fills its box (like {@link RectShape}). Exposed so `PrimitivesRenderer.boundsOfSpec`
   * can size a composite **without** an instance, which is how layouts (ELK et al.)
   * read node dimensions. Missing this made every card fall back to the layout's
   * default size and overlap.
   */
  static boundsOf(spec) {
    return boundsOfComposite(spec);
  }
  /**
   * Re-rasterise every mounted `label` part at `resolution` (device pixels per
   * CSS pixel) and remember it, so subsequent redraws keep the text crisp. The
   * renderer calls this from its label-resolution LOD path — the composite
   * counterpart to a `LabelDecoration.setResolution`.
   */
  setLabelResolution(resolution) {
    if (!Number.isFinite(resolution) || resolution <= 0) return;
    this.labelResolution = resolution;
    for (const view of this.labelViews.values()) applyLabelResolution(view, resolution);
  }
  /**
   * Show / hide every mounted `label` part — the composite's internal text.
   * A pure `.visible` flip; the flag persists so a later redraw keeps text
   * hidden ({@link syncLabels} re-asserts it). This is the `IShape.setTextVisible`
   * hook the renderer's text zoom-LOD path drives, so a `NodeLabelLODBehaviour` gates
   * composite text the same way it gates a simple node's `'label'` decoration.
   */
  setTextVisible(visible) {
    this.textHidden = !visible;
    for (const view of this.labelViews.values()) view.display.visible = visible;
  }
  /**
   * Sub-part hit test — returns the `hitId` of the topmost `hitId`-tagged part
   * (`rect` / `circle` / `icon`) containing the local point, or `undefined`.
   * Parts are traced back-to-front, so the search runs in reverse (last drawn =
   * on top). The renderer calls this to emit `shape:partover` / `shape:partout`.
   */
  hitTestPart(localX, localY) {
    const parts = this.spec.parts;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.part === "rect" && p.hitId !== void 0) {
        if (localX >= p.x && localX <= p.x + p.width && localY >= p.y && localY <= p.y + p.height) return p.hitId;
      } else if (p.part === "circle" && p.hitId !== void 0) {
        const dx = localX - p.x;
        const dy = localY - p.y;
        if (dx * dx + dy * dy <= p.radius * p.radius) return p.hitId;
      } else if (p.part === "icon" && p.hitId !== void 0) {
        if (localX >= p.x && localX <= p.x + p.size && localY >= p.y && localY <= p.y + p.size) return p.hitId;
      }
    }
    return void 0;
  }
  destroy() {
    for (const view of this.labelViews.values()) view.display.destroy();
    this.labelViews.clear();
    for (const view of this.iconViews.values()) destroyInsetContent(view);
    this.iconViews.clear();
    if (this.clipMask) {
      this.gfx.mask = null;
      this.clipMask.destroy();
      this.clipMask = void 0;
    }
    this.rootShape?.destroy();
    super.destroy();
  }
};
var ConnectorBase = class extends PrimitiveBase {
  constructor(host) {
    super();
    this.host = host;
    this.bodyGfx = new Graphics();
    this.sourceMarkerGfx = new Graphics();
    this.targetMarkerGfx = new Graphics();
    this.bodyGfx.label = "path";
    this.sourceMarkerGfx.label = "marker:source";
    this.targetMarkerGfx.label = "marker:target";
    this.gfx.addChild(this.bodyGfx);
    this.gfx.addChild(this.sourceMarkerGfx);
    this.gfx.addChild(this.targetMarkerGfx);
    this.gfx.eventMode = "static";
    this.gfx.cursor = "pointer";
    this.gfx.hitArea = {
      contains: (x2, y2) => {
        if (this.path.length < 2 || !this.spec) return false;
        const sw = this.spec.stroke?.width ?? 1;
        const tol = sw / 2 + 4;
        return distanceToPolylineSq(samplePath(this.path), x2, y2) <= tol * tol;
      }
    };
  }
  bodyGfx;
  sourceMarkerGfx;
  targetMarkerGfx;
  spec;
  path = [];
  draw(spec, path) {
    this.spec = spec;
    this.path = path;
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    this.gfx.zIndex = spec.zIndex ?? 0;
    this.bodyGfx.clear();
    this.sourceMarkerGfx.clear();
    this.targetMarkerGfx.clear();
    const strokeWidth = resolveStrokeWidth(spec);
    const bodyPath = this.trimPathForMarkers(spec, path, strokeWidth);
    this.drawGeometry(this.bodyGfx, spec, bodyPath);
    this.paintSourceMarker(this.sourceMarkerGfx, spec, path, void 0, strokeWidth);
    this.paintTargetMarker(this.targetMarkerGfx, spec, path, void 0, strokeWidth);
  }
  paintInto(g, spec, path, style) {
    const bodyStrokeWidth = resolveStrokeWidth(spec, style);
    const markerStrokeWidth = resolveStrokeWidth(spec);
    const bodyPath = this.trimPathForMarkers(spec, path, markerStrokeWidth);
    this.drawGeometry(g, spec, bodyPath, style);
    if (!style?.skipMarkers) {
      this.paintMarkers(g, spec, path, style, markerStrokeWidth, bodyStrokeWidth);
    }
  }
  /**
   * Path trimmed by the source / target marker insets at the *spec* stroke
   * width — i.e. the visible body of the connector. Decorations call this
   * when they need to parameterise along the segment markers actually
   * cover. Identity when no markers are configured.
   */
  getVisiblePath(spec, path) {
    return this.trimPathForMarkers(spec, path, resolveStrokeWidth(spec));
  }
  /**
   * Toggle the body stroke without affecting markers or decoration children.
   * Body, source marker, and target marker live in three sibling Graphics
   * under `gfx`, so each can be hidden independently. The next `draw()`
   * re-strokes the body but preserves the hidden state.
   */
  setBodyVisible(visible) {
    this.bodyGfx.visible = visible;
  }
  /** Toggle just the source-endpoint marker. See `setBodyVisible`. */
  setSourceMarkerVisible(visible) {
    this.sourceMarkerGfx.visible = visible;
  }
  /** Toggle just the target-endpoint marker. See `setBodyVisible`. */
  setTargetMarkerVisible(visible) {
    this.targetMarkerGfx.visible = visible;
  }
  /**
   * Resolve source/target marker insets via each marker's
   * `ShapeCtor.markerInset` and shorten the path's start / end so the body
   * stops at the marker's back edge. Markers themselves still paint at the
   * untrimmed endpoints, so the marker tip lands exactly on the path
   * endpoint (e.g. the arrow's tip touches the target).
   */
  trimPathForMarkers(spec, path, strokeWidth) {
    if (path.length < 2) return path;
    const startInset = spec.sourceMarker ? markerInsetFor(this.host.shapeRegistry, spec.sourceMarker, strokeWidth) : 0;
    const endInset = spec.targetMarker ? markerInsetFor(this.host.shapeRegistry, spec.targetMarker, strokeWidth) : 0;
    if (startInset <= 0 && endInset <= 0) return path;
    return trimPathEnds(path, startInset, endInset);
  }
  /**
   * Paint source/target markers anchored at the path endpoints, oriented
   * along the local tangent. Looks up each marker's class via
   * `host.shapeRegistry` and dispatches to its `static paintInto`.
   *
   * Source angle is the **reversed** tangent so an arrow placed at the
   * source faces back toward it. Target angle is the forward tangent so an
   * arrow placed at the target points into it.
   *
   * When the connector style sets `tintMarkers`, markers paint with the
   * connector's color/alpha (used by glow / halo for unified silhouette
   * coverage). Otherwise markers use their own spec colors.
   */
  paintMarkers(g, spec, path, style, strokeWidth = resolveStrokeWidth(spec), haloStrokeWidth = strokeWidth) {
    this.paintSourceMarker(g, spec, path, style, strokeWidth, haloStrokeWidth);
    this.paintTargetMarker(g, spec, path, style, strokeWidth, haloStrokeWidth);
  }
  paintSourceMarker(g, spec, path, style, strokeWidth = resolveStrokeWidth(spec), haloStrokeWidth = strokeWidth) {
    if (!spec.sourceMarker || path.length < 2) return;
    const m2 = path[0];
    const last = path[path.length - 1];
    if (m2.kind !== "M" || last.kind === "M") return;
    const markerStyle = resolveMarkerStyle(style, haloStrokeWidth);
    const t = tangentAt(path, 0);
    const angleRad = Math.atan2(-t.y, -t.x);
    paintMarkerAt(
      g,
      this.host.shapeRegistry,
      spec.sourceMarker,
      { x: m2.x, y: m2.y },
      angleRad,
      markerStyle,
      strokeWidth
    );
  }
  paintTargetMarker(g, spec, path, style, strokeWidth = resolveStrokeWidth(spec), haloStrokeWidth = strokeWidth) {
    if (!spec.targetMarker || path.length < 2) return;
    const m2 = path[0];
    const last = path[path.length - 1];
    if (m2.kind !== "M" || last.kind === "M") return;
    const markerStyle = resolveMarkerStyle(style, haloStrokeWidth);
    const t = tangentAt(path, 1);
    const angleRad = Math.atan2(t.y, t.x);
    paintMarkerAt(
      g,
      this.host.shapeRegistry,
      spec.targetMarker,
      { x: last.x, y: last.y },
      angleRad,
      markerStyle,
      strokeWidth
    );
  }
};
function resolveMarkerStyle(style, haloStrokeWidth) {
  if (!style?.tintMarkers) return void 0;
  if (style.markerHalo) {
    return {
      color: style.color ?? 0,
      alpha: style.alpha,
      fill: false,
      strokeWidth: haloStrokeWidth
    };
  }
  return {
    color: style.color ?? 0,
    alpha: style.alpha,
    fill: true
  };
}
function resolveStrokeWidth(spec, style) {
  const w = style?.strokeWidth ?? spec.stroke?.width ?? 1;
  return w > 0 ? w : 1;
}
function paintMarkerAt(g, shapeRegistry, marker, anchor, angleRad, style, strokeWidth) {
  const Ctor = shapeRegistry.get(marker.kind);
  if (!Ctor || typeof Ctor.paintInto !== "function") return;
  Ctor.paintInto(g, marker, anchor, angleRad, style, strokeWidth);
}
function markerInsetFor(shapeRegistry, marker, strokeWidth) {
  const Ctor = shapeRegistry.get(marker.kind);
  if (!Ctor || typeof Ctor.markerInset !== "function") return 0;
  const inset = Ctor.markerInset(marker, strokeWidth);
  return Number.isFinite(inset) && inset > 0 ? inset : 0;
}
var Connector = class extends ConnectorBase {
  drawGeometry(g, spec, path, style) {
    if (path.length < 2) return;
    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(g, samplePath(path), {
        color: style?.color ?? spec.stroke?.color ?? 0,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
        closed: false,
        // Inherit cap / join from the spec when the override doesn't
        // specify them — decorations that only widen the stroke (glow,
        // ripple) should match the host's silhouette ends instead of
        // forcing butt/miter back on.
        cap: style?.cap ?? spec.stroke?.cap,
        join: style?.join ?? spec.stroke?.join
      });
      return;
    }
    for (const cmd of path) {
      switch (cmd.kind) {
        case "M":
          g.moveTo(cmd.x, cmd.y);
          break;
        case "L":
          g.lineTo(cmd.x, cmd.y);
          break;
        case "Q":
          g.quadraticCurveTo(cmd.cx, cmd.cy, cmd.x, cmd.y);
          break;
        case "C":
          g.bezierCurveTo(cmd.c1x, cmd.c1y, cmd.c2x, cmd.c2y, cmd.x, cmd.y);
          break;
      }
    }
    if (style?.strokeWidth !== void 0) {
      g.stroke({
        color: style.color ?? 0,
        alpha: style.alpha ?? 1,
        width: style.strokeWidth,
        cap: style.cap ?? spec.stroke?.cap,
        join: style.join ?? spec.stroke?.join
      });
      return;
    }
    const s = spec.stroke;
    const width = s?.width ?? 1;
    if (width <= 0) return;
    g.stroke({
      color: s?.color ?? 0,
      alpha: s?.alpha ?? 1,
      width,
      cap: s?.cap,
      join: s?.join
    });
  }
};

// src/primitives/connectors/ArrowMarker.ts
var DEFAULT_LENGTH_SCALE = 4;
var DEFAULT_WIDTH_SCALE = 3;
function arrowMarkerSpec(spec = {}) {
  return { kind: "arrow", ...spec };
}
function resolveLength(spec, strokeWidth) {
  return (spec.lengthScale ?? DEFAULT_LENGTH_SCALE) * strokeWidth;
}
function resolveWidth(spec, strokeWidth) {
  const raw = (spec.widthScale ?? DEFAULT_WIDTH_SCALE) * strokeWidth;
  return raw < strokeWidth ? strokeWidth : raw;
}
var ArrowMarker = class _ArrowMarker extends ShapeBase {
  static kind = "arrow";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    _ArrowMarker.paintInto(g, spec, { x: 0, y: 0 }, 0, style, 1);
  }
  bounds() {
    const len = resolveLength(this.spec, 1);
    const wid = resolveWidth(this.spec, 1);
    return { x: -len, y: -wid / 2, width: len, height: wid };
  }
  /**
   * Distance from the arrow tip back to the base along the negative tangent.
   * The connector trims its body by this amount so the line stops at the
   * marker's base — the marker triangle then visually starts where the line
   * ends and its tip reaches the original anchor (target endpoint).
   */
  static markerInset(spec, strokeWidth = 1) {
    return resolveLength(spec, strokeWidth);
  }
  static paintInto(g, spec, anchor, angleRad, style, strokeWidth = 1) {
    const len = resolveLength(spec, strokeWidth);
    const wid = resolveWidth(spec, strokeWidth);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const baseX = anchor.x - cos * len;
    const baseY = anchor.y - sin * len;
    const perpX = -sin;
    const perpY = cos;
    const halfW = wid / 2;
    g.poly([
      anchor.x,
      anchor.y,
      // tip
      baseX + perpX * halfW,
      baseY + perpY * halfW,
      // wing 1
      baseX - perpX * halfW,
      baseY - perpY * halfW
      // wing 2
    ]);
    finishMarkerPaint(g, spec.fill, style);
  }
};

// src/primitives/connectors/DiamondMarker.ts
var DEFAULT_LENGTH_SCALE2 = 4;
var DEFAULT_WIDTH_SCALE2 = 2.6;
function diamondMarkerSpec(spec = {}) {
  return { kind: "diamond", ...spec };
}
function resolveLength2(spec, strokeWidth) {
  return (spec.lengthScale ?? DEFAULT_LENGTH_SCALE2) * strokeWidth;
}
function resolveWidth2(spec, strokeWidth) {
  const raw = (spec.widthScale ?? DEFAULT_WIDTH_SCALE2) * strokeWidth;
  return raw < strokeWidth ? strokeWidth : raw;
}
var DiamondMarker = class _DiamondMarker extends ShapeBase {
  static kind = "diamond";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    _DiamondMarker.paintInto(g, spec, { x: 0, y: 0 }, 0, style, 1);
  }
  bounds() {
    const len = resolveLength2(this.spec, 1);
    const wid = resolveWidth2(this.spec, 1);
    return { x: -len, y: -wid / 2, width: len, height: wid };
  }
  /**
   * Distance from the forward vertex back to the tail along the negative
   * tangent. The connector trims its body by this much so the line meets the
   * diamond's tail rather than running under it.
   */
  static markerInset(spec, strokeWidth = 1) {
    return resolveLength2(spec, strokeWidth);
  }
  static paintInto(g, spec, anchor, angleRad, style, strokeWidth = 1) {
    const len = resolveLength2(spec, strokeWidth);
    const wid = resolveWidth2(spec, strokeWidth);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const midX = anchor.x - cos * (len / 2);
    const midY = anchor.y - sin * (len / 2);
    const tailX = anchor.x - cos * len;
    const tailY = anchor.y - sin * len;
    const perpX = -sin;
    const perpY = cos;
    const halfW = wid / 2;
    g.poly([
      anchor.x,
      anchor.y,
      // forward vertex
      midX + perpX * halfW,
      midY + perpY * halfW,
      // side 1
      tailX,
      tailY,
      // tail vertex
      midX - perpX * halfW,
      midY - perpY * halfW
      // side 2
    ]);
    finishMarkerPaint(g, spec.fill, style);
  }
};

// src/primitives/connectors/DotMarker.ts
var DEFAULT_LENGTH_SCALE3 = 3.2;
function dotMarkerSpec(spec = {}) {
  return { kind: "dot", ...spec };
}
function resolveDiameter(spec, strokeWidth) {
  const raw = (spec.lengthScale ?? DEFAULT_LENGTH_SCALE3) * strokeWidth;
  return raw < strokeWidth ? strokeWidth : raw;
}
var DotMarker = class _DotMarker extends ShapeBase {
  static kind = "dot";
  constructor(spec, host) {
    super(host);
    this.draw(spec);
  }
  drawGeometry(g, spec, style) {
    _DotMarker.paintInto(g, spec, { x: 0, y: 0 }, 0, style, 1);
  }
  bounds() {
    const d2 = resolveDiameter(this.spec, 1);
    return { x: -d2, y: -d2 / 2, width: d2, height: d2 };
  }
  /**
   * The circle's diameter — the connector trims its body by this much so the
   * line stops at the dot's trailing edge instead of crossing it.
   */
  static markerInset(spec, strokeWidth = 1) {
    return resolveDiameter(spec, strokeWidth);
  }
  static paintInto(g, spec, anchor, angleRad, style, strokeWidth = 1) {
    const d2 = resolveDiameter(spec, strokeWidth);
    const r = d2 / 2;
    const cx = anchor.x - Math.cos(angleRad) * r;
    const cy = anchor.y - Math.sin(angleRad) * r;
    g.circle(cx, cy, r);
    finishMarkerPaint(g, spec.fill, style);
  }
};

// src/primitives/base/ShapeDecorationBase.ts
var ShapeDecorationBase = class extends PrimitiveBase {
  style;
  host = null;
  constructor(style) {
    super();
    this.style = style;
    this.gfx.label = "deco";
  }
  mount(host) {
    this.host = host;
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.repaint();
  }
  update(host) {
    this.host = host;
    this.repaint();
  }
};

// src/primitives/decorations/shape/GlowDecoration.ts
var GlowDecoration = class extends ShapeDecorationBase {
  layerGfx = [];
  pulseElapsed = 0;
  repaint() {
    const host = this.host;
    if (!host) return;
    const maxStroke = this.style.strokeWidth ?? 12;
    const layers = Math.max(1, this.style.layers ?? 6);
    const innerAlpha = this.style.innerAlpha ?? 0.55;
    const color = this.style.color;
    this.syncLayerCount(layers);
    const shape = host.shape;
    if (!shape.paintInto) {
      for (const g of this.layerGfx) g.clear();
      return;
    }
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1 || 1);
      const strokeWidth = maxStroke * (1 - t) + 1;
      const alpha = innerAlpha * (t * t);
      const g = this.layerGfx[i];
      g.clear();
      shape.paintInto(g, { color, alpha, strokeWidth, fill: false });
    }
  }
  /**
   * Advance the optional pulse phase. Geometry is repainted once at mount
   * (cheap) and never again — only `this.gfx.alpha` is touched per frame,
   * so animated pulse is essentially free.
   */
  tick(deltaMs) {
    if (!this.style.pulse) return false;
    this.pulseElapsed += deltaMs;
    const period = this.style.pulse.periodMs ?? 1200;
    const amplitude = this.style.pulse.amplitude ?? 0.5;
    const phase = this.pulseElapsed / period * Math.PI * 2;
    this.gfx.alpha = 1 - amplitude * (0.5 - 0.5 * Math.sin(phase));
    return true;
  }
  /**
   * Outer edge of the halo — the widest stroke layer paints at roughly
   * `strokeWidth` past the silhouette (`paintInto` defaults to `'outside'`
   * alignment, so the full stroke sits outward). Reported so
   * `LabelDecoration` can push outside-placement labels past the glow.
   * The optional `pulse` only modulates alpha, not geometry, so the
   * resting extent is the only one worth reporting.
   */
  getOuterExtent() {
    return this.style.strokeWidth ?? 12;
  }
  syncLayerCount(n) {
    while (this.layerGfx.length < n) {
      const g = new Graphics();
      g.label = `glow:ring-${this.layerGfx.length}`;
      this.gfx.addChild(g);
      this.layerGfx.push(g);
    }
    while (this.layerGfx.length > n) {
      this.layerGfx.pop().destroy();
    }
  }
};
var PulseRingDecoration = class extends ShapeDecorationBase {
  ringGfx = [];
  elapsed = 0;
  repaint() {
    const rings = Math.max(1, this.style.rings ?? 2);
    this.syncRingCount(rings);
  }
  tick(deltaMs) {
    const host = this.host;
    if (!host || !host.shape.paintInto) return true;
    this.elapsed += deltaMs;
    const period = this.style.periodMs ?? 1400;
    const maxRadius = this.style.maxRadius ?? 24;
    const rings = Math.max(1, this.style.rings ?? 2);
    const strokeWidth = this.style.strokeWidth ?? 2;
    const innerAlpha = this.style.innerAlpha ?? 0.7;
    const color = this.style.color;
    for (let i = 0; i < rings; i++) {
      const phase = (this.elapsed / period + i / rings) % 1;
      const radius = maxRadius * phase;
      const alpha = innerAlpha * (1 - phase);
      const g = this.ringGfx[i];
      g.clear();
      host.shape.paintInto(g, {
        color,
        alpha,
        strokeWidth,
        fill: false,
        inset: -radius
      });
    }
    return true;
  }
  syncRingCount(n) {
    while (this.ringGfx.length < n) {
      const g = new Graphics();
      g.label = `pulse:ring-${this.ringGfx.length}`;
      this.gfx.addChild(g);
      this.ringGfx.push(g);
    }
    while (this.ringGfx.length > n) {
      this.ringGfx.pop().destroy();
    }
  }
};
var LiquidFillDecoration = class extends ShapeDecorationBase {
  maskGfx = null;
  fluidContainer = null;
  fluidGfx = null;
  highlightGfx = null;
  gradient = null;
  wavePhase = 0;
  repaint() {
    const host = this.host;
    if (!host || !host.shape.paintInto) return;
    if (!this.maskGfx) {
      this.maskGfx = new Graphics();
      this.maskGfx.label = "liquid:mask";
      this.gfx.addChild(this.maskGfx);
    }
    if (!this.fluidContainer) {
      this.fluidContainer = new Container();
      this.fluidContainer.label = "liquid:fluid";
      this.gfx.addChild(this.fluidContainer);
    }
    if (!this.fluidGfx) {
      this.fluidGfx = new Graphics();
      this.fluidGfx.label = "liquid:wave";
      this.fluidContainer.addChild(this.fluidGfx);
    }
    if (!this.highlightGfx) {
      this.highlightGfx = new Graphics();
      this.highlightGfx.label = "liquid:highlight";
      this.fluidContainer.addChild(this.highlightGfx);
    }
    this.fluidContainer.mask = this.maskGfx;
    this.maskGfx.clear();
    host.shape.paintInto(this.maskGfx, {
      color: 16777215,
      alpha: 1,
      strokeWidth: 0,
      fill: true
    });
    const colorTop = this.style.colorTop ?? 10206939;
    const colorBottom = this.style.colorBottom ?? 2968942;
    this.gradient?.destroy();
    this.gradient = new FillGradient({
      type: "linear",
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: colorTop },
        { offset: 1, color: colorBottom }
      ],
      textureSpace: "local"
    });
    this.gfx.alpha = this.style.alpha ?? 1;
    this.drawFluid();
  }
  tick(deltaMs) {
    if (!this.style.wave) {
      return false;
    }
    const period = this.style.wave.periodMs ?? 1800;
    this.wavePhase += deltaMs / period * Math.PI * 2;
    this.drawFluid();
    return true;
  }
  destroy() {
    this.gradient?.destroy();
    this.gradient = null;
    super.destroy();
  }
  drawFluid() {
    const host = this.host;
    const fluid = this.fluidGfx;
    const highlight = this.highlightGfx;
    const gradient = this.gradient;
    if (!host || !fluid || !highlight || !gradient) return;
    const bounds = host.bounds;
    const fillLevel = Math.min(1, Math.max(0, this.style.fillLevel ?? 0.6));
    const wave = this.style.wave;
    const surfaceY = bounds.y + bounds.height * (1 - fillLevel);
    const left = bounds.x;
    const right = bounds.x + bounds.width;
    const bottom = bounds.y + bounds.height;
    const width = right - left;
    const surfacePts = [];
    if (wave) {
      const amplitude = wave.amplitude ?? 3;
      const wavelength = Math.max(1, wave.wavelength ?? 80);
      const resolution = Math.max(2, wave.resolution ?? 12);
      const samples = Math.max(4, Math.ceil(width / wavelength * resolution));
      for (let i = 0; i <= samples; i++) {
        const x2 = left + width * i / samples;
        const y2 = surfaceY + Math.sin(x2 / wavelength * Math.PI * 2 + this.wavePhase) * amplitude;
        surfacePts.push({ x: x2, y: y2 });
      }
    } else {
      surfacePts.push({ x: left, y: surfaceY }, { x: right, y: surfaceY });
    }
    fluid.clear();
    fluid.moveTo(left, bottom);
    fluid.lineTo(surfacePts[0].x, surfacePts[0].y);
    for (let i = 1; i < surfacePts.length; i++) {
      fluid.lineTo(surfacePts[i].x, surfacePts[i].y);
    }
    fluid.lineTo(right, bottom);
    fluid.closePath();
    fluid.fill(gradient);
    highlight.clear();
    const hl = this.style.surfaceHighlight;
    if (hl) {
      const color = hl.color ?? 16777215;
      const alpha = hl.alpha ?? 0.35;
      const width2 = hl.thickness ?? 3;
      highlight.moveTo(surfacePts[0].x, surfacePts[0].y);
      for (let i = 1; i < surfacePts.length; i++) {
        highlight.lineTo(surfacePts[i].x, surfacePts[i].y);
      }
      highlight.stroke({ color, alpha, width: width2 });
    }
  }
};
var MarchingAntsDecoration = class extends ShapeDecorationBase {
  antsGfx = new Graphics();
  elapsedMs = 0;
  constructor(style) {
    super(style);
    this.antsGfx.label = "ants:path";
  }
  repaint() {
    if (this.antsGfx.parent !== this.gfx) {
      this.gfx.addChild(this.antsGfx);
    }
  }
  tick(deltaMs) {
    const host = this.host;
    if (!host?.shape.paintInto) {
      this.antsGfx.clear();
      return true;
    }
    this.elapsedMs += deltaMs;
    const speed = this.style.speedPxPerSec ?? 24;
    const dashLen = Math.max(0.5, this.style.dashLength ?? 6);
    const gapLen = Math.max(0.5, this.style.gapLength ?? 4);
    const dashOffset = -(this.elapsedMs / 1e3) * speed;
    this.antsGfx.clear();
    host.shape.paintInto(this.antsGfx, {
      color: this.style.color,
      alpha: this.style.alpha ?? 1,
      strokeWidth: this.style.strokeWidth ?? 1.5,
      fill: false,
      dashArray: [dashLen, gapLen],
      dashOffset,
      inset: this.style.inset ?? 0
    });
    return true;
  }
};
var RingDecoration = class extends ShapeDecorationBase {
  band = new Graphics();
  constructor(style) {
    super(style);
    this.band.label = "ring:band";
    this.gfx.addChild(this.band);
  }
  repaint() {
    const host = this.host;
    if (!host) return;
    const width = this.style.width ?? 2;
    const gap = this.style.gap ?? 4;
    const alpha = this.style.alpha ?? 1;
    const color = this.style.color;
    const dashArray = this.style.dashArray;
    this.band.clear();
    const shape = host.shape;
    if (!shape.paintInto) {
      return;
    }
    shape.paintInto(this.band, {
      color,
      alpha,
      strokeWidth: width,
      alignment: "outside",
      fill: false,
      inset: -gap,
      ...dashArray ? { dashArray } : {}
    });
  }
  /**
   * Outer edge of the band: `gap` pushes the silhouette outward, then the
   * full stroke width sits past that. Reported so `LabelDecoration` can
   * offset outside-placement labels past the ring.
   */
  getOuterExtent() {
    const width = this.style.width ?? 2;
    const gap = this.style.gap ?? 4;
    return gap + width;
  }
};

// src/primitives/base/ConnectorDecorationBase.ts
var ConnectorDecorationBase = class extends PrimitiveBase {
  style;
  host = null;
  constructor(style) {
    super();
    this.style = style;
    this.gfx.label = "deco";
  }
  mount(host) {
    this.host = host;
    this.gfx.zIndex = host.slotZIndex;
    host.surface.addChild(this.gfx);
    this.repaint();
  }
  update(host) {
    this.host = host;
    this.repaint();
  }
};

// src/primitives/decorations/connector/MarchingAntsConnectorDecoration.ts
var MarchingAntsConnectorDecoration = class extends ConnectorDecorationBase {
  antsGfx = new Graphics();
  elapsedMs = 0;
  constructor(style) {
    super(style);
    this.antsGfx.label = "ants:path";
  }
  repaint() {
    if (this.antsGfx.parent !== this.gfx) {
      this.gfx.addChild(this.antsGfx);
    }
  }
  tick(deltaMs) {
    const host = this.host;
    if (!host) {
      this.antsGfx.clear();
      return true;
    }
    this.elapsedMs += deltaMs;
    const speed = this.style.speedPxPerSec ?? 24;
    const dashLen = Math.max(0.5, this.style.dashLength ?? 6);
    const gapLen = Math.max(0.5, this.style.gapLength ?? 4);
    const dashOffset = -(this.elapsedMs / 1e3) * speed;
    this.antsGfx.clear();
    host.connector.paintInto(this.antsGfx, host.connectorSpec, host.path, {
      color: this.style.color,
      alpha: this.style.alpha ?? 1,
      strokeWidth: this.style.strokeWidth ?? 1.5,
      dashArray: [dashLen, gapLen],
      dashOffset,
      cap: this.style.cap,
      join: this.style.join
    });
    return true;
  }
};
var FlyMarkerConnectorDecoration = class extends ConnectorDecorationBase {
  markerGfx = new Graphics();
  elapsedMs = 0;
  constructor(style) {
    super(style);
    this.markerGfx.label = "fly:marker";
  }
  /** Densified polyline of the current host path. */
  samples = [];
  /** Cumulative arc-length at each sample. `cumLen[i]` = distance from samples[0] to samples[i]. */
  cumLen = [];
  /** Total arc length of the sampled polyline. */
  totalLen = 0;
  repaint() {
    if (this.markerGfx.parent !== this.gfx) {
      this.gfx.addChild(this.markerGfx);
    }
    this.gfx.alpha = this.style.alpha ?? 1;
    const host = this.host;
    if (!host) {
      this.markerGfx.clear();
      this.samples = [];
      this.cumLen = [];
      this.totalLen = 0;
      return;
    }
    this.rebuildArcTable(host.path);
    this.drawMarkerSilhouette();
  }
  tick(deltaMs) {
    if (!this.host || this.totalLen <= 0) return true;
    this.elapsedMs += deltaMs;
    const speed = this.style.speedPxPerSec ?? 80;
    const phase = clamp01(this.style.phase ?? 0);
    const loop = this.style.loop ?? true;
    let dist = phase * this.totalLen + this.elapsedMs / 1e3 * speed;
    if (loop) {
      dist = (dist % this.totalLen + this.totalLen) % this.totalLen;
    } else if (dist < 0) {
      dist = 0;
    } else if (dist > this.totalLen) {
      dist = this.totalLen;
    }
    const { x: x2, y: y2, tx, ty } = this.sampleAt(dist);
    this.markerGfx.position.set(x2, y2);
    const orientToPath = this.style.orientToPath ?? (this.style.markerKind ?? "circle") === "arrow";
    this.markerGfx.rotation = orientToPath ? Math.atan2(ty, tx) : 0;
    return true;
  }
  rebuildArcTable(path) {
    const samples = samplePath(path);
    this.samples = samples;
    const cum = new Array(samples.length);
    let total = 0;
    if (samples.length > 0) {
      cum[0] = 0;
      for (let i = 1; i < samples.length; i++) {
        const a = samples[i - 1];
        const b2 = samples[i];
        total += Math.hypot(b2.x - a.x, b2.y - a.y);
        cum[i] = total;
      }
    }
    this.cumLen = cum;
    this.totalLen = total;
  }
  /** Position + unit tangent at arc-length `dist` along the sampled polyline. */
  sampleAt(dist) {
    const n = this.samples.length;
    if (n === 0) return { x: 0, y: 0, tx: 1, ty: 0 };
    if (n === 1) return { x: this.samples[0].x, y: this.samples[0].y, tx: 1, ty: 0 };
    const last = this.samples[n - 1];
    if (dist >= this.totalLen) {
      const prev = this.samples[n - 2];
      const dx2 = last.x - prev.x;
      const dy2 = last.y - prev.y;
      const len = Math.hypot(dx2, dy2) || 1;
      return { x: last.x, y: last.y, tx: dx2 / len, ty: dy2 / len };
    }
    let lo = 0;
    let hi = n - 1;
    while (lo < hi - 1) {
      const mid = lo + hi >>> 1;
      if (this.cumLen[mid] <= dist) lo = mid;
      else hi = mid;
    }
    const a = this.samples[lo];
    const b2 = this.samples[lo + 1];
    const segStart = this.cumLen[lo];
    const segEnd = this.cumLen[lo + 1];
    const segLen = segEnd - segStart;
    const u2 = segLen > 0 ? (dist - segStart) / segLen : 0;
    const dx = b2.x - a.x;
    const dy = b2.y - a.y;
    const tLen = Math.hypot(dx, dy) || 1;
    return {
      x: a.x + dx * u2,
      y: a.y + dy * u2,
      tx: dx / tLen,
      ty: dy / tLen
    };
  }
  drawMarkerSilhouette() {
    const g = this.markerGfx;
    g.clear();
    const color = this.style.color;
    const size = Math.max(1, this.style.size ?? 8);
    const kind = this.style.markerKind ?? "circle";
    switch (kind) {
      case "circle": {
        g.circle(0, 0, size / 2).fill({ color });
        break;
      }
      case "square": {
        const h = size / 2;
        g.rect(-h, -h, size, size).fill({ color });
        break;
      }
      case "arrow": {
        const tip = size / 2;
        const base = -size / 2;
        const half = size / 2;
        g.poly([tip, 0, base, -half, base, half]).fill({ color });
        break;
      }
    }
  }
};
function clamp01(v2) {
  if (v2 < 0) return 0;
  if (v2 > 1) return 1;
  return v2;
}
var FlowParticlesConnectorDecoration = class extends ConnectorDecorationBase {
  particles = [];
  elapsedMs = 0;
  samples = [];
  cumLen = [];
  totalLen = 0;
  repaint() {
    this.gfx.alpha = this.style.alpha ?? 1;
    const host = this.host;
    if (!host) {
      for (const p of this.particles) p.clear();
      this.samples = [];
      this.cumLen = [];
      this.totalLen = 0;
      return;
    }
    this.rebuildArcTable(host.path);
    this.syncParticleCount();
    this.drawSilhouetteIntoEach();
  }
  tick(deltaMs) {
    if (!this.host || this.totalLen <= 0 || this.particles.length === 0) return true;
    this.elapsedMs += deltaMs;
    const speed = this.style.speedPxPerSec ?? 60;
    const basePhase = clamp012(this.style.phase ?? 0);
    const loop = this.style.loop ?? true;
    const total = this.totalLen;
    const count = this.particles.length;
    const orientToPath = this.style.orientToPath ?? (this.style.markerKind ?? "circle") === "arrow";
    const travel = this.elapsedMs / 1e3 * speed;
    for (let i = 0; i < count; i++) {
      const particlePhase = basePhase + i / count;
      let dist = particlePhase * total + travel;
      if (loop) {
        dist = (dist % total + total) % total;
      } else if (dist < 0) {
        dist = 0;
      } else if (dist > total) {
        dist = total;
      }
      const { x: x2, y: y2, tx, ty } = this.sampleAt(dist);
      const g = this.particles[i];
      g.position.set(x2, y2);
      g.rotation = orientToPath ? Math.atan2(ty, tx) : 0;
    }
    return true;
  }
  syncParticleCount() {
    const target = Math.max(1, Math.floor(this.style.count ?? 5));
    while (this.particles.length < target) {
      const g = new Graphics();
      g.label = `flow:particle-${this.particles.length}`;
      this.gfx.addChild(g);
      this.particles.push(g);
    }
    while (this.particles.length > target) {
      const g = this.particles.pop();
      g.destroy();
    }
  }
  drawSilhouetteIntoEach() {
    const color = this.style.color;
    const size = Math.max(1, this.style.size ?? 6);
    const kind = this.style.markerKind ?? "circle";
    for (const g of this.particles) {
      g.clear();
      switch (kind) {
        case "circle": {
          g.circle(0, 0, size / 2).fill({ color });
          break;
        }
        case "square": {
          const h = size / 2;
          g.rect(-h, -h, size, size).fill({ color });
          break;
        }
        case "arrow": {
          const tip = size / 2;
          const base = -size / 2;
          const half = size / 2;
          g.poly([tip, 0, base, -half, base, half]).fill({ color });
          break;
        }
      }
    }
  }
  rebuildArcTable(path) {
    const samples = samplePath(path);
    this.samples = samples;
    const cum = new Array(samples.length);
    let total = 0;
    if (samples.length > 0) {
      cum[0] = 0;
      for (let i = 1; i < samples.length; i++) {
        const a = samples[i - 1];
        const b2 = samples[i];
        total += Math.hypot(b2.x - a.x, b2.y - a.y);
        cum[i] = total;
      }
    }
    this.cumLen = cum;
    this.totalLen = total;
  }
  sampleAt(dist) {
    const n = this.samples.length;
    if (n === 0) return { x: 0, y: 0, tx: 1, ty: 0 };
    if (n === 1) return { x: this.samples[0].x, y: this.samples[0].y, tx: 1, ty: 0 };
    const last = this.samples[n - 1];
    if (dist >= this.totalLen) {
      const prev = this.samples[n - 2];
      const dx2 = last.x - prev.x;
      const dy2 = last.y - prev.y;
      const len = Math.hypot(dx2, dy2) || 1;
      return { x: last.x, y: last.y, tx: dx2 / len, ty: dy2 / len };
    }
    let lo = 0;
    let hi = n - 1;
    while (lo < hi - 1) {
      const mid = lo + hi >>> 1;
      if (this.cumLen[mid] <= dist) lo = mid;
      else hi = mid;
    }
    const a = this.samples[lo];
    const b2 = this.samples[lo + 1];
    const segStart = this.cumLen[lo];
    const segEnd = this.cumLen[lo + 1];
    const segLen = segEnd - segStart;
    const u2 = segLen > 0 ? (dist - segStart) / segLen : 0;
    const dx = b2.x - a.x;
    const dy = b2.y - a.y;
    const tLen = Math.hypot(dx, dy) || 1;
    return {
      x: a.x + dx * u2,
      y: a.y + dy * u2,
      tx: dx / tLen,
      ty: dy / tLen
    };
  }
};
function clamp012(v2) {
  if (v2 < 0) return 0;
  if (v2 > 1) return 1;
  return v2;
}
var GlowConnectorDecoration = class extends ConnectorDecorationBase {
  layerGfx = [];
  pulseElapsed = 0;
  /**
   * Halo extends `radius` px past each path endpoint (the outermost layer's
   * stroke is centered on the path and `radius` wide). Returning that as
   * end-padding asks the renderer to inset both ends by `radius` — so the
   * halo's outer edge lands at the anchor instead of overshooting.
   */
  getEndPadding() {
    const radius = this.style.radius ?? 12;
    return { source: radius, target: radius };
  }
  repaint() {
    const host = this.host;
    if (!host) return;
    const radius = this.style.radius ?? 12;
    const layers = Math.max(1, this.style.layers ?? 6);
    const innerAlpha = this.style.innerAlpha ?? 0.55;
    const color = this.style.color;
    this.syncLayerCount(layers);
    for (let i = 0; i < layers; i++) {
      const t = i / (layers - 1 || 1);
      const strokeWidth = radius * (1 - t) + 1;
      const alpha = innerAlpha * (t * t);
      const g = this.layerGfx[i];
      g.clear();
      host.connector.paintInto(g, host.connectorSpec, host.path, {
        color,
        alpha,
        strokeWidth,
        // Halo the markers too: outline (don't fill) at this layer's width
        // and alpha. Marker geometry stays at host-stroke size; only the
        // outline thickness grows. The host paints its own filled marker on
        // top, so the visible result is "filled arrow inside a soft halo".
        tintMarkers: true,
        markerHalo: true
      });
    }
  }
  tick(deltaMs) {
    if (!this.style.pulse) return false;
    this.pulseElapsed += deltaMs;
    const period = this.style.pulse.periodMs ?? 1200;
    const amplitude = this.style.pulse.amplitude ?? 0.5;
    const phase = this.pulseElapsed / period * Math.PI * 2;
    this.gfx.alpha = 1 - amplitude * (0.5 - 0.5 * Math.sin(phase));
    return true;
  }
  syncLayerCount(n) {
    while (this.layerGfx.length < n) {
      const g = new Graphics();
      g.label = `glow:ring-${this.layerGfx.length}`;
      this.gfx.addChild(g);
      this.layerGfx.push(g);
    }
    while (this.layerGfx.length > n) {
      this.layerGfx.pop().destroy();
    }
  }
};
var RippleConnectorDecoration = class extends ConnectorDecorationBase {
  ringGfx = [];
  elapsed = 0;
  /**
   * The peak wave extends `maxRadius` px past each path endpoint (the
   * widest ring's stroke is `2 × maxRadius` centered on the path). Asking
   * the renderer to inset both ends by `maxRadius` makes the peak wave's
   * outer edge land at the anchor — the body / markers sit back from the
   * anchor by `maxRadius` so they're enveloped as each wave grows.
   */
  getEndPadding() {
    const r = this.style.maxRadius ?? 16;
    return { source: r, target: r };
  }
  repaint() {
    const rings = Math.max(1, this.style.rings ?? 2);
    this.syncRingCount(rings);
  }
  tick(deltaMs) {
    const host = this.host;
    if (!host) return true;
    this.elapsed += deltaMs;
    const period = this.style.periodMs ?? 1400;
    const maxRadius = this.style.maxRadius ?? 16;
    const rings = Math.max(1, this.style.rings ?? 2);
    const innerAlpha = this.style.innerAlpha ?? 0.7;
    const color = this.style.color;
    for (let i = 0; i < rings; i++) {
      const phase = (this.elapsed / period + i / rings) % 1;
      const radius = maxRadius * phase;
      const alpha = innerAlpha * (1 - phase);
      const g = this.ringGfx[i];
      g.clear();
      if (radius <= 0 || alpha <= 0) continue;
      host.connector.paintInto(g, host.connectorSpec, host.path, {
        color,
        alpha,
        strokeWidth: 2 * radius,
        tintMarkers: true,
        markerHalo: true
      });
    }
    return true;
  }
  syncRingCount(n) {
    while (this.ringGfx.length < n) {
      const g = new Graphics();
      g.label = `ripple:ring-${this.ringGfx.length}`;
      this.gfx.addChild(g);
      this.ringGfx.push(g);
    }
    while (this.ringGfx.length > n) {
      this.ringGfx.pop().destroy();
    }
  }
};
var RevealConnectorDecoration = class extends ConnectorDecorationBase {
  revealGfx = new Graphics();
  tween = null;
  remainingDelayMs;
  finished = false;
  hostHiddenByUs = false;
  /** Densified polyline of the host path, oriented per `direction`. */
  samples = [];
  /** Cumulative arc length at each sample. */
  cumLen = [];
  /** Total arc length. */
  totalLen = 0;
  constructor(style) {
    super(style);
    this.revealGfx.label = "reveal:mask";
    this.remainingDelayMs = Math.max(0, style.delayMs ?? 0);
  }
  repaint() {
    if (this.revealGfx.parent !== this.gfx) {
      this.gfx.addChild(this.revealGfx);
    }
    const host = this.host;
    if (!host) {
      this.revealGfx.clear();
      this.samples = [];
      this.cumLen = [];
      this.totalLen = 0;
      return;
    }
    this.rebuildArcTable(host.path, this.style.direction ?? "source-to-target");
    if (!this.tween) {
      this.tween = new Tween({
        from: 0,
        to: 1,
        duration: Math.max(1, this.style.durationMs ?? 2e3),
        easing: resolveEasing(this.style.easing),
        repeat: resolveRepeat(this.style.repeat)
      });
    }
    if ((this.style.hostStroke ?? "hide") === "hide" && !this.finished) {
      host.connector.setBodyVisible(false);
      this.applyEndingMarkerVisibility(this.tween.value);
      this.hostHiddenByUs = true;
    }
    this.paintAt(this.tween.value);
  }
  /**
   * Show / hide the "ending" marker (the endpoint the reveal sweeps toward)
   * based on whether the line has reached it. The "starting" marker stays
   * visible at all times because the reveal originates from its endpoint.
   */
  applyEndingMarkerVisibility(progress) {
    if (!this.host) return;
    if ((this.style.hostStroke ?? "hide") !== "hide") return;
    const reached = progress >= 0.985;
    const direction = this.style.direction ?? "source-to-target";
    if (direction === "source-to-target") {
      this.host.connector.setTargetMarkerVisible(reached);
    } else {
      this.host.connector.setSourceMarkerVisible(reached);
    }
  }
  tick(deltaMs) {
    if (this.finished) return false;
    if (this.remainingDelayMs > 0) {
      this.remainingDelayMs -= deltaMs;
      this.paintAt(0);
      return true;
    }
    const tween = this.tween;
    const host = this.host;
    if (!tween || !host) return true;
    const stillAnimating = tween.tick(deltaMs);
    this.paintAt(tween.value);
    this.applyEndingMarkerVisibility(tween.value);
    if (stillAnimating) return true;
    const repeat = resolveRepeat(this.style.repeat);
    const isOneShotLike = repeat !== "forever";
    if (isOneShotLike) {
      const holdAtFull = this.style.holdAtFull ?? true;
      if (holdAtFull) {
        this.restoreHostVisibility();
        this.revealGfx.clear();
      } else {
        this.revealGfx.clear();
      }
      this.finished = true;
      return false;
    }
    return true;
  }
  destroy() {
    this.restoreHostVisibility();
    super.destroy();
  }
  restoreHostVisibility() {
    if (this.hostHiddenByUs && this.host) {
      this.host.connector.setBodyVisible(true);
      this.host.connector.setSourceMarkerVisible(true);
      this.host.connector.setTargetMarkerVisible(true);
    }
    this.hostHiddenByUs = false;
  }
  rebuildArcTable(path, direction) {
    let samples = samplePath(path);
    if (direction === "target-to-source") {
      samples = samples.slice().reverse();
    }
    this.samples = samples;
    const cum = new Array(samples.length);
    let total = 0;
    if (samples.length > 0) {
      cum[0] = 0;
      for (let i = 1; i < samples.length; i++) {
        const a = samples[i - 1];
        const b2 = samples[i];
        total += Math.hypot(b2.x - a.x, b2.y - a.y);
        cum[i] = total;
      }
    }
    this.cumLen = cum;
    this.totalLen = total;
  }
  /**
   * Paint the polyline from `samples[0]` up to arc-length `progress × totalLen`.
   * Interpolates within the last partial segment so the head doesn't snap
   * between sample indices.
   */
  paintAt(progress) {
    const g = this.revealGfx;
    g.clear();
    const host = this.host;
    if (!host) return;
    const n = this.samples.length;
    if (n < 2 || this.totalLen <= 0) return;
    const cutoff = clamp013(progress) * this.totalLen;
    if (cutoff <= 0) return;
    const first = this.samples[0];
    g.moveTo(first.x, first.y);
    if (cutoff >= this.totalLen) {
      for (let i = 1; i < n; i++) {
        const p = this.samples[i];
        g.lineTo(p.x, p.y);
      }
    } else {
      for (let i = 1; i < n; i++) {
        const len = this.cumLen[i];
        if (len < cutoff) {
          const p = this.samples[i];
          g.lineTo(p.x, p.y);
          continue;
        }
        const prevLen = this.cumLen[i - 1];
        const segLen = len - prevLen;
        const u2 = segLen > 0 ? (cutoff - prevLen) / segLen : 0;
        const a = this.samples[i - 1];
        const b2 = this.samples[i];
        g.lineTo(a.x + (b2.x - a.x) * u2, a.y + (b2.y - a.y) * u2);
        break;
      }
    }
    const s = host.connectorSpec.stroke;
    g.stroke({
      color: s?.color ?? 0,
      alpha: s?.alpha ?? 1,
      width: s?.width ?? 1,
      cap: s?.cap,
      join: s?.join
    });
  }
};
function resolveEasing(name) {
  switch (name) {
    case "easeOutCubic":
      return easeOutCubic;
    case "easeInOutCubic":
      return easeInOutCubic;
    case "easeInOutSine":
      return easeInOutSine;
    case "linear":
    default:
      return linear;
  }
}
function resolveRepeat(repeat) {
  if (repeat === true) return "forever";
  if (typeof repeat === "number" && repeat >= 1) {
    return Math.max(0, Math.floor(repeat) - 1);
  }
  return 0;
}
function clamp013(v2) {
  if (v2 < 0) return 0;
  if (v2 > 1) return 1;
  return v2;
}
var RingConnectorDecoration = class extends ConnectorDecorationBase {
  band = new Graphics();
  constructor(style) {
    super(style);
    this.band.label = "ring:band";
    this.gfx.addChild(this.band);
  }
  /**
   * The band extends `width / 2` past each path endpoint (a centered stroke
   * widens equally on both sides). Asking the renderer to inset both ends
   * by that amount keeps the halo's outer edge sitting at the anchor
   * instead of poking past it.
   */
  getEndPadding() {
    const half = (this.style.width ?? 6) / 2;
    return { source: half, target: half };
  }
  repaint() {
    const host = this.host;
    if (!host) return;
    const width = this.style.width ?? 6;
    const alpha = this.style.alpha ?? 0.6;
    const color = this.style.color;
    const dashArray = this.style.dashArray;
    this.band.clear();
    host.connector.paintInto(this.band, host.connectorSpec, host.path, {
      color,
      alpha,
      strokeWidth: width,
      tintMarkers: true,
      markerHalo: true,
      ...dashArray ? { dashArray } : {}
    });
  }
};

// src/primitives/paint/labelBackground.ts
function resolvePadding(pad) {
  if (pad === void 0) return [4, 6, 4, 6];
  if (typeof pad === "number") return [pad, pad, pad, pad];
  if (pad.length === 2) return [pad[0], pad[1], pad[0], pad[1]];
  return [pad[0], pad[1], pad[2], pad[3]];
}
function resolveRadius(r) {
  if (r === void 0) return [4, 4, 4, 4];
  if (typeof r === "number") return [r, r, r, r];
  return r;
}
function drawLabelBackground(g, bg, args) {
  g.clear();
  const padding = resolvePadding(bg.padding);
  const [pt, pr, pb, pl] = padding;
  const outerW = args.width + pl + pr;
  const outerH = args.height + pt + pb;
  const radius = resolveRadius(bg.radius);
  if (allEqual(radius)) {
    g.roundRect(-pl, -pt, outerW, outerH, radius[0]);
  } else {
    traceRoundedRect(g, -pl, -pt, outerW, outerH, radius);
  }
  if (bg.fill !== void 0) {
    g.fill({ color: bg.fill, alpha: bg.fillAlpha ?? 1 });
  }
  if (bg.stroke !== void 0) {
    g.stroke({
      color: bg.stroke,
      alpha: bg.strokeAlpha ?? 1,
      width: bg.strokeWidth ?? 1
    });
  }
  if (bg.shadow) {
    const offX = bg.shadow.offsetX ?? 1;
    const offY = bg.shadow.offsetY ?? 2;
    const alpha = bg.shadow.alpha ?? 0.25;
    g.clear();
    if (allEqual(radius)) {
      g.roundRect(-pl + offX, -pt + offY, outerW, outerH, radius[0]);
    } else {
      traceRoundedRect(g, -pl + offX, -pt + offY, outerW, outerH, radius);
    }
    g.fill({ color: bg.shadow.color, alpha });
    if (allEqual(radius)) {
      g.roundRect(-pl, -pt, outerW, outerH, radius[0]);
    } else {
      traceRoundedRect(g, -pl, -pt, outerW, outerH, radius);
    }
    if (bg.fill !== void 0) g.fill({ color: bg.fill, alpha: bg.fillAlpha ?? 1 });
    if (bg.stroke !== void 0) {
      g.stroke({
        color: bg.stroke,
        alpha: bg.strokeAlpha ?? 1,
        width: bg.strokeWidth ?? 1
      });
    }
  }
  return { width: outerW, height: outerH, padding };
}
function allEqual(r) {
  return r[0] === r[1] && r[1] === r[2] && r[2] === r[3];
}
function traceRoundedRect(g, x2, y2, w, h, r) {
  const maxR = Math.min(w, h) / 2;
  const tl = Math.min(r[0], maxR);
  const tr = Math.min(r[1], maxR);
  const br = Math.min(r[2], maxR);
  const bl = Math.min(r[3], maxR);
  g.moveTo(x2 + tl, y2);
  g.lineTo(x2 + w - tr, y2);
  g.arcTo(x2 + w, y2, x2 + w, y2 + tr, tr);
  g.lineTo(x2 + w, y2 + h - br);
  g.arcTo(x2 + w, y2 + h, x2 + w - br, y2 + h, br);
  g.lineTo(x2 + bl, y2 + h);
  g.arcTo(x2, y2 + h, x2, y2 + h - bl, bl);
  g.lineTo(x2, y2 + tl);
  g.arcTo(x2, y2, x2 + tl, y2, tl);
  g.closePath();
}

// src/primitives/decorations/shape/LabelDecoration.ts
var INSIDE_CORNER_INSET_RATIO = 0.15;
var LabelDecoration = class extends ShapeDecorationBase {
  contentView = null;
  contentLayer = null;
  bgGfx = null;
  /** Whether `gfx` is currently parented to host surface (false when LOD-hidden). */
  attached = true;
  /** Cached host surface for re-attach on LOD show. */
  hostSurface = null;
  /**
   * Cached rasterisation resolution applied to the inner text. Survives
   * `repaint()` so a renderer-level zoom-LOD push isn't lost when style
   * changes trigger a fresh `updateLabelContent`.
   */
  resolution = null;
  /**
   * Scale the renderer's label-size policy last asked for (`1` = natural).
   * Survives `repaint()` like {@link resolution}.
   */
  textScale = 1;
  /**
   * Where `repaint()` last anchored the label: the anchor point on the host and
   * the label-relative delta from it (placement alignment + style offset). The
   * delta is in label units, so {@link applyPlacement} scales it with the text
   * — that keeps an outside label's near edge on the host as it shrinks/grows.
   */
  anchorX = 0;
  anchorY = 0;
  deltaX = 0;
  deltaY = 0;
  /**
   * Pixi rasterises `Text` to a glyph texture once and re-uses it across
   * frames. The default resolution is the renderer's DPR, so when the
   * camera zooms in the texture is sampled up and labels get fuzzy.
   * Bumping `resolution` re-rasterises at higher fidelity. Idempotent
   * with the same value (Pixi short-circuits internally).
   */
  setResolution(resolution) {
    this.resolution = resolution;
    if (this.contentView) applyLabelResolution(this.contentView, resolution);
  }
  /**
   * Last-applied rasterisation resolution, or `null` if `setResolution`
   * has never been called. The renderer's viewport sweep uses this to
   * skip labels already at the target so a converged scene costs nothing
   * past one bounds check per label per frame.
   */
  getResolution() {
    return this.resolution;
  }
  /** Authored font size of the label's content — see `contentFontSize`. */
  textFontSize() {
    return contentFontSize(this.style.content);
  }
  /**
   * `true` for `inside-*` placements, whose fit-to-box contract a label-size
   * policy may only shrink within, never grow past.
   */
  isContained() {
    return isInsidePlacement(this.style.placement ?? "bottom");
  }
  /**
   * Draw the label at `scale` × its natural size (the renderer's label-size
   * policy), re-anchored so it stays attached to its host. Idempotent.
   */
  setTextScale(scale) {
    if (!(scale > 0) || scale === this.textScale) return;
    this.textScale = scale;
    this.applyPlacement();
  }
  /** Write the anchored position and the text scale onto `gfx`. */
  applyPlacement() {
    const s = this.textScale;
    this.gfx.scale.set(s, s);
    this.gfx.position.set(this.anchorX + s * this.deltaX, this.anchorY + s * this.deltaY);
  }
  repaint() {
    const host = this.host;
    if (!host) return;
    this.hostSurface = host.surface;
    if (!this.contentLayer) {
      this.contentLayer = new Container();
      this.contentLayer.label = "label:content";
      this.gfx.addChild(this.contentLayer);
    }
    if (this.style.background && !this.bgGfx) {
      this.bgGfx = new Graphics();
      this.bgGfx.label = "label:bg";
      this.contentLayer.addChildAt(this.bgGfx, 0);
    } else if (!this.style.background && this.bgGfx) {
      this.bgGfx.destroy();
      this.bgGfx = null;
    }
    if (!this.contentView) {
      this.contentView = mountLabelContent(this.style.content, this.style.wrap);
      this.contentLayer.addChild(this.contentView.display);
    } else {
      const next = updateLabelContent(this.contentView, this.style.content, this.style.wrap);
      if (next !== this.contentView) {
        this.contentLayer.addChild(next.display);
        this.contentView = next;
      }
    }
    if (this.resolution !== null) applyLabelResolution(this.contentView, this.resolution);
    const placement = this.style.placement ?? "bottom";
    const anchorOverride = host.shape.labelAnchorBox?.(placement);
    const placementBox = anchorOverride ?? host.bounds;
    let hidden = false;
    if (isInsidePlacement(placement)) {
      const box = innerBoxFor(placement, placementBox);
      const minFontSize = this.style.minFontSize ?? 9;
      const result = fitInsideBox(this.contentView, this.style.content, this.style.wrap, box, minFontSize);
      hidden = result.hidden;
    }
    const textW = this.contentView.display.width;
    const textH = this.contentView.display.height;
    let outerW = textW;
    let outerH = textH;
    if (this.style.background && this.bgGfx) {
      const result = drawLabelBackground(this.bgGfx, this.style.background, {
        width: textW,
        height: textH
      });
      outerW = result.width;
      outerH = result.height;
      this.bgGfx.position.set(-textW / 2, -textH / 2);
    }
    this.contentView.display.position.set(-textW / 2, -textH / 2);
    const offsetX = this.style.offset?.x ?? 0;
    const offsetY = this.style.offset?.y ?? 0;
    const visualCenter = anchorOverride === void 0 && (placement === "center" || placement === "inside-center") && host.shape.visualCenter ? host.shape.visualCenter() : void 0;
    const anchorBounds = host.outerDecorationExtent > 0 && isOutsidePlacement(placement) ? inflateRect(placementBox, host.outerDecorationExtent) : placementBox;
    const { ax, ay, alignDx, alignDy } = anchorAndAlign(
      anchorBounds,
      placement,
      outerW,
      outerH,
      visualCenter
    );
    this.anchorX = ax;
    this.anchorY = ay;
    this.deltaX = alignDx + offsetX;
    this.deltaY = alignDy + offsetY;
    this.applyPlacement();
    this.gfx.rotation = this.style.rotation ?? 0;
    this.gfx.alpha = hidden ? 0 : this.style.alpha ?? 1;
    this.gfx.cursor = this.style.cursor ?? "default";
    this.gfx.eventMode = this.style.interactive ? "static" : "none";
  }
  /**
   * Per-frame check for LOD — when the camera-zoom (effective world scale)
   * leaves the `visibility` range, detach `gfx` from the surface so Pixi
   * skips it entirely. Re-attach when zoom re-enters the range.
   *
   * Without `visibility` set this hook is a no-op and the renderer never
   * registers it as animated (we return `false`).
   */
  tick(_deltaMs) {
    const v2 = this.style.visibility;
    if (!v2 || v2.minZoom === void 0 && v2.maxZoom === void 0) return false;
    const z2 = zoomAboveHost(this.hostSurface);
    const shouldShow = (v2.minZoom === void 0 || z2 >= v2.minZoom) && (v2.maxZoom === void 0 || z2 <= v2.maxZoom);
    if (shouldShow && !this.attached && this.hostSurface) {
      this.hostSurface.addChild(this.gfx);
      this.attached = true;
    } else if (!shouldShow && this.attached) {
      this.gfx.parent?.removeChild(this.gfx);
      this.attached = false;
    }
    return true;
  }
};
function anchorAndAlign(bounds, placement, outerW, outerH, visualCenter) {
  const cx = visualCenter ? visualCenter.x : bounds.x + bounds.width / 2;
  const cy = visualCenter ? visualCenter.y : bounds.y + bounds.height / 2;
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;
  const inside = Math.min(bounds.width, bounds.height) * INSIDE_CORNER_INSET_RATIO;
  switch (placement) {
    case "center":
      return { ax: cx, ay: cy, alignDx: 0, alignDy: 0 };
    case "top":
      return { ax: cx, ay: top, alignDx: 0, alignDy: -outerH / 2 };
    case "bottom":
      return { ax: cx, ay: bottom, alignDx: 0, alignDy: outerH / 2 };
    case "left":
      return { ax: left, ay: cy, alignDx: -outerW / 2, alignDy: 0 };
    case "right":
      return { ax: right, ay: cy, alignDx: outerW / 2, alignDy: 0 };
    case "top-left":
      return { ax: left, ay: top, alignDx: -outerW / 2, alignDy: -outerH / 2 };
    case "top-right":
      return { ax: right, ay: top, alignDx: outerW / 2, alignDy: -outerH / 2 };
    case "bottom-left":
      return { ax: left, ay: bottom, alignDx: -outerW / 2, alignDy: outerH / 2 };
    case "bottom-right":
      return { ax: right, ay: bottom, alignDx: outerW / 2, alignDy: outerH / 2 };
    case "inside-top-left":
      return { ax: left + inside, ay: top + inside, alignDx: outerW / 2, alignDy: outerH / 2 };
    case "inside-top-right":
      return { ax: right - inside, ay: top + inside, alignDx: -outerW / 2, alignDy: outerH / 2 };
    case "inside-bottom-left":
      return { ax: left + inside, ay: bottom - inside, alignDx: outerW / 2, alignDy: -outerH / 2 };
    case "inside-bottom-right":
      return { ax: right - inside, ay: bottom - inside, alignDx: -outerW / 2, alignDy: -outerH / 2 };
    case "inside-top":
      return { ax: cx, ay: top + inside, alignDx: 0, alignDy: outerH / 2 };
    case "inside-bottom":
      return { ax: cx, ay: bottom - inside, alignDx: 0, alignDy: -outerH / 2 };
    case "inside-left":
      return { ax: left + inside, ay: cy, alignDx: outerW / 2, alignDy: 0 };
    case "inside-right":
      return { ax: right - inside, ay: cy, alignDx: -outerW / 2, alignDy: 0 };
    case "inside-center":
      return { ax: cx, ay: cy, alignDx: 0, alignDy: 0 };
  }
}
function isInsidePlacement(placement) {
  return placement.startsWith("inside-");
}
function isOutsidePlacement(placement) {
  return placement === "top" || placement === "bottom" || placement === "left" || placement === "right" || placement === "top-left" || placement === "top-right" || placement === "bottom-left" || placement === "bottom-right";
}
function inflateRect(r, pad) {
  return {
    x: r.x - pad,
    y: r.y - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2
  };
}
function innerBoxFor(placement, bounds) {
  const inset = Math.min(bounds.width, bounds.height) * INSIDE_CORNER_INSET_RATIO;
  const fullW = Math.max(0, bounds.width - 2 * inset);
  const fullH = Math.max(0, bounds.height - 2 * inset);
  const halfW = Math.max(0, bounds.width / 2 - inset);
  const halfH = Math.max(0, bounds.height / 2 - inset);
  switch (placement) {
    case "inside-center":
      return { width: fullW, height: fullH };
    case "inside-top":
    case "inside-bottom":
      return { width: fullW, height: halfH };
    case "inside-left":
    case "inside-right":
      return { width: halfW, height: fullH };
    case "inside-top-left":
    case "inside-top-right":
    case "inside-bottom-left":
    case "inside-bottom-right":
      return { width: halfW, height: halfH };
    default:
      return { width: 0, height: 0 };
  }
}
var HIT_PADDING_PX = 4;
var ToggleDecoration = class extends ShapeDecorationBase {
  button = new Graphics();
  glyph = new Graphics();
  /**
   * Cached hit geometry, refreshed on every `repaint()`. Stale read between
   * a host bounds change and the next `update()` is acceptable — the
   * renderer always calls `update` after bounds change, and the resulting
   * "missed by a pixel" hit just means the user clicked an extra time.
   */
  hit = { cx: 0, cy: 0, radius: 0 };
  constructor(style) {
    super(style);
    this.button.label = "toggle:button";
    this.glyph.label = "toggle:glyph";
    this.gfx.addChild(this.button);
    this.gfx.addChild(this.glyph);
  }
  /**
   * Most-recently-computed shape-local hit geometry. Returns `{0, 0, 0}`
   * before the first `mount` / `update` — callers should still defend
   * against a zero radius as a "not laid out yet" signal.
   */
  getLocalHitGeometry() {
    return this.hit;
  }
  repaint() {
    const host = this.host;
    if (!host) return;
    const radius = this.style.radius ?? 10;
    const placement = this.style.placement ?? "bottom";
    const offsetX = this.style.position ? 0 : this.style.offsetX ?? 0;
    const offsetY = this.style.position ? 0 : this.style.offsetY ?? 0;
    const bgFill = this.style.bgFill ?? 16777215;
    const bgAlpha = this.style.bgAlpha ?? 1;
    const strokeColor = this.style.strokeColor ?? 7045119;
    const strokeWidth = this.style.strokeWidth ?? 1.5;
    const glyphColor = this.style.glyphColor ?? strokeColor;
    const glyphWidth = this.style.glyphWidth ?? 1.5;
    const state = this.style.state ?? "plus";
    const { cx, cy } = this.style.position ? { cx: this.style.position.x, cy: this.style.position.y } : anchorOnBounds(host.bounds, placement, radius);
    this.button.clear();
    this.button.circle(0, 0, radius);
    this.button.fill({ color: bgFill, alpha: bgAlpha });
    if (strokeWidth > 0) {
      this.button.stroke({ color: strokeColor, width: strokeWidth });
    }
    this.glyph.clear();
    const armLength = radius * 0.55;
    this.glyph.moveTo(-armLength, 0).lineTo(armLength, 0).stroke({ color: glyphColor, width: glyphWidth, cap: "round" });
    if (state === "plus") {
      this.glyph.moveTo(0, -armLength).lineTo(0, armLength).stroke({ color: glyphColor, width: glyphWidth, cap: "round" });
    }
    this.gfx.position.set(cx + offsetX, cy + offsetY);
    this.hit = { cx: cx + offsetX, cy: cy + offsetY, radius: radius + HIT_PADDING_PX };
  }
  /**
   * Outer-extent contribution — outside-placed toggles bulge slightly
   * past the silhouette, but the bulge is small (one radius) and only on
   * one side. Reporting it would push `LabelDecoration` outward on all
   * four sides, which looks worse than letting an outside-bottom label
   * overlap the toggle. Returning `0` keeps the label flow stable; the
   * developer can offset the label manually if both fight for the same
   * slot.
   */
  getOuterExtent() {
    return 0;
  }
};
function anchorOnBounds(bounds, placement, radius) {
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;
  const midX = bounds.x + bounds.width / 2;
  const midY = bounds.y + bounds.height / 2;
  const insidePad = radius + 4;
  switch (placement) {
    case "top":
      return { cx: midX, cy: top };
    case "bottom":
      return { cx: midX, cy: bottom };
    case "left":
      return { cx: left, cy: midY };
    case "right":
      return { cx: right, cy: midY };
    case "top-left":
      return { cx: left, cy: top };
    case "top-right":
      return { cx: right, cy: top };
    case "bottom-left":
      return { cx: left, cy: bottom };
    case "bottom-right":
      return { cx: right, cy: bottom };
    case "inside-top":
      return { cx: midX, cy: top + insidePad };
    case "inside-bottom":
      return { cx: midX, cy: bottom - insidePad };
    case "inside-left":
      return { cx: left + insidePad, cy: midY };
    case "inside-right":
      return { cx: right - insidePad, cy: midY };
  }
}
var HIT_PADDING_PX2 = 3;
var ResizeHandleDecoration = class extends ShapeDecorationBase {
  handle = new Graphics();
  hit = { cx: 0, cy: 0, half: 0, placement: "bottom-right" };
  constructor(style) {
    super(style);
    this.handle.label = "resize:handle";
    this.gfx.addChild(this.handle);
  }
  /** See {@link ToggleDecoration.getLocalHitGeometry}. */
  getLocalHitGeometry() {
    return this.hit;
  }
  repaint() {
    const host = this.host;
    if (!host) return;
    const placement = this.style.placement ?? "bottom-right";
    const size = this.style.size ?? 8;
    const bgFill = this.style.bgFill ?? 16777215;
    const bgAlpha = this.style.bgAlpha ?? 1;
    const strokeColor = this.style.strokeColor ?? 7045119;
    const strokeWidth = this.style.strokeWidth ?? 1.5;
    const visible = this.style.visible ?? true;
    const { cx, cy } = this.style.position ? { cx: this.style.position.x, cy: this.style.position.y } : handleCentre(host.bounds, placement);
    const half = size / 2;
    this.handle.clear();
    this.handle.rect(-half, -half, size, size);
    this.handle.fill({ color: bgFill, alpha: bgAlpha });
    if (strokeWidth > 0) {
      this.handle.stroke({ color: strokeColor, width: strokeWidth });
    }
    this.handle.cursor = this.style.cursor ?? cursorFor(placement);
    this.gfx.position.set(cx, cy);
    this.gfx.visible = visible;
    this.hit = { cx, cy, half: half + HIT_PADDING_PX2, placement };
  }
  getOuterExtent() {
    return 0;
  }
};
function handleCentre(bounds, placement) {
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;
  const midX = bounds.x + bounds.width / 2;
  const midY = bounds.y + bounds.height / 2;
  switch (placement) {
    case "top":
      return { cx: midX, cy: top };
    case "bottom":
      return { cx: midX, cy: bottom };
    case "left":
      return { cx: left, cy: midY };
    case "right":
      return { cx: right, cy: midY };
    case "top-left":
      return { cx: left, cy: top };
    case "top-right":
      return { cx: right, cy: top };
    case "bottom-left":
      return { cx: left, cy: bottom };
    case "bottom-right":
      return { cx: right, cy: bottom };
  }
}
function cursorFor(placement) {
  switch (placement) {
    case "top":
    case "bottom":
      return "ns-resize";
    case "left":
    case "right":
      return "ew-resize";
    case "top-left":
    case "bottom-right":
      return "nwse-resize";
    case "top-right":
    case "bottom-left":
      return "nesw-resize";
  }
}
var HIT_PADDING_PX3 = 4;
var ALL_PLACEMENTS = [
  "top-left",
  "top",
  "top-right",
  "right",
  "bottom-right",
  "bottom",
  "bottom-left",
  "left"
];
var SelectionFrameDecoration = class extends ShapeDecorationBase {
  border = new Graphics();
  handlesGfx = new Graphics();
  hits = [];
  constructor(style) {
    super(style);
    this.border.label = "frame:border";
    this.handlesGfx.label = "frame:handles";
    this.gfx.addChild(this.border);
    this.gfx.addChild(this.handlesGfx);
  }
  /**
   * Most-recently-computed per-handle hit geometry, in shape-local
   * coordinates. Behaviours iterate this array on pointerdown and test
   * each disk against the world-space click.
   */
  getLocalHandleHits() {
    return this.hits;
  }
  repaint() {
    const host = this.host;
    if (!host) return;
    const borderColor = this.style.borderColor ?? 7045119;
    const borderWidth = this.style.borderWidth ?? 1.5;
    const borderStyle = this.style.borderStyle ?? "dotted";
    const borderAlpha = this.style.borderAlpha ?? 0.6;
    const padding = this.style.padding ?? 4;
    const handleShape = this.style.handleShape ?? "circle";
    const handleRadius = this.style.handleRadius ?? 5;
    const handleCornerRadius = this.style.handleCornerRadius ?? 1.5;
    const handleFill = this.style.handleFill ?? 16777215;
    const handleFillAlpha = this.style.handleFillAlpha ?? 1;
    const handleStrokeColor = this.style.handleStrokeColor ?? borderColor;
    const handleStrokeWidth = this.style.handleStrokeWidth ?? 1.5;
    const handleStrokeAlpha = this.style.handleStrokeAlpha ?? 1;
    const handles = this.style.handles ?? ALL_PLACEMENTS;
    const visible = this.style.visible ?? true;
    const dashArray = this.style.dashArray ?? dashArrayFor(borderStyle, borderWidth);
    const inflated = inflateRect2(host.bounds, padding);
    this.border.clear();
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      emitDashedStroke(this.border, rectOutlinePoints(inflated), {
        color: borderColor,
        alpha: borderAlpha,
        width: borderWidth,
        dashArray,
        closed: true
      });
      this.border.stroke({
        color: borderColor,
        width: borderWidth,
        alpha: borderAlpha
      });
    } else {
      this.border.rect(inflated.x, inflated.y, inflated.width, inflated.height);
      this.border.stroke({
        color: borderColor,
        width: borderWidth,
        alpha: borderAlpha
      });
    }
    this.handlesGfx.clear();
    const nextHits = [];
    for (const p of handles) {
      const { cx, cy } = handleCentre2(inflated, p);
      if (handleShape === "square") {
        const side = handleRadius * 2;
        if (handleCornerRadius > 0) {
          this.handlesGfx.roundRect(
            cx - handleRadius,
            cy - handleRadius,
            side,
            side,
            handleCornerRadius
          );
        } else {
          this.handlesGfx.rect(cx - handleRadius, cy - handleRadius, side, side);
        }
      } else {
        this.handlesGfx.circle(cx, cy, handleRadius);
      }
      this.handlesGfx.fill({ color: handleFill, alpha: handleFillAlpha });
      if (handleStrokeWidth > 0) {
        this.handlesGfx.stroke({
          color: handleStrokeColor,
          width: handleStrokeWidth,
          alpha: handleStrokeAlpha
        });
      }
      nextHits.push({
        placement: p,
        cx,
        cy,
        radius: handleRadius + HIT_PADDING_PX3
      });
    }
    this.hits = nextHits;
    this.gfx.visible = visible;
  }
  getOuterExtent() {
    const padding = this.style.padding ?? 4;
    const borderWidth = this.style.borderWidth ?? 1.5;
    const handleRadius = this.style.handleRadius ?? 5;
    return padding + borderWidth / 2 + handleRadius;
  }
};
function handleCentre2(bounds, placement) {
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;
  const midX = bounds.x + bounds.width / 2;
  const midY = bounds.y + bounds.height / 2;
  switch (placement) {
    case "top":
      return { cx: midX, cy: top };
    case "bottom":
      return { cx: midX, cy: bottom };
    case "left":
      return { cx: left, cy: midY };
    case "right":
      return { cx: right, cy: midY };
    case "top-left":
      return { cx: left, cy: top };
    case "top-right":
      return { cx: right, cy: top };
    case "bottom-left":
      return { cx: left, cy: bottom };
    case "bottom-right":
      return { cx: right, cy: bottom };
  }
}
function dashArrayFor(style, borderWidth) {
  switch (style) {
    case "solid":
      return null;
    case "dotted": {
      const w = Math.max(1, borderWidth);
      return [w, w * 2];
    }
    case "dashed":
    default:
      return [5, 4];
  }
}
function rectOutlinePoints(r) {
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.width, y: r.y },
    { x: r.x + r.width, y: r.y + r.height },
    { x: r.x, y: r.y + r.height }
  ];
}
function inflateRect2(r, pad) {
  return {
    x: r.x - pad,
    y: r.y - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2
  };
}
var LabelConnectorDecoration = class extends ConnectorDecorationBase {
  contentView = null;
  contentLayer = null;
  bgGfx = null;
  attached = true;
  hostSurface = null;
  /** See `LabelDecoration.resolution`. */
  resolution = null;
  /** See `LabelDecoration.textScale`. */
  textScale = 1;
  /** See `LabelDecoration.setResolution`. */
  setResolution(resolution) {
    this.resolution = resolution;
    if (this.contentView) applyLabelResolution(this.contentView, resolution);
  }
  /** See `LabelDecoration.getResolution`. */
  getResolution() {
    return this.resolution;
  }
  /** See `LabelDecoration.textFontSize`. */
  textFontSize() {
    return contentFontSize(this.style.content);
  }
  /**
   * Draw the label at `scale` × its natural size (the renderer's label-size
   * policy). The label stays centred on its path point; its style `offset`
   * scales with it, so the gap to the path keeps its proportion. Idempotent.
   */
  setTextScale(scale) {
    if (!(scale > 0) || scale === this.textScale) return;
    this.textScale = scale;
    this.positionOnPath();
  }
  repaint() {
    const host = this.host;
    if (!host) return;
    this.hostSurface = host.surface;
    if (!this.contentLayer) {
      this.contentLayer = new Container();
      this.contentLayer.label = "label:content";
      this.gfx.addChild(this.contentLayer);
    }
    if (this.style.background && !this.bgGfx) {
      this.bgGfx = new Graphics();
      this.bgGfx.label = "label:bg";
      this.contentLayer.addChildAt(this.bgGfx, 0);
    } else if (!this.style.background && this.bgGfx) {
      this.bgGfx.destroy();
      this.bgGfx = null;
    }
    if (!this.contentView) {
      this.contentView = mountLabelContent(this.style.content, this.style.wrap);
      this.contentLayer.addChild(this.contentView.display);
    } else {
      const next = updateLabelContent(this.contentView, this.style.content, this.style.wrap);
      if (next !== this.contentView) {
        this.contentLayer.addChild(next.display);
        this.contentView = next;
      }
    }
    if (this.resolution !== null) applyLabelResolution(this.contentView, this.resolution);
    const textW = this.contentView.display.width;
    const textH = this.contentView.display.height;
    if (this.style.background && this.bgGfx) {
      drawLabelBackground(this.bgGfx, this.style.background, { width: textW, height: textH });
      this.bgGfx.position.set(-textW / 2, -textH / 2);
    }
    this.contentView.display.position.set(-textW / 2, -textH / 2);
    this.gfx.alpha = this.style.alpha ?? 1;
    this.gfx.cursor = this.style.cursor ?? "default";
    this.gfx.eventMode = this.style.interactive ? "static" : "none";
    this.positionOnPath();
  }
  /**
   * Re-position + re-rotate the label on the current host path. Called
   * during repaint and on every tick (cheap — one path sample + one
   * trigonometric op). Without `autoRotate` and `visibility` configured the
   * renderer never registers `tick` and this stays static.
   */
  positionOnPath() {
    const host = this.host;
    if (!host) return;
    const placement = this.style.placement ?? "center";
    const t = resolveT(placement);
    const sample = samplePathAt(host.path, t);
    let baseX = sample.point.x;
    let baseY = sample.point.y;
    const pathOffset = this.style.pathOffset ?? 0;
    if (pathOffset !== 0) {
      baseX += sample.tangent.x * pathOffset;
      baseY += sample.tangent.y * pathOffset;
    }
    let rotation = 0;
    if (this.style.autoRotate !== false) {
      let theta = Math.atan2(sample.tangent.y, sample.tangent.x);
      if (this.style.keepUpright !== false) {
        if (theta > Math.PI / 2) theta -= Math.PI;
        else if (theta < -Math.PI / 2) theta += Math.PI;
      }
      rotation = theta;
    }
    const offsetX = (this.style.offset?.x ?? 0) * this.textScale;
    const offsetY = (this.style.offset?.y ?? 0) * this.textScale;
    if (rotation !== 0 && (offsetX !== 0 || offsetY !== 0)) {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      baseX += offsetX * cos - offsetY * sin;
      baseY += offsetX * sin + offsetY * cos;
    } else {
      baseX += offsetX;
      baseY += offsetY;
    }
    this.gfx.position.set(baseX, baseY);
    this.gfx.rotation = rotation;
    this.gfx.scale.set(this.textScale, this.textScale);
  }
  tick(_deltaMs) {
    const v2 = this.style.visibility;
    const wantsLOD = v2 && (v2.minZoom !== void 0 || v2.maxZoom !== void 0);
    const wantsAutoRotate = this.style.autoRotate !== false;
    if (!wantsLOD && !wantsAutoRotate) return false;
    if (wantsLOD && v2) {
      const z2 = zoomAboveHost(this.hostSurface);
      const shouldShow = (v2.minZoom === void 0 || z2 >= v2.minZoom) && (v2.maxZoom === void 0 || z2 <= v2.maxZoom);
      if (shouldShow && !this.attached && this.hostSurface) {
        this.hostSurface.addChild(this.gfx);
        this.attached = true;
      } else if (!shouldShow && this.attached) {
        this.gfx.parent?.removeChild(this.gfx);
        this.attached = false;
      }
    }
    if (wantsAutoRotate) this.positionOnPath();
    return true;
  }
};
function resolveT(placement) {
  if (typeof placement === "number") {
    if (placement < 0) return 0;
    if (placement > 1) return 1;
    return placement;
  }
  switch (placement) {
    case "start":
      return 0;
    case "end":
      return 1;
    case "center":
    default:
      return 0.5;
  }
}

// src/primitives/base/EffectBase.ts
var EffectBase = class {
  style;
  host = null;
  constructor(style) {
    this.style = style;
  }
  mount(host) {
    this.host = host;
  }
  update(host) {
    this.host = host;
  }
  destroy() {
    this.host = null;
  }
};

// src/primitives/effects/ShakeEffect.ts
var ShakeEffect = class extends EffectBase {
  target = "transform";
  amplitude;
  axis;
  decay;
  seed;
  currentDx = 0;
  currentDy = 0;
  constructor(style) {
    super(style);
    this.amplitude = style.amplitude ?? 4;
    this.axis = style.axis ?? "both";
    this.seed = style.seed ?? Math.floor(Math.random() * 4294967295);
    this.decay = style.decayMs ? new Tween({ from: 1, to: 0, duration: style.decayMs, easing: linear }) : null;
  }
  tick(deltaMs) {
    let envelope = 1;
    if (this.decay) {
      const alive = this.decay.tick(deltaMs);
      envelope = this.decay.value;
      if (!alive) {
        this.currentDx = 0;
        this.currentDy = 0;
        return false;
      }
    }
    const amp = this.amplitude * envelope;
    if (this.axis === "both" || this.axis === "x") {
      this.currentDx = (this.rand() * 2 - 1) * amp;
    }
    if (this.axis === "both" || this.axis === "y") {
      this.currentDy = (this.rand() * 2 - 1) * amp;
    }
    return true;
  }
  readTransform() {
    return { dx: this.currentDx, dy: this.currentDy };
  }
  /** xorshift32 — deterministic per-effect PRNG, no global state. */
  rand() {
    let x2 = this.seed | 0;
    x2 ^= x2 << 13;
    x2 ^= x2 >>> 17;
    x2 ^= x2 << 5;
    this.seed = x2;
    return (x2 >>> 0) % 16777215 / 16777215;
  }
};

// src/primitives/effects/BreathingEffect.ts
var BreathingEffect = class extends EffectBase {
  target = "transform";
  amplitude;
  periodMs;
  axis;
  elapsed;
  currentSx = 1;
  currentSy = 1;
  constructor(style) {
    super(style);
    this.amplitude = style.amplitude ?? 0.05;
    this.periodMs = style.periodMs ?? 1800;
    this.axis = style.axis ?? "both";
    this.elapsed = style.phaseOffsetMs ?? 0;
  }
  tick(deltaMs) {
    this.elapsed += deltaMs;
    const phase = this.elapsed / this.periodMs * Math.PI * 2;
    const factor = 1 + this.amplitude * Math.sin(phase);
    this.currentSx = this.axis === "y" ? 1 : factor;
    this.currentSy = this.axis === "x" ? 1 : factor;
    return true;
  }
  readTransform() {
    return { sx: this.currentSx, sy: this.currentSy };
  }
};

// src/primitives/base/ConnectorEffectBase.ts
var ConnectorEffectBase = class {
  style;
  host = null;
  constructor(style) {
    this.style = style;
  }
  mount(host) {
    this.host = host;
  }
  update(host) {
    this.host = host;
  }
  destroy() {
    this.host = null;
  }
};

// src/primitives/effects/BreathingConnectorEffect.ts
var BreathingConnectorEffect = class extends ConnectorEffectBase {
  target = "style";
  amplitude;
  periodMs;
  elapsed;
  currentAlpha = 1;
  constructor(style) {
    super(style);
    this.amplitude = clamp014(style.amplitude ?? 0.5);
    this.periodMs = style.periodMs ?? 1800;
    this.elapsed = style.phaseOffsetMs ?? 0;
  }
  tick(deltaMs) {
    this.elapsed += deltaMs;
    const phase = this.elapsed / this.periodMs * Math.PI * 2;
    this.currentAlpha = 1 - this.amplitude * (0.5 - 0.5 * Math.sin(phase));
    return true;
  }
  readStyle() {
    return { alpha: this.currentAlpha };
  }
};
function clamp014(v2) {
  if (v2 < 0) return 0;
  if (v2 > 1) return 1;
  return v2;
}
var FadeInEffect = class extends EffectBase {
  target = "style";
  tween;
  fromAlpha;
  toAlpha;
  remainingDelayMs;
  currentAlpha;
  constructor(style) {
    super(style);
    this.fromAlpha = style.fromAlpha ?? 0;
    this.toAlpha = style.toAlpha ?? 1;
    this.remainingDelayMs = Math.max(0, style.delayMs ?? 0);
    this.currentAlpha = this.fromAlpha;
    this.tween = new Tween({
      from: this.fromAlpha,
      to: this.toAlpha,
      duration: Math.max(1, style.durationMs ?? 600),
      easing: resolveEasing$1(style.easing)
    });
  }
  tick(deltaMs) {
    if (this.remainingDelayMs > 0) {
      this.remainingDelayMs -= deltaMs;
      return true;
    }
    const stillAnimating = this.tween.tick(deltaMs);
    this.currentAlpha = this.tween.value;
    if (!stillAnimating) this.currentAlpha = this.toAlpha;
    return stillAnimating;
  }
  readStyle() {
    return { alpha: this.currentAlpha };
  }
};
var FadeInConnectorEffect = class extends ConnectorEffectBase {
  target = "style";
  tween;
  fromAlpha;
  toAlpha;
  remainingDelayMs;
  currentAlpha;
  constructor(style) {
    super(style);
    this.fromAlpha = style.fromAlpha ?? 0;
    this.toAlpha = style.toAlpha ?? 1;
    this.remainingDelayMs = Math.max(0, style.delayMs ?? 0);
    this.currentAlpha = this.fromAlpha;
    this.tween = new Tween({
      from: this.fromAlpha,
      to: this.toAlpha,
      duration: Math.max(1, style.durationMs ?? 600),
      easing: resolveEasing3(style.easing)
    });
  }
  tick(deltaMs) {
    if (this.remainingDelayMs > 0) {
      this.remainingDelayMs -= deltaMs;
      return true;
    }
    const stillAnimating = this.tween.tick(deltaMs);
    this.currentAlpha = this.tween.value;
    if (!stillAnimating) this.currentAlpha = this.toAlpha;
    return stillAnimating;
  }
  readStyle() {
    return { alpha: this.currentAlpha };
  }
};
function resolveEasing3(name) {
  switch (name) {
    case "linear":
      return linear;
    case "easeInOutCubic":
      return easeInOutCubic;
    case "easeInOutSine":
      return easeInOutSine;
    case "easeOutCubic":
    default:
      return easeOutCubic;
  }
}

// src/renderer/PrimitivesRenderer.ts
function samePoint(a, b2) {
  return Math.abs(a.x - b2.x) < 1e-6 && Math.abs(a.y - b2.y) < 1e-6;
}
var DEFAULT_HIT_FLOOR_PX = 6;
var DEFAULT_HOVER_HYSTERESIS_PX = 5;
var DEFAULT_HOVER_NODE_INCIDENCE_PX = 20;
var PrimitivesRenderer = class _PrimitivesRenderer {
  shapeRegistry = /* @__PURE__ */ new Map();
  routerRegistry = /* @__PURE__ */ new Map();
  pathStyleRegistry = /* @__PURE__ */ new Map();
  anchorRegistry = /* @__PURE__ */ new Map();
  decorationRegistry = /* @__PURE__ */ new Map();
  effectRegistry = /* @__PURE__ */ new Map();
  shapeInstances = /* @__PURE__ */ new Map();
  connectorInstances = /* @__PURE__ */ new Map();
  animated = /* @__PURE__ */ new Set();
  animatedEffects = /* @__PURE__ */ new Set();
  /**
   * Shape instances that currently have at least one effect attached. The
   * per-frame aggregation walks this set rather than every shape instance.
   */
  hostsWithEffects = /* @__PURE__ */ new Set();
  /**
   * Connector instances that currently have at least one effect attached.
   * Walked per frame to aggregate style modulations (tint + alpha) onto
   * `connector.gfx`. Transform deltas are ignored for connector hosts.
   */
  connectorHostsWithEffects = /* @__PURE__ */ new Set();
  /**
   * Host → (slot → BadgeOptions). Each entry corresponds to a shape registered
   * under id `${hostId}:${slot}` and re-anchored on host updates.
   */
  badges = /* @__PURE__ */ new Map();
  /**
   * The engine's picking engine (`hit/PickingIndex`) — spatial index, hit boxes
   * and narrow-phase geometry, all derived from **specs**. Picking is
   * interaction rather than drawing (design D5), so it lives in
   * `@invana/canvas` and stays behind when the pixi backend is extracted; this
   * renderer is only its {@link HitGeometrySource}, answering the three things a
   * spec can't carry (visual scale, routed polyline, custom-kind silhouette).
   */
  picking;
  /**
   * Most recently-pushed label rasterisation resolution. `null` until a
   * zoom-LOD behaviour (or the host app) calls `setLabelsResolution`. When
   * non-null, every newly-mounted label decoration inherits this value so
   * the user never sees a freshly-drawn label start at base fidelity and
   * snap up on the next zoom event.
   */
  trackedLabelResolution = null;
  /**
   * Every decoration exposing the `setResolution` / `getResolution` hooks
   * (i.e. `LabelDecoration` / `LabelConnectorDecoration`). Maintained on
   * `setDecoration` / `disposeDecoration` so `tickAnimations` can sweep it
   * cheaply without re-scanning every shape and connector instance.
   *
   * The sweep applies the tracked resolution only to labels currently
   * inside the camera viewport — re-rastering an off-screen label burns a
   * GPU texture upload with no visible benefit. Off-screen labels catch
   * up the moment they pan in, since the sweep re-checks every frame.
   */
  labelBearingDecorations = /* @__PURE__ */ new Set();
  /**
   * Per-frame budget on how many on-screen labels get re-rastered. Each
   * `setResolution(r)` write triggers one glyph-texture regen in Pixi's
   * next render pass. 64 keeps the regen cost inside frame budget for a
   * typical few-hundred-visible-label scene while finishing the transition
   * in under 5 frames; widen if your scenes have larger visible label
   * sets and tolerate a longer transition.
   */
  static LABEL_RASTER_PER_TICK = 64;
  /**
   * The label-size policy per target (`setLabelSizePolicy`), or `null` when the
   * target's labels keep their natural size.
   */
  labelSizePolicies = {
    shape: null,
    connector: null
  };
  /**
   * Targets whose policy changed since the last sweep — swept once even when the
   * new policy is `null`, so clearing a policy restores every label it scaled.
   */
  labelSizeDirty = {
    shape: false,
    connector: false
  };
  /** Camera scale the label sizes were last swept at; `null` = never swept. */
  labelSizeZoom = null;
  /**
   * Labels not yet sized at {@link labelSizeZoom}. A zoom frame sizes only what is
   * on screen and leaves the rest here; frames where the zoom holds still drain
   * it {@link LABEL_SIZE_PER_TICK} at a time. `null` = nothing pending.
   */
  labelSizeBacklog = { shape: null, connector: null };
  /**
   * Off-screen labels sized per frame while catching up after a zoom. At
   * ~0.3 µs a label this keeps the catch-up well under 1 ms a frame.
   */
  static LABEL_SIZE_PER_TICK = 1e3;
  events = new EventEmitter();
  _container;
  /**
   * Connector sub-layer — added to `_container` first so it renders *below*
   * the shape layer. Connector decorations live inside `connector.gfx`
   * (children of this layer), so any decoration geometry that extends past
   * the path endpoints (e.g. a glow halo's radius, a ripple wave's
   * `maxRadius`) is naturally hidden by overlapping shapes on top —
   * matching the standard graph-viz "nodes above edges" convention.
   */
  connectorLayer;
  /** Shape sub-layer — rendered above `connectorLayer`. */
  shapeLayer;
  /**
   * Overlay sub-layer — rendered **above both** the connector and shape layers.
   * A raised element is reparented here by {@link setRaised} so the lifted set
   * floats over *all* unrelated content — crucially, a lifted **edge** paints
   * over non-lifted nodes, impossible while it stays in `connectorLayer` (which
   * is always under `shapeLayer`). Within the overlay, lifted shapes still sort
   * above lifted connectors, so a lifted node stays on top of its own edges.
   */
  overlayLayer;
  /**
   * The `'backdrop'` paint stripe — the one plane that renders **below**
   * `connectorLayer`.
   *
   * A `RenderLayer` changes *render order only*: an attached shape keeps its
   * logical parent (`shapeLayer`), so its transform, culling, decorations and
   * destruction paths are untouched — nothing is reparented. That is the whole
   * reason this is a `RenderLayer` and not a fourth `Container`, which would
   * have needed home-band restore, decoration-lifetime and destroy-ordering
   * care (`docs/group-frame-paint-band-plan.md`, rejected).
   *
   * `sortableChildren` so nested frames still order among themselves by
   * `zIndex` — a child frame paints above its parent inside the stripe.
   *
   * @see `docs/render-planes-and-emphasis-plan.md` §4.1
   */
  backdropPlane;
  /**
   * The set {@link setRaised} currently has lifted — the renderer's mirror of
   * its own overlay, so the next call knows what to drop back.
   */
  raisedIds = /* @__PURE__ */ new Set();
  camera;
  textureRegistry;
  /** Currently-hovered target. Tracks pointerover/out diffs. */
  currentHover = null;
  /** Currently-hovered sub-part (shape id + `hitId`). Tracks partover/partout diffs. */
  currentPart = null;
  /** Target captured by a pointerdown — used to gate click emission. */
  downHit = null;
  /** Last left-click time + target — drives double-click detection. */
  lastLeftClick = null;
  constructor(opts) {
    this._container = opts.container;
    this.camera = opts.camera;
    this.textureRegistry = opts.textureRegistry ?? new TextureRegistry();
    this.picking = new PickingIndex({
      source: this,
      camera: opts.camera,
      hitFloorPx: opts.hitFloorPx ?? DEFAULT_HIT_FLOOR_PX,
      hoverHysteresisPx: opts.hoverHysteresisPx ?? DEFAULT_HOVER_HYSTERESIS_PX,
      hoverNodeIncidencePx: opts.hoverNodeIncidencePx ?? DEFAULT_HOVER_NODE_INCIDENCE_PX
    });
    this.connectorLayer = new Container();
    this.shapeLayer = new Container();
    this.connectorLayer.label = "paint:connectors";
    this.shapeLayer.label = "paint:shapes";
    this.connectorLayer.sortableChildren = true;
    this.shapeLayer.sortableChildren = true;
    this.overlayLayer = new Container();
    this.overlayLayer.label = "paint:overlay";
    this.overlayLayer.sortableChildren = true;
    this.backdropPlane = new RenderLayer({ sortableChildren: true });
    this.backdropPlane.label = "plane:backdrop";
    this._container.addChild(this.backdropPlane);
    this._container.addChild(this.connectorLayer);
    this._container.addChild(this.shapeLayer);
    this._container.addChild(this.overlayLayer);
    this.registerBuiltins();
  }
  registerBuiltins() {
    this.registerShape("circle", CircleShape);
    this.registerShape("ellipse", EllipseShape);
    this.registerShape("rect", RectShape);
    this.registerShape("tabbed-rect", TabbedRectShape);
    this.registerShape("polygon", PolygonShape);
    this.registerShape("path", PathShape);
    this.registerShape("regular-polygon", RegularPolygonShape);
    this.registerShape("star", StarShape);
    this.registerShape("arc", ArcShape);
    this.registerShape("composite", CompositeShape);
    this.registerShape("arrow", ArrowMarker);
    this.registerShape("diamond", DiamondMarker);
    this.registerShape("dot", DotMarker);
    this.registerRouter("straight", straightRouter);
    this.registerRouter("orth", orthRouter);
    this.registerRouter("orthogonal", orthRouter);
    this.registerRouter("manhattan", manhattanRouter);
    this.registerRouter("metro", metroRouter);
    this.registerRouter("er", erRouter);
    this.registerRouter("oneSide", oneSideRouter);
    this.registerPathStyle("normal", normalPathStyle);
    this.registerPathStyle("rounded", roundedPathStyle);
    this.registerPathStyle("bezier", bezierPathStyle);
    this.registerPathStyle("quadratic", quadraticPathStyle);
    this.registerPathStyle("bump-radial", bumpRadialPathStyle);
    this.registerPathStyle("bump-horizontal", bumpHorizontalPathStyle);
    this.registerPathStyle("bundle", bundlePathStyle);
    this.registerPathStyle("step-radial", stepRadialPathStyle);
    this.registerPathStyle("smooth", smoothPathStyle);
    this.registerPathStyle("loop-curve", loopCurvePathStyle);
    this.registerPathStyle("loop-polyline", loopPolylinePathStyle);
    this.registerAnchor("center", centerAnchor);
    this.registerAnchor("boundary", boundaryAnchor);
    this.registerAnchor("perpendicular", perpendicularAnchor);
    this.registerAnchor("edge-port", edgePortAnchor);
    this.registerAnchor("silhouette-port", silhouettePortAnchor);
    this.registerDecoration("glow", GlowDecoration, { target: "shape" });
    this.registerDecoration("pulse-ring", PulseRingDecoration, { target: "shape" });
    this.registerDecoration("liquid-fill", LiquidFillDecoration, { target: "shape" });
    this.registerDecoration("marching-ants", MarchingAntsDecoration, { target: "shape" });
    this.registerDecoration("ring", RingDecoration, { target: "shape" });
    this.registerDecoration("marching-ants-connector", MarchingAntsConnectorDecoration, { target: "connector" });
    this.registerDecoration("fly-marker-connector", FlyMarkerConnectorDecoration, { target: "connector" });
    this.registerDecoration("flow-particles-connector", FlowParticlesConnectorDecoration, { target: "connector" });
    this.registerDecoration("glow-connector", GlowConnectorDecoration, { target: "connector" });
    this.registerDecoration("ripple-connector", RippleConnectorDecoration, { target: "connector" });
    this.registerDecoration("reveal-connector", RevealConnectorDecoration, { target: "connector" });
    this.registerDecoration("ring-connector", RingConnectorDecoration, { target: "connector" });
    this.registerDecoration("label", LabelDecoration, { target: "shape" });
    this.registerDecoration("label-connector", LabelConnectorDecoration, { target: "connector" });
    this.registerDecoration("toggle", ToggleDecoration, { target: "shape" });
    this.registerDecoration("resize-handle", ResizeHandleDecoration, { target: "shape" });
    this.registerDecoration("selection-frame", SelectionFrameDecoration, { target: "shape" });
    this.registerEffect("shake", ShakeEffect, { target: "shape" });
    this.registerEffect("breathing", BreathingEffect, { target: "shape" });
    this.registerEffect("fade-in", FadeInEffect, { target: "shape" });
    this.registerEffect("breathing-connector", BreathingConnectorEffect, { target: "connector" });
    this.registerEffect("fade-in-connector", FadeInConnectorEffect, { target: "connector" });
  }
  // ─── Registries ─────────────────────────────────────────────────────────
  registerShape(kind, ctor) {
    this.shapeRegistry.set(kind, ctor);
  }
  /**
   * The shape kinds this renderer can draw, including any registered at runtime.
   *
   * Exists so a caller projecting specs from the store can tell a shape spec from
   * a connector spec by asking which registry owns its `kind` — no discriminator
   * has to be baked into the spec vocabulary. Read-only view; register through
   * {@link registerShape}.
   */
  get shapeKinds() {
    return new Set(this.shapeRegistry.keys());
  }
  registerRouter(kind, fn) {
    this.routerRegistry.set(kind, fn);
  }
  registerPathStyle(kind, fn) {
    this.pathStyleRegistry.set(kind, fn);
  }
  registerAnchor(kind, fn) {
    this.anchorRegistry.set(kind, fn);
  }
  registerDecoration(kind, ctor, opts) {
    this.decorationRegistry.set(kind, {
      ctor,
      target: opts.target
    });
  }
  /**
   * Register an effect under a string kind. Effects are domain-free primitives
   * that modulate the host shape's transform or style channels each frame
   * (shake, breathing, shimmer, …). The effect's constructor receives the
   * caller's `style` payload; `opts.target` constrains which host kinds the
   * effect may attach to (shape-only for v0).
   *
   * Throws on `setEffect` if the registered `target` doesn't include the
   * host kind being targeted.
   */
  registerEffect(kind, ctor, opts) {
    this.effectRegistry.set(kind, {
      ctor,
      target: opts.target
    });
  }
  // ─── Mutation: shapes ───────────────────────────────────────────────────
  addShape(id, spec) {
    if (this.shapeInstances.has(id)) {
      throw new Error(`PrimitivesRenderer.addShape: id "${id}" already exists`);
    }
    const Ctor = this.shapeRegistry.get(spec.kind);
    if (!Ctor) {
      throw new Error(`PrimitivesRenderer.addShape: unknown shape kind "${spec.kind}"`);
    }
    const host = {
      surface: this.shapeLayer,
      textureRegistry: this.textureRegistry,
      requestRedraw: () => {
        const cur = this.shapeInstances.get(id);
        if (!cur) return;
        cur.shape.draw(cur.spec);
        if (cur.displayOverride !== null) this.applyDisplayTransform(cur);
      }
    };
    const shape = new Ctor(spec, host);
    shape.gfx.label = id;
    this.shapeLayer.addChild(shape.gfx);
    const inst = new ShapeInstance(id, spec, shape);
    this.shapeInstances.set(id, inst);
    if (spec.visible !== false) {
      this.picking.insertShape(id, spec.zIndex ?? 0);
    }
    shape.gfx.eventMode = "none";
    this.applyShapePlane(id, inst);
    if (this.trackedLabelResolution !== null) shape.setLabelResolution?.(this.trackedLabelResolution);
  }
  /**
   * Attach / detach one shape's gfx to the paint stripe its spec declares.
   *
   * Two rules, both load-bearing:
   *
   * 1. **A raised shape is never in the backdrop.** `setRaised` exists to float
   *    an element above everything; leaving it attached to the stripe *below the
   *    connectors* would silently defeat that, since the stripe wins over the
   *    overlay parent. So a lifted shape detaches, and re-attaches when dropped
   *    ({@link setLifted} calls back here).
   * 2. **`detach` is unconditional.** Pixi's `RenderLayer` ignores a detach for
   *    an object it doesn't hold, so this is safe to call on every update — no
   *    "was it attached?" bookkeeping to drift out of sync.
   */
  applyShapePlane(id, inst) {
    const gfx = inst.shape.gfx;
    const wantsBackdrop = inst.spec.plane === "backdrop" && !this.raisedIds.has(id);
    if (wantsBackdrop) this.backdropPlane.attach(gfx);
    else this.backdropPlane.detach(gfx);
  }
  updateShape(id, partial) {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    inst.spec = { ...inst.spec, ...partial };
    inst.shape.draw(inst.spec);
    if (inst.displayOverride !== null) this.applyDisplayTransform(inst);
    if (partial.plane !== void 0) this.applyShapePlane(id, inst);
    if (inst.spec.visible === false) {
      this.picking.remove(id);
    } else {
      this.picking.insertShape(id, inst.spec.zIndex ?? 0);
    }
    if (inst.decorations.size > 0) this.refreshShapeDecorations(inst);
    if (this.badges.has(id)) this.reanchorBadges(id);
  }
  /**
   * Fast-path uniform rescale for a shape — writes the gfx transform
   * directly without touching the spec or rebuilding geometry.
   *
   * `updateShape` rebuilds the underlying Pixi geometry (Graphics.clear()
   * + retrace) on every call, which dominates the cost when something
   * like `NodeScaleLODBehaviour` rewrites thousands of node sizes per
   * camera-zoom frame. `scaleShape` skips all of that: the geometry on
   * the GPU is unchanged, only its transform changes.
   *
   * **Hit-test bounds are NOT updated here.** rbush's `remove(entry)` is
   * an O(N) tree walk, so per-id `hit.update` × N shapes is O(N²) per
   * zoom frame — pathological at a few thousand shapes. Call
   * {@link reindexScaledShapeHits} once *after* a batch (typically on
   * gesture settle) to bulk-reindex in O(N log N). The hit-bounds are
   * stale until you do — acceptable when the caller knows pointer
   * interaction is unlikely mid-gesture.
   *
   * **Other limitations** — decorations and badges attached to the host
   * are **not** re-anchored against the new visible bounds; if you have
   * either on a size-LOD'd node, prefer `updateShape` or accept the
   * stale anchor. Stroke width inside the geometry scales with the
   * transform (Pixi's stroke is in local units), which is usually the
   * intent for pixel-constant sizing but means you can't independently
   * target body size and stroke width via `scaleShape` alone.
   */
  scaleShape(id, scale) {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    inst.gfxScale = scale;
    if (this.labelSizePolicies.shape !== null) this.sizeShapeLabel(inst, this.camera.scale);
    if (inst.displayOverride !== null) {
      this.applyDisplayTransform(inst);
      return;
    }
    inst.shape.gfx.scale.set(scale, scale);
  }
  /**
   * Set or clear a shape's display-only override — see
   * {@link IElementRenderer.setShapeDisplayOverride}. The gfx transform and the
   * text visibility are rewritten at once; the hit index is marked moved
   * (re-indexed lazily, like {@link moveShape}) and badges re-anchor.
   * Connectors are left to the caller.
   */
  setShapeDisplayOverride(id, override) {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    if (override === null && inst.displayOverride === null) return;
    const wasForced = inst.displayOverride?.showText === true;
    inst.displayOverride = override;
    this.applyDisplayTransform(inst);
    if (wasForced !== (override?.showText === true)) {
      this.applyTextVisibility(inst);
      if (!wasForced) this.sizeShapeLabel(inst, this.camera.scale);
    }
    this.picking.markShapeMoved(id);
    if (this.badges.has(id)) this.reanchorBadges(id);
  }
  /** Clear every display override — see {@link IElementRenderer.clearShapeDisplayOverrides}. */
  clearShapeDisplayOverrides() {
    for (const inst of this.shapeInstances.values()) {
      if (inst.displayOverride !== null) this.setShapeDisplayOverride(inst.id, null);
    }
  }
  /**
   * Write a shape's gfx transform from its spec origin, {@link ShapeInstance.gfxScale}
   * and its display override, and cache the drawn offset on the instance.
   *
   * The override scale is applied about the shape's visual centre `c` (local
   * bounds midpoint): with the LOD scale `g` and drawn scale `S = g·s`, the
   * centre stays where `g` alone put it (`spec + g·c + d`), so the gfx origin is
   * `spec + d + (g − S)·c`. A circle (`c = 0`) just translates; a top-left
   * rect or card grows in place instead of toward its bottom-right.
   *
   * A host with effects is handed to {@link applyEffectsToHost}, which composes
   * the override with the effect deltas (and runs every frame anyway).
   */
  applyDisplayTransform(inst) {
    const o = inst.displayOverride;
    const gfx = inst.shape.gfx;
    if (o === null) {
      inst.drawnDx = 0;
      inst.drawnDy = 0;
      if (this.hostsWithEffects.has(inst)) {
        this.applyEffectsToHost(inst);
        return;
      }
      gfx.position.set(inst.spec.x, inst.spec.y);
      gfx.scale.set(inst.gfxScale, inst.gfxScale);
      return;
    }
    const g = inst.gfxScale;
    const s = inst.drawnScale;
    let ox = o.dx ?? 0;
    let oy = o.dy ?? 0;
    if (s !== g) {
      const b2 = inst.shape.bounds();
      ox += (g - s) * (b2.x + b2.width / 2);
      oy += (g - s) * (b2.y + b2.height / 2);
    }
    inst.drawnDx = ox;
    inst.drawnDy = oy;
    if (this.hostsWithEffects.has(inst)) {
      this.applyEffectsToHost(inst);
      return;
    }
    gfx.position.set(inst.spec.x + ox, inst.spec.y + oy);
    gfx.scale.set(s, s);
  }
  /**
   * Reconcile a shape's text visibility from its two channels: the `'label'`
   * decoration is drawn when the display override forces `showText`, or when
   * both text LOD ({@link ShapeInstance.textWanted}) and label collision
   * ({@link ShapeInstance.labelWanted}) allow it. The shape's internal text
   * (composite parts) follows the LOD channel alone — collision never sees it.
   */
  applyTextVisibility(inst) {
    this.applyShapeLabelVisibility(inst);
    inst.shape.setTextVisible?.(inst.displayOverride?.showText === true || inst.textWanted);
  }
  /** The `'label'` half of {@link applyTextVisibility}. No-op without a label. */
  applyShapeLabelVisibility(inst) {
    const label = inst.decorations.get("label");
    if (!label?.gfx) return;
    label.gfx.visible = inst.displayOverride?.showText === true || inst.textWanted && inst.labelWanted;
  }
  /** Connector analogue of {@link applyShapeLabelVisibility} (no display override). */
  applyConnectorLabelVisibility(inst) {
    const label = inst.decorations.get("label");
    if (!label?.gfx) return;
    label.gfx.visible = inst.textWanted && inst.labelWanted;
  }
  /**
   * Show / hide a shape's **text** — both the external `'label'` decoration
   * (simple nodes) *and* any internal text the shape mounts (e.g. a
   * `CompositeShape`'s `label` parts, via the optional `setTextVisible` hook).
   * Gives text zoom-LOD a single entry point that covers atomic and composite
   * nodes alike; the companion trio is {@link setShapeIconVisible} /
   * {@link setShapeImageVisible}. No-op for the pieces a shape doesn't have.
   *
   * Writes the **LOD channel only** ({@link ShapeInstance.textWanted}); label
   * collision's channel is untouched, so neither undoes the other.
   */
  setShapeTextVisible(id, visible) {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    const shown = visible && !inst.textWanted;
    inst.textWanted = visible;
    this.applyTextVisibility(inst);
    if (shown) this.sizeShapeLabel(inst, this.camera.scale);
  }
  /**
   * Text-LOD visibility of a connector's `'label'` decoration — the connector
   * twin of {@link setShapeTextVisible}. Writes the LOD channel only; label
   * collision keeps its own. No-op for unknown ids.
   */
  setConnectorTextVisible(id, visible) {
    const inst = this.connectorInstances.get(id);
    if (!inst) return;
    const shown = visible && !inst.textWanted;
    inst.textWanted = visible;
    this.applyConnectorLabelVisibility(inst);
    if (shown) this.sizeConnectorLabel(inst, this.camera.scale);
  }
  /**
   * What the text-LOD channel last asked for `id` — forced `true` by a display
   * override's `showText`; `false` for an unknown id. See
   * {@link IElementRenderer.isTextVisible}.
   */
  isTextVisible(id) {
    const shape = this.shapeInstances.get(id);
    if (shape) return shape.displayOverride?.showText === true || shape.textWanted;
    return this.connectorInstances.get(id)?.textWanted ?? false;
  }
  /**
   * Show / hide a shape's **inset icon** content (`glyph` / `svg` / `svg-url`).
   * Pure `.visible` flip — no repaint. Persists across redraws. No-op for
   * shapes that don't carry inset content.
   */
  setShapeIconVisible(id, visible) {
    this.shapeInstances.get(id)?.shape.setInsetContentVisible?.(visible);
  }
  /**
   * Show / hide a shape's silhouette **image** fill. Repaints the body with the
   * `image` layer stripped / restored. Persists across redraws. No-op for
   * shapes without an image fill.
   */
  setShapeImageVisible(id, visible) {
    this.shapeInstances.get(id)?.shape.setImageFillVisible?.(visible);
  }
  /**
   * **Viewport culling.** Toggle `renderable` on every *indexed* shape /
   * connector by whether its bbox intersects `visibleBounds` (grown by
   * `padWorld` so elements don't pop at the screen edge during a pan). Off-screen
   * elements are then skipped by Pixi's render pass — the working set drops
   * sharply when zoomed in, which is where it matters. Reuses the same rbush that
   * backs hit-testing (`searchRect`), so it's conservative for loose connector
   * bboxes: it may keep an off-screen edge, but never culls an on-screen one.
   *
   * Elements not in the hit index (hidden / non-hittable) are left untouched.
   * Cheap enough to run once per camera-move frame; it buys nothing for the
   * fully zoomed-out hairball (everything's on screen — that needs batching).
   */
  cull(visibleBounds, padWorld = 0) {
    const rect = {
      x: visibleBounds.x - padWorld,
      y: visibleBounds.y - padWorld,
      width: visibleBounds.width + 2 * padWorld,
      height: visibleBounds.height + 2 * padWorld
    };
    this.setVisibleSet(this.picking.visibleIds(rect));
  }
  /**
   * Declare which elements should be drawn this frame — the per-frame visible
   * set (design G4). **Policy is the engine's**: it decides what is on screen
   * from its own index, and the renderer only applies the answer, which is what
   * keeps culling identical across backends.
   *
   * `null` restores everything (the old `uncull`). Elements outside the picking
   * index — hidden or non-hittable — are left untouched either way, so an
   * explicitly-hidden shape is never revived by a cull pass.
   */
  setVisibleSet(ids) {
    for (const [id, inst] of this.shapeInstances) {
      if (ids === null) inst.shape.gfx.renderable = true;
      else if (this.picking.has(id)) inst.shape.gfx.renderable = ids.has(id);
    }
    for (const [id, inst] of this.connectorInstances) {
      if (ids === null) inst.connector.gfx.renderable = true;
      else if (this.picking.has(id)) inst.connector.gfx.renderable = ids.has(id);
    }
  }
  /** Undo culling — restore `renderable` on every shape / connector. */
  uncull() {
    this.setVisibleSet(null);
  }
  /**
   * Fast-path position-only move — writes the host `gfx` transform directly,
   * skipping BOTH the geometry redraw and the decoration re-anchor that
   * {@link updateShape} performs. This is what `GraphLayer` routes every
   * layout / drag position write through.
   *
   * **Why it's correct to skip both.** A shape's silhouette is traced in
   * shape-local space and `(spec.x, spec.y)` is applied as the host `gfx`
   * translation (`ShapeBase.draw`). Decorations (labels, halos, rings, …) are
   * children of that same `gfx` and anchor to the shape's *local*,
   * position-independent bounds (`refreshShapeDecorations` reads
   * `inst.shape.bounds()`, not world position). So a pure translation needs
   * only `gfx.position.set(x, y)` — it carries the body and every decoration
   * with it for free, reproducing identical geometry. `updateShape` instead
   * re-tessellates and re-anchors on every move; profiling a ~500-node force
   * settle showed the decoration re-anchor alone was ~2.2 ms/tick (~90 % of
   * the per-move cost) while the translation itself is ~0.05 ms.
   *
   * **Hit-bounds are deferred** — like {@link scaleShape}, the per-call rbush
   * update is skipped (O(N) remove+insert → O(N²) over a full sweep). Moved
   * ids accumulate in `movedShapeHits` and are bulk-reindexed lazily on the
   * next {@link hitTest} (or eagerly via {@link reindexScaledShapeHits}).
   *
   * Badges are separate shape instances (NOT children of the host `gfx`), so
   * the transform can't carry them — they're re-anchored here when present.
   */
  moveShape(id, x2, y2) {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    const pos = inst.spec;
    pos.x = x2;
    pos.y = y2;
    if (inst.displayOverride !== null) {
      inst.shape.gfx.position.set(x2 + inst.drawnDx, y2 + inst.drawnDy);
    } else {
      inst.shape.gfx.position.set(x2, y2);
    }
    this.picking.markShapeMoved(id);
    if (this.badges.has(id)) this.reanchorBadges(id);
  }
  /**
   * Declare the **complete set** of elements that should be lifted above their
   * peers — shapes and connectors alike. The renderer diffs against what it
   * already has lifted, reparenting newcomers into the overlay and dropping
   * everything absent from `ids` back to its home layer.
   *
   * This is the whole raise API: one call, whole-set semantics. It is
   * deliberately *not* a pair of `raise(id)` / `lower(id)` primitives, because
   * those make every caller keep a private ledger of what it touched — and two
   * callers lifting overlapping sets then lower each other's elements, or
   * strand elements in the overlay when one of them stops running. Handing over
   * the full set makes lifting a projection the renderer reconciles, so the
   * only thing a caller has to get right is *what should be up right now*.
   *
   * Purely visual: geometry, transforms and the hit index are untouched
   * (closest-wins hit resolution reads the spec `zIndex` recorded at insert).
   * Reparenting survives redraws — updates mutate the existing `gfx` in place
   * and never re-add it to a layer.
   */
  setRaised(ids) {
    const next = new Set(ids);
    for (const id of this.raisedIds) if (!next.has(id)) this.setLifted(id, false);
    for (const id of next) this.setLifted(id, true);
    this.raisedIds = next;
  }
  /**
   * Move one element between its home layer and {@link overlayLayer}.
   *
   * The two z values are the only ordering the overlay needs: a lifted shape
   * (`1`) sorts above a lifted connector (`0`), so a raised node still covers
   * its own raised edges. Everything else about paint order is decided by the
   * layers themselves.
   */
  setLifted(id, lifted) {
    const shape = this.shapeInstances.get(id);
    const gfx = shape ? shape.shape.gfx : this.connectorInstances.get(id)?.connector.gfx;
    if (!gfx) return;
    const home = shape ? this.shapeLayer : this.connectorLayer;
    const parent = lifted ? this.overlayLayer : home;
    gfx.zIndex = lifted ? shape ? 1 : 0 : 0;
    if (gfx.parent !== parent) parent.addChild(gfx);
    if (shape) {
      const wantsBackdrop = !lifted && shape.spec.plane === "backdrop";
      if (wantsBackdrop) this.backdropPlane.attach(gfx);
      else this.backdropPlane.detach(gfx);
    }
  }
  /**
   * Bulk re-index hit-test bboxes for shapes — pairs with
   * {@link scaleShape} (which intentionally skips per-call hit updates).
   *
   * Passing `ids` confines the reindex to those shapes. Omitting it
   * touches every shape instance. Either way the rbush tree is rebuilt
   * once via `clear + load` rather than N × `remove + insert`.
   *
   * Call on gesture settle (e.g. inside `NodeScaleLODBehaviour`'s
   * trailing-edge `flushReanchor`) so mid-gesture frames stay cheap and
   * hit-test accuracy snaps back the moment the user stops zooming.
   */
  reindexScaledShapeHits(ids) {
    this.picking.reindexShapes(ids);
  }
  /**
   * Recompute the path of every connector. Use after a batch of
   * `scaleShape` calls (e.g. one `NodeScaleLODBehaviour` zoom tick) so
   * connectors re-anchor against the freshly-scaled silhouettes — without
   * this, edges remain anchored to the pre-scale bounds and visibly fall
   * short of the smaller shape.
   *
   * Cheap when paired with the lazy `obstacles` getter in `routePath`:
   * routers that don't read obstacles (e.g. `straight`) skip the
   * `O(shapes)` collection per connector. Routers that *do* read
   * obstacles (`manhattan`, `metro`, `er`) still pay it — pair them with
   * a debounce when re-anchoring on a continuous gesture.
   */
  reanchorAllConnectors() {
    for (const inst of this.connectorInstances.values()) {
      this.recomputeConnectorPath(inst);
    }
  }
  /**
   * Serialise every live shape + connector this renderer holds to an SVG
   * fragment (no `<svg>` wrapper) in world coordinates — the vector projection
   * behind {@link Canvas.exportSVG}. Connectors are emitted first (drawn under
   * shapes), then shapes; each shape/connector's attached `label` decoration is
   * rendered as `<text>`.
   *
   * Coverage caveats (raster export is exact for these) are documented in
   * `export/svgExport.ts`: `image` / `glyph` / `svg` fills, non-label
   * decorations, and effects are not represented in the vector output.
   */
  toSVG() {
    const out = [];
    for (const inst of this.connectorInstances.values()) {
      if (inst.spec.visible === false) continue;
      const label = inst.decorations.get("label")?.style;
      out.push(connectorToSvg(inst.spec, inst.path, inst.strokeWidthScale, label));
    }
    for (const inst of this.shapeInstances.values()) {
      if (inst.spec.visible === false) continue;
      const label = inst.decorations.get("label")?.style;
      out.push(shapeSpecToSvg(inst.spec, label));
    }
    return out.filter(Boolean).join("");
  }
  removeShape(id) {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    const attached = this.badges.get(id);
    if (attached) {
      for (const slot of [...attached.keys()]) this.removeBadge(id, slot);
      this.badges.delete(id);
    }
    for (const deco of inst.decorations.values()) this.disposeDecoration(deco);
    inst.decorations.clear();
    for (const fx of inst.effects.values()) this.disposeEffect(fx);
    inst.effects.clear();
    this.hostsWithEffects.delete(inst);
    this.backdropPlane.detach(inst.shape.gfx);
    inst.shape.destroy();
    this.picking.remove(id);
    this.shapeInstances.delete(id);
    if (this.currentPart?.id === id) this.currentPart = null;
  }
  // ─── Mutation: connectors ───────────────────────────────────────────────
  addConnector(id, spec) {
    if (this.connectorInstances.has(id)) {
      throw new Error(`PrimitivesRenderer.addConnector: id "${id}" already exists`);
    }
    const host = {
      surface: this.connectorLayer,
      shapeRegistry: this.shapeRegistry
    };
    const connector = new Connector(host);
    connector.gfx.label = id;
    this.connectorLayer.addChild(connector.gfx);
    const inst = new ConnectorInstance(id, spec, connector);
    this.connectorInstances.set(id, inst);
    this.recomputeConnectorPath(inst);
    connector.gfx.eventMode = "none";
  }
  updateConnector(id, partial) {
    const inst = this.connectorInstances.get(id);
    if (!inst) return;
    inst.spec = { ...inst.spec, ...partial };
    this.recomputeConnectorPath(inst);
  }
  /**
   * Fast-path render update for connectors — patches the `stroke` spec
   * and redraws on the **existing cached path** without re-running the
   * router / pathStyle / obstacle calculation.
   *
   * `updateConnector` always calls `recomputeConnectorPath`, which builds
   * an obstacle list by iterating every shape in the renderer (line 1271).
   * For a `straight` router with thousands of connectors that's
   * `O(connectors × shapes)` per update — fine for one-off restyles, but
   * lethal during continuous camera-driven reflows (e.g. `ScreenSizeBehaviour`
   * keeping stroke widths pixel-constant across zoom).
   *
   * This skips all of that: the path is unchanged (scale doesn't move
   * any endpoint in world coords), so we just redraw the body on the
   * cached `inst.path` with the new stroke. Use when you know **only**
   * the stroke is changing.
   */
  setConnectorStroke(id, stroke) {
    const inst = this.connectorInstances.get(id);
    if (!inst) return;
    inst.spec = { ...inst.spec, stroke };
    this.drawConnectorInstance(inst);
  }
  /**
   * True iff re-rendering connector `id` with `next` would leave its **geometry**
   * unchanged — everything but the `stroke` matches the current spec. Lets a
   * state-only re-render (hover / select highlight) take the `setConnectorStroke`
   * fast path and skip the re-route + hit-reindex a full `updateConnector` does.
   *
   * Conservative: it compares the whole spec **minus `stroke`**, so any real
   * geometry / marker / router change (or an unknown edge, or a key-order
   * mismatch) returns `false` and the caller does the full update — it can never
   * green-light a stale-geometry fast path.
   */
  connectorGeometryUnchanged(id, next) {
    const inst = this.connectorInstances.get(id);
    if (!inst) return false;
    return connectorGeometryKey(inst.spec) === connectorGeometryKey(next);
  }
  /**
   * Re-route the path for `inst`, trim by aggregated decoration end-padding,
   * redraw the connector body + markers on the trimmed path, and refresh
   * any attached decorations against the new path. Called whenever the
   * spec, decorations, or padding requirements change.
   */
  recomputeConnectorPath(inst) {
    const rawPath = this.routePath(inst.spec);
    const padding = this.aggregateConnectorPadding(inst);
    const srcPad = inst.spec.sourceMarker ? padding.source : 0;
    const tgtPad = inst.spec.targetMarker ? padding.target : 0;
    inst.path = srcPad > 0 || tgtPad > 0 ? trimPathEnds(rawPath, srcPad, tgtPad) : rawPath;
    inst.sampledPolyline = null;
    this.drawConnectorInstance(inst);
    this.indexConnector(inst);
    if (inst.decorations.size > 0) this.refreshConnectorDecorations(inst);
    if (this.badges.has(inst.id)) this.reanchorConnectorBadges(inst, inst.id);
  }
  /**
   * Fast-path render-time stroke multiplier for a connector — writes
   * `inst.strokeWidthScale` and redraws on the cached path.
   *
   * `EdgeScaleLODBehaviour` uses this each `camera:zoom` frame to keep
   * spec stroke widths pixel-constant across zoom. Critically, it does
   * **not** touch `spec.stroke.width`: the canonical spec stays as the
   * caller authored it, so a downstream `setConnectorStroke` (or a state-
   * config-driven `updateConnector` rebuild via `GraphLayer.rerenderEdge`)
   * supplies the new "base" width and the LOD multiplier applies on top
   * — no clobber, no inversion of caller intent.
   *
   * Path / obstacles / decorations are unchanged by a stroke-only
   * rescale, so this is the same shape as `setConnectorStroke`: skip
   * `recomputeConnectorPath`, just redraw on the cached path.
   */
  scaleConnectorStroke(id, scale) {
    const inst = this.connectorInstances.get(id);
    if (!inst) return;
    inst.strokeWidthScale = scale;
    this.drawConnectorInstance(inst);
  }
  /**
   * Draw a connector with `inst.strokeWidthScale` baked into the spec's
   * stroke width. The original `inst.spec` is unchanged — only the spec
   * handed to `inst.connector.draw` carries the scaled width.
   *
   * The multiplication also flows through markers (sized off the stroke
   * width via `*Scale` multipliers) and the trimmed body path (computed
   * from stroke width), so the whole connector visual scales coherently.
   */
  drawConnectorInstance(inst) {
    const k2 = inst.strokeWidthScale;
    const stroke = inst.spec.stroke;
    if (k2 === 1 || !stroke || stroke.width === void 0) {
      inst.connector.draw(inst.spec, inst.path);
      return;
    }
    const scaledSpec = {
      ...inst.spec,
      stroke: { ...stroke, width: stroke.width * k2 }
    };
    inst.connector.draw(scaledSpec, inst.path);
  }
  /**
   * Max end-padding across every decoration attached to `inst`. Decorations
   * declare their outer extent via `getEndPadding()`; we take the max per
   * endpoint so a glow with radius 16 and a ripple with maxRadius 24 on the
   * same edge result in a 24-px inset at each end (both reach the anchor;
   * the glow stops 8 px short, which is the intended "smaller halo" look).
   */
  aggregateConnectorPadding(inst) {
    let src = 0;
    let tgt = 0;
    for (const deco of inst.decorations.values()) {
      if (typeof deco.getEndPadding !== "function") continue;
      const p = deco.getEndPadding();
      if (p.source > src) src = p.source;
      if (p.target > tgt) tgt = p.target;
    }
    return { source: src, target: tgt };
  }
  /**
   * Max resting outer extent across every shape decoration attached to
   * `inst`. Read by `LabelDecoration` (via `ShapeDecorationHostInfo`) so
   * outside-placement labels offset past the outermost ring / halo on the
   * host. Decorations that don't paint past the silhouette (label,
   * marching-ants) omit `getOuterExtent` and contribute `0`; animated
   * transients (pulse-ring) deliberately report `0` so the label doesn't
   * yo-yo with the pulse.
   */
  aggregateShapeOuterExtent(inst) {
    let max = 0;
    for (const deco of inst.decorations.values()) {
      if (typeof deco.getOuterExtent !== "function") continue;
      const v2 = deco.getOuterExtent();
      if (v2 > max) max = v2;
    }
    return max;
  }
  removeConnector(id) {
    const inst = this.connectorInstances.get(id);
    if (!inst) return;
    const attached = this.badges.get(id);
    if (attached) {
      for (const slot of [...attached.keys()]) this.removeBadge(id, slot);
      this.badges.delete(id);
    }
    for (const deco of inst.decorations.values()) this.disposeDecoration(deco);
    inst.decorations.clear();
    for (const fx of inst.effects.values()) this.disposeEffect(fx);
    inst.effects.clear();
    this.connectorHostsWithEffects.delete(inst);
    this.picking.remove(id);
    inst.connector.destroy();
    this.connectorInstances.delete(id);
  }
  // ─── Decorations ────────────────────────────────────────────────────────
  setDecoration(targetId, slot, decoration) {
    const shape = this.shapeInstances.get(targetId);
    const connector = this.connectorInstances.get(targetId);
    if (!shape && !connector) {
      throw new Error(`PrimitivesRenderer.setDecoration: unknown target "${targetId}"`);
    }
    const decorations = (shape ?? connector).decorations;
    const prev = decorations.get(slot);
    if (prev) this.disposeDecoration(prev);
    if (decoration === null) {
      decorations.delete(slot);
      if (connector) this.recomputeConnectorPath(connector);
      if (shape) this.refreshShapeDecorations(shape);
      return;
    }
    const entry = this.decorationRegistry.get(decoration.kind);
    if (!entry) {
      throw new Error(`PrimitivesRenderer.setDecoration: unknown kind "${decoration.kind}"`);
    }
    const targetKind = shape ? "shape" : "connector";
    if (entry.target !== "both" && entry.target !== targetKind) {
      throw new Error(
        `PrimitivesRenderer.setDecoration: kind "${decoration.kind}" targets "${entry.target}" but host is a ${targetKind}`
      );
    }
    const z2 = slotZIndex(slot, decoration.kind);
    if (shape) {
      const ctor = entry.ctor;
      const deco = new ctor(decoration.style);
      labelDecoration(deco, decoration.kind);
      shape.shape.gfx.sortableChildren = true;
      decorations.set(slot, deco);
      const outerDecorationExtent = this.aggregateShapeOuterExtent(shape);
      const host = {
        hostId: targetId,
        slot,
        slotZIndex: z2,
        bounds: shape.shape.bounds(),
        surface: shape.shape.gfx,
        shape: shape.shape,
        outerDecorationExtent
      };
      deco.mount(host);
      if (typeof deco.tick === "function") {
        this.animated.add(deco);
      }
      if (decoHasSetResolution(deco)) this.labelBearingDecorations.add(deco);
      this.applyTrackedLabelResolution(deco);
      if (slot === "label") {
        this.applyShapeLabelVisibility(shape);
        if (this.labelSizePolicies.shape !== null) this.sizeShapeLabel(shape, this.camera.scale);
      }
      this.refreshShapeDecorations(shape, deco);
    } else {
      const ctor = entry.ctor;
      const deco = new ctor(decoration.style);
      labelDecoration(deco, decoration.kind);
      connector.connector.gfx.sortableChildren = true;
      const host = {
        hostId: targetId,
        slot,
        slotZIndex: z2,
        path: connector.path,
        surface: connector.connector.gfx,
        connector: connector.connector,
        connectorSpec: connector.spec
      };
      deco.mount(host);
      decorations.set(slot, deco);
      if (typeof deco.tick === "function") {
        this.animated.add(deco);
      }
      if (decoHasSetResolution(deco)) this.labelBearingDecorations.add(deco);
      this.applyTrackedLabelResolution(deco);
      if (slot === "label") {
        this.applyConnectorLabelVisibility(connector);
        if (this.labelSizePolicies.connector !== null) {
          this.sizeConnectorLabel(connector, this.camera.scale);
        }
      }
      this.recomputeConnectorPath(connector);
    }
  }
  // ─── Effects ────────────────────────────────────────────────────────────
  /**
   * Attach (or detach with `null`) an effect to a shape at the given slot.
   * Effects don't draw — they modulate the host shape's transform and/or
   * style. Multiple effects per host stack: transform deltas compose
   * additively (translations + rotation) and multiplicatively (scale);
   * style channels are last-writer-wins per channel by insertion order.
   *
   * Connector effects are supported and modulate the host connector's
   * style channels (tint + alpha). Transform deltas on a path-resolved
   * primitive have no coherent meaning, so transform effects on connector
   * hosts are ignored at aggregation time.
   */
  setEffect(targetId, slot, effect) {
    const shape = this.shapeInstances.get(targetId);
    if (shape) {
      this.setShapeEffect(shape, targetId, slot, effect);
      return;
    }
    const connector = this.connectorInstances.get(targetId);
    if (connector) {
      this.setConnectorEffect(connector, targetId, slot, effect);
      return;
    }
    throw new Error(`PrimitivesRenderer.setEffect: unknown target "${targetId}"`);
  }
  setShapeEffect(shape, targetId, slot, effect) {
    const prev = shape.effects.get(slot);
    if (prev) this.disposeEffect(prev);
    if (effect === null) {
      shape.effects.delete(slot);
      if (shape.effects.size === 0) {
        this.hostsWithEffects.delete(shape);
        this.resetHostToBaseline(shape);
      }
      return;
    }
    const entry = this.effectRegistry.get(effect.kind);
    if (!entry) {
      throw new Error(`PrimitivesRenderer.setEffect: unknown kind "${effect.kind}"`);
    }
    if (entry.target !== "both" && entry.target !== "shape") {
      throw new Error(
        `PrimitivesRenderer.setEffect: kind "${effect.kind}" targets "${entry.target}" but host is a shape`
      );
    }
    const fx = new entry.ctor(effect.style);
    const host = {
      hostId: targetId,
      slot,
      bounds: shape.shape.bounds(),
      shape: shape.shape
    };
    fx.mount(host);
    shape.effects.set(slot, fx);
    this.hostsWithEffects.add(shape);
    if (typeof fx.tick === "function") {
      this.animatedEffects.add(fx);
    }
    this.applyEffectsToHost(shape);
  }
  setConnectorEffect(connector, targetId, slot, effect) {
    const prev = connector.effects.get(slot);
    if (prev) this.disposeEffect(prev);
    if (effect === null) {
      connector.effects.delete(slot);
      if (connector.effects.size === 0) {
        this.connectorHostsWithEffects.delete(connector);
        this.resetConnectorToBaseline(connector);
      }
      return;
    }
    const entry = this.effectRegistry.get(effect.kind);
    if (!entry) {
      throw new Error(`PrimitivesRenderer.setEffect: unknown kind "${effect.kind}"`);
    }
    if (entry.target !== "both" && entry.target !== "connector") {
      throw new Error(
        `PrimitivesRenderer.setEffect: kind "${effect.kind}" targets "${entry.target}" but host is a connector`
      );
    }
    const fx = new entry.ctor(effect.style);
    const host = {
      hostId: targetId,
      slot,
      connector: connector.connector
    };
    fx.mount(host);
    connector.effects.set(slot, fx);
    this.connectorHostsWithEffects.add(connector);
    if (typeof fx.tick === "function") {
      this.animatedEffects.add(fx);
    }
    this.applyEffectsToConnector(connector);
  }
  // ─── Badges ─────────────────────────────────────────────────────────────
  /**
   * Attach a badge to a host shape. The badge is registered as a real shape
   * under id `` `${hostId}:${slot}` `` so it inherits every shape capability —
   * any registered shape kind as the plate, any `ShapeFillLayer` as content
   * (solid / image / glyph / svg / svg-url), and any registered decoration
   * via the `decorations` field.
   *
   * On `updateShape(hostId, …)` every attached badge re-anchors automatically.
   * On `removeShape(hostId)` every attached badge is removed first.
   *
   * Calling `setBadge` with the same `(hostId, slot)` replaces the previous
   * badge (the old badge shape and any of its decorations are destroyed).
   */
  setBadge(hostId, slot, options) {
    const shapeHost = this.shapeInstances.get(hostId);
    const connectorHost = shapeHost ? void 0 : this.connectorInstances.get(hostId);
    if (!shapeHost && !connectorHost) {
      throw new Error(`PrimitivesRenderer.setBadge: unknown host "${hostId}"`);
    }
    const badgeId = badgeIdFor(hostId, slot);
    if (this.shapeInstances.has(badgeId)) this.removeShape(badgeId);
    this.addShape(badgeId, { ...options.shape, x: 0, y: 0 });
    const badge = this.shapeInstances.get(badgeId);
    badge.isBadge = true;
    if (shapeHost) {
      const pos = resolveBadgePosition(
        this.shapeWorldBounds(shapeHost),
        badge.shape.bounds(),
        options
      );
      this.updateShape(badgeId, { x: pos.x, y: pos.y });
    } else {
      const clearance = this.connectorBadgeEndpointClearance(connectorHost);
      const pos = resolveConnectorBadgePosition(
        connectorHost.path,
        badge.shape.bounds(),
        options,
        clearance
      );
      this.updateShape(badgeId, { x: pos.x, y: pos.y, rotation: pos.rotation });
    }
    if (options.decorations) {
      for (const [decoSlot, decoSpec] of Object.entries(options.decorations)) {
        this.setDecoration(badgeId, decoSlot, decoSpec);
      }
    }
    if (options.effects) {
      for (const [effectSlot, effectSpec] of Object.entries(options.effects)) {
        this.setEffect(badgeId, effectSlot, effectSpec);
      }
    }
    let map = this.badges.get(hostId);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      this.badges.set(hostId, map);
    }
    map.set(slot, options);
  }
  removeBadge(hostId, slot) {
    const map = this.badges.get(hostId);
    if (!map || !map.has(slot)) return;
    const badgeId = badgeIdFor(hostId, slot);
    this.removeShape(badgeId);
    map.delete(slot);
    if (map.size === 0) this.badges.delete(hostId);
  }
  hasBadge(hostId, slot) {
    return this.badges.get(hostId)?.has(slot) ?? false;
  }
  /**
   * Recompute every attached badge's `(x, y)` from the host's new bounds.
   * Called from `updateShape` when the host has badges; safe to no-op when
   * the badge map for `hostId` is empty. Shape-host flavour only; see
   * {@link reanchorConnectorBadges} for the connector-path flavour.
   */
  reanchorBadges(hostId) {
    const map = this.badges.get(hostId);
    if (!map) return;
    const host = this.shapeInstances.get(hostId);
    if (!host) return;
    const hostBounds = this.shapeWorldBounds(host);
    for (const [slot, options] of map) {
      const badge = this.shapeInstances.get(badgeIdFor(hostId, slot));
      if (!badge) continue;
      const pos = resolveBadgePosition(hostBounds, badge.shape.bounds(), options);
      this.updateShape(badgeIdFor(hostId, slot), { x: pos.x, y: pos.y });
    }
  }
  /**
   * Recompute every attached badge's `(x, y, rotation)` from the connector
   * host's new path. Called from {@link recomputeConnectorPath} whenever
   * the routed path changes (source / target shape moved, anchor / router /
   * waypoints reconfigured, marker insets adjusted).
   */
  reanchorConnectorBadges(inst, hostId) {
    const map = this.badges.get(hostId);
    if (!map) return;
    const clearance = this.connectorBadgeEndpointClearance(inst);
    for (const [slot, options] of map) {
      const badge = this.shapeInstances.get(badgeIdFor(hostId, slot));
      if (!badge) continue;
      const pos = resolveConnectorBadgePosition(
        inst.path,
        badge.shape.bounds(),
        options,
        clearance
      );
      this.updateShape(badgeIdFor(hostId, slot), {
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation
      });
    }
  }
  /**
   * Per-endpoint clearance to apply when an endpoint-anchored badge sits
   * on a connector — marker length (so the arrowhead isn't tucked under
   * the badge) plus {@link DEFAULT_ENDPOINT_BADGE_GAP_PX} of visual gap.
   *
   * Independent of decoration `getEndPadding()` (which feeds path-trim
   * for the body stroke); markers paint at the *untrimmed* endpoints, so
   * we have to look at the marker spec directly.
   */
  connectorBadgeEndpointClearance(inst) {
    const strokeWidth = inst.spec.stroke?.width ?? 1;
    const sourceMarkerInset = inst.spec.sourceMarker ? markerInsetFor(this.shapeRegistry, inst.spec.sourceMarker, strokeWidth) : 0;
    const targetMarkerInset = inst.spec.targetMarker ? markerInsetFor(this.shapeRegistry, inst.spec.targetMarker, strokeWidth) : 0;
    return {
      source: sourceMarkerInset + DEFAULT_ENDPOINT_BADGE_GAP_PX,
      target: targetMarkerInset + DEFAULT_ENDPOINT_BADGE_GAP_PX
    };
  }
  // ─── LOD / labels ───────────────────────────────────────────────────────
  setLODLevel(id, level) {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    if (inst.shape.setLODLevel) {
      inst.shape.setLODLevel(level);
      return;
    }
    inst.shape.gfx.visible = level > 0;
  }
  rasteriseLabel(id, resolution) {
    const inst = this.shapeInstances.get(id);
    if (!inst) return;
    inst.shape.setLabelResolution?.(resolution);
  }
  /**
   * Push a rasterisation resolution to every label decoration (shape + edge)
   * currently attached, and remember it so labels mounted later inherit the
   * same fidelity. Driven by zoom-aware behaviours
   * (see `@invana/graph` / `TextResolutionLODBehaviour`): when the camera
   * zooms past a threshold, push `dpr * zoom` to re-rasterise glyphs sharp.
   *
   * Idempotent: Pixi internally short-circuits `Text.resolution` writes when
   * the value matches, so calling this with the unchanged value every frame
   * is safe and cheap.
   */
  setLabelsResolution(resolution) {
    if (!Number.isFinite(resolution) || resolution <= 0) return;
    if (this.trackedLabelResolution === resolution) return;
    this.trackedLabelResolution = resolution;
    for (const inst of this.shapeInstances.values()) inst.shape.setLabelResolution?.(resolution);
  }
  /**
   * Forward the tracked label resolution to `deco` when it exposes a
   * `setResolution` method. Called on every label mount (so a newly-added
   * label inherits the current resolution immediately, no waiting for the
   * next tier-change to populate it).
   */
  applyTrackedLabelResolution(deco) {
    if (this.trackedLabelResolution === null) return;
    const withResolution = deco;
    withResolution.setResolution?.(this.trackedLabelResolution);
  }
  /**
   * Set (or clear) how the `'label'` decorations of every shape / connector are
   * sized across camera zoom — see {@link IElementRenderer.setLabelSizePolicy}.
   * Applied on the next frame tick, then again whenever the camera scale moves;
   * labels mounted later and hosts re-scaled by `scaleShape` are sized as they
   * change. Badge text and a shape's internal text are never touched.
   */
  setLabelSizePolicy(target, policy) {
    if (sameLabelSizePolicy(this.labelSizePolicies[target], policy)) return;
    this.labelSizePolicies[target] = policy;
    this.labelSizeDirty[target] = true;
  }
  /**
   * Re-size labels when a policy changed or the camera scale moved under an
   * active policy. A zoom frame sizes only the labels **on screen** (one
   * transform write each, like a node-size LOD's `scaleShape`) and queues the
   * rest; frames where the zoom holds still keep the on-screen set current and
   * size a chunk of the queue, so off-screen labels converge within a few frames
   * and the per-frame cost tracks what is visible, not the graph size. Labels a
   * label LOD hides are skipped and sized when shown again.
   */
  tickLabelSizes() {
    const zoom = this.camera.scale;
    const zoomMoved = zoom !== this.labelSizeZoom;
    const shapes = this.labelSizeDirty.shape || this.labelSizePolicies.shape !== null && zoomMoved;
    const connectors = this.labelSizeDirty.connector || this.labelSizePolicies.connector !== null && zoomMoved;
    const backlog = this.labelSizeBacklog;
    if (!shapes && !connectors && backlog.shape === null && backlog.connector === null) return;
    this.labelSizeZoom = zoom;
    if (shapes) {
      this.labelSizeDirty.shape = false;
      backlog.shape = this.shapeInstances.values();
    }
    if (connectors) {
      this.labelSizeDirty.connector = false;
      backlog.connector = this.connectorInstances.values();
    }
    const v2 = this.camera.getVisibleBounds();
    const view = {
      x: v2.x - v2.width * 0.1,
      y: v2.y - v2.height * 0.1,
      width: v2.width * 1.2,
      height: v2.height * 1.2
    };
    if (backlog.shape !== null) {
      for (const inst of this.shapeInstances.values()) {
        if (pointInRect(inst.spec.x, inst.spec.y, view)) this.sizeShapeLabel(inst, zoom);
      }
    }
    if (backlog.connector !== null) {
      for (const inst of this.connectorInstances.values()) {
        if (pathInRect(inst.path, view)) this.sizeConnectorLabel(inst, zoom);
      }
    }
    if (shapes || connectors) return;
    let budget = _PrimitivesRenderer.LABEL_SIZE_PER_TICK;
    while (budget > 0 && backlog.shape !== null) {
      const next = backlog.shape.next();
      if (next.done) backlog.shape = null;
      else {
        this.sizeShapeLabel(next.value, zoom);
        budget--;
      }
    }
    while (budget > 0 && backlog.connector !== null) {
      const next = backlog.connector.next();
      if (next.done) backlog.connector = null;
      else {
        this.sizeConnectorLabel(next.value, zoom);
        budget--;
      }
    }
  }
  /**
   * Size one shape's `'label'` decoration under the shape policy. The host scale
   * is the shape's LOD scale ({@link ShapeInstance.gfxScale}) — cancelled by the
   * policy — and **not** its display override's, so a fisheye lens still
   * magnifies the label. Skips badge plates (their text is the badge) and, under
   * a policy, labels the text LOD hides — {@link setShapeTextVisible} sizes those
   * when they come back. Collision-hidden labels are still sized: collision
   * measures them to decide whether to show them again.
   */
  sizeShapeLabel(inst, zoom) {
    const policy = this.labelSizePolicies.shape;
    if (inst.isBadge) return;
    if (policy !== null && !inst.textWanted && inst.displayOverride?.showText !== true) return;
    const label = inst.decorations.get("label");
    if (!(label instanceof LabelDecoration)) return;
    label.setTextScale(
      resolveLabelScale(label.textFontSize(), zoom, inst.gfxScale, policy, label.isContained())
    );
  }
  /** Connector analogue of {@link sizeShapeLabel}; a connector's gfx is unscaled and never contains its label. */
  sizeConnectorLabel(inst, zoom) {
    const policy = this.labelSizePolicies.connector;
    if (policy !== null && !inst.textWanted) return;
    const label = inst.decorations.get("label");
    if (!(label instanceof LabelConnectorDecoration)) return;
    label.setTextScale(resolveLabelScale(label.textFontSize(), zoom, 1, policy));
  }
  // ─── Per-frame animation ────────────────────────────────────────────────
  tickAnimations(deltaMs) {
    if (this.animated.size > 0) {
      for (const deco of this.animated) {
        const keep = deco.tick(deltaMs);
        if (!keep) this.animated.delete(deco);
      }
    }
    if (this.animatedEffects.size > 0) {
      for (const fx of this.animatedEffects) {
        const keep = fx.tick(deltaMs);
        if (!keep) this.animatedEffects.delete(fx);
      }
    }
    if (this.hostsWithEffects.size > 0) {
      for (const host of this.hostsWithEffects) {
        this.applyEffectsToHost(host);
      }
    }
    if (this.connectorHostsWithEffects.size > 0) {
      for (const host of this.connectorHostsWithEffects) {
        this.applyEffectsToConnector(host);
      }
    }
    this.tickLabelSizes();
    if (this.trackedLabelResolution !== null && this.labelBearingDecorations.size > 0) {
      this.tickLabelRasterise();
    }
  }
  /**
   * Re-raster labels whose current resolution differs from the tracked
   * target, prioritising those currently inside the camera viewport so the
   * tier crossing reads as a fade-into-crispness on what the user is
   * looking at. Off-screen labels are deferred to subsequent ticks but
   * *not* skipped forever — once the in-view set converges, remaining
   * budget rolls over to off-screen labels so panning later lands on
   * already-crisp text. Bounds that come back degenerate (Infinity AABB
   * from a container that hasn't laid out yet) fall through to the second
   * pass and are treated as off-screen for this tick.
   *
   * Convergence: once every label matches the target, the loop is O(N)
   * `getResolution` checks per frame with zero texture work — negligible.
   */
  tickLabelRasterise() {
    const target = this.trackedLabelResolution;
    if (target === null) return;
    const viewport = this.camera.getVisibleBounds();
    let budget = _PrimitivesRenderer.LABEL_RASTER_PER_TICK;
    const offscreen = [];
    for (const deco of this.labelBearingDecorations) {
      if (budget <= 0) break;
      const withRes = deco;
      if (withRes.getResolution?.() === target) continue;
      const bounds = withRes.gfx?.getBounds?.();
      const inView = bounds !== void 0 && isFiniteRect(bounds) && rectsIntersect(bounds, viewport);
      if (inView) {
        withRes.setResolution(target);
        budget--;
      } else {
        offscreen.push(withRes);
      }
    }
    for (const deco of offscreen) {
      if (budget <= 0) break;
      deco.setResolution(target);
      budget--;
    }
  }
  /**
   * Aggregate every effect attached to `inst` and write the result onto the
   * host gfx. Resets to the spec baseline first so removing effects (or a
   * scale dropping to identity) cleanly reverts. Called every frame for
   * hosts with at least one effect, and synchronously on `setEffect` so
   * non-animated effects take effect immediately.
   */
  applyEffectsToHost(inst) {
    const { gfx } = inst.shape;
    const spec = inst.spec;
    const baseAlpha = spec.alpha ?? 1;
    const baseX = spec.x;
    const baseY = spec.y;
    let dx = 0;
    let dy = 0;
    let dRot = 0;
    let sx = 1;
    let sy = 1;
    let tint = 16777215;
    let alphaMul = 1;
    for (const fx of inst.effects.values()) {
      if (fx.target === "transform" && fx.readTransform) {
        const d2 = fx.readTransform();
        if (d2.dx) dx += d2.dx;
        if (d2.dy) dy += d2.dy;
        if (d2.dRot) dRot += d2.dRot;
        if (d2.sx !== void 0) sx *= d2.sx;
        if (d2.sy !== void 0) sy *= d2.sy;
      } else if (fx.target === "style" && fx.readStyle) {
        const s = fx.readStyle();
        if (s.tint !== void 0) tint = s.tint;
        if (s.alpha !== void 0) alphaMul *= s.alpha;
      }
    }
    const needsCentredPivot = sx !== 1 || sy !== 1 || dRot !== 0;
    if (inst.displayOverride !== null) {
      const b2 = inst.shape.bounds();
      const cx = b2.x + b2.width / 2;
      const cy = b2.y + b2.height / 2;
      const s = inst.drawnScale;
      gfx.pivot.set(cx, cy);
      gfx.position.set(baseX + inst.drawnDx + s * cx + dx, baseY + inst.drawnDy + s * cy + dy);
      sx *= s;
      sy *= s;
    } else if (needsCentredPivot) {
      const b2 = inst.shape.bounds();
      const cx = b2.x + b2.width / 2;
      const cy = b2.y + b2.height / 2;
      gfx.pivot.set(cx, cy);
      gfx.position.set(baseX + dx + cx, baseY + dy + cy);
    } else {
      gfx.pivot.set(0, 0);
      gfx.position.set(baseX + dx, baseY + dy);
    }
    gfx.rotation = (spec.rotation ?? 0) + dRot;
    gfx.scale.set(sx, sy);
    gfx.alpha = baseAlpha * alphaMul;
    gfx.tint = tint;
  }
  /**
   * Aggregate every effect attached to a connector and write the result onto
   * `connector.gfx`. Resets to the spec baseline first so removing effects
   * cleanly reverts. Only style channels are honoured for connector hosts
   * (transform deltas on a path-resolved primitive have no coherent
   * meaning); transform effects on connectors contribute nothing.
   */
  applyEffectsToConnector(inst) {
    const { gfx } = inst.connector;
    const baseAlpha = inst.spec.alpha ?? 1;
    let tint = 16777215;
    let alphaMul = 1;
    for (const fx of inst.effects.values()) {
      if (fx.target === "style" && fx.readStyle) {
        const s = fx.readStyle();
        if (s.tint !== void 0) tint = s.tint;
        if (s.alpha !== void 0) alphaMul *= s.alpha;
      }
    }
    gfx.alpha = baseAlpha * alphaMul;
    gfx.tint = tint;
  }
  resetConnectorToBaseline(inst) {
    const { gfx } = inst.connector;
    gfx.alpha = inst.spec.alpha ?? 1;
    gfx.tint = 16777215;
  }
  /** Restore the host gfx to its spec-derived baseline (used after the last effect is removed). */
  resetHostToBaseline(inst) {
    const { gfx } = inst.shape;
    const spec = inst.spec;
    gfx.pivot.set(0, 0);
    gfx.position.set(spec.x, spec.y);
    gfx.rotation = spec.rotation ?? 0;
    gfx.scale.set(1, 1);
    gfx.alpha = spec.alpha ?? 1;
    gfx.tint = 16777215;
    if (inst.displayOverride !== null) this.applyDisplayTransform(inst);
  }
  // ─── Hit-testing + pointer router ────────────────────────────────────
  /**
   * Resolve the hit at a world point under render-order rules. Two
   * priority bands:
   *
   *   1. **Exact geometric hits** — any candidate whose
   *      `IHitArea.contains` (shapes) or stroke-tolerance polyline
   *      distance (connectors) covers the cursor. Ranked to match what
   *      is drawn on top:
   *        a. higher `zIndex` wins (mirrors visual stacking);
   *        b. on equal `zIndex`, a shape (node) beats a connector (edge)
   *           — shapes render above connectors;
   *        c. on equal `zIndex` *and* same kind, the closest one to its
   *           origin / polyline wins.
   *      So a node sitting over an edge takes the hit even when the edge's
   *      polyline passes nearer the cursor than the node's centre — and an
   *      edge with an explicitly higher `zIndex` still wins.
   *   2. **Floor fallback** — if NO exact hit, return the closest
   *      candidate whose origin sits within `hitFloorPx` screen pixels
   *      of the cursor. Lets tiny pinpoints stay hoverable in sparse
   *      regions without widening hit areas in dense ones.
   *
   * Returns `null` when nothing is hit.
   */
  /**
   * Enable / disable all picking for this renderer. When disabled, {@link hitTest}
   * returns `null` regardless of what's under the cursor — the owning layer flips
   * this from `onVisibleChange` so a hidden layer's elements aren't clickable.
   */
  setHitTestEnabled(enabled) {
    this.picking.setEnabled(enabled);
  }
  hitTest(worldX, worldY, exclude) {
    return this.picking.hitTest(worldX, worldY, exclude);
  }
  // ─── HitGeometrySource — this renderer's half of the picking contract ─────
  /**
   * The facts about a shape that a spec can't carry: the visual scale a LOD
   * behaviour wrote onto `gfx` without rebuilding geometry, and — for a
   * `registerShape` custom kind the spec vocabulary has never heard of — the
   * instance's own silhouette and local bounds.
   *
   * `gfxScale` matters because `NodeScaleLODBehaviour` (and
   * `HoverActivateBehaviour.zoomedOutScale`) inflate a shape visually without
   * touching its spec; the index divides world deltas by it before the narrow
   * phase, so a 5×-scaled shape whose silhouette covers the cursor still picks.
   */
  shapeRecord(id) {
    const inst = this.shapeInstances.get(id);
    if (!inst) return null;
    return {
      // A display-overridden shape is picked where it is *drawn*. The copy is
      // made only for overridden shapes (a lens holds a handful), so the
      // common path stays allocation-free.
      spec: inst.displayOverride === null ? inst.spec : { ...inst.spec, x: inst.spec.x + inst.drawnDx, y: inst.spec.y + inst.drawnDy },
      scale: inst.drawnScale,
      containsLocal: (x2, y2) => inst.shape.getHitArea().contains(x2, y2),
      localBounds: () => inst.shape.bounds()
    };
  }
  /**
   * A connector's spec plus its **routed, sampled** polyline. Routing happens
   * here (the router registry is renderer-side), and the sample is memoised on
   * the instance, so this is a cheap read per query.
   */
  connectorRecord(id) {
    const inst = this.connectorInstances.get(id);
    if (!inst) return null;
    return { spec: inst.spec, polyline: this.sampledConnectorPolyline(inst) };
  }
  shapeIds() {
    return this.shapeInstances.keys();
  }
  /**
   * Hover-specific pick — {@link hitTest}'s winner refined by the index's two
   * hover heuristics (node-incidence bias and hysteresis; see
   * `PickingIndex.pickHover`). **Click / drag picking deliberately stays on the
   * raw {@link hitTest}** — a press must resolve exactly what is under the
   * cursor, with no memory of the last hover — so this is called only from
   * {@link routePointerMove}.
   *
   * `currentHover` is passed in rather than read by the index: hover is
   * interaction bookkeeping this renderer owns, and the index stays a pure
   * query surface.
   */
  pickHover(worldX, worldY) {
    return this.picking.pickHover(worldX, worldY, this.currentHover);
  }
  /**
   * Hover-path pick at a point already expressed in **this surface's own
   * space** (world coordinates for a `world` surface, screen pixels for a
   * `screen` one). Exposed for {@link PixiPointerRouter}, which owns the
   * single canvas-wide hit walk and asks each surface in turn.
   *
   * Uses the hysteresis-aware {@link pickHover}; press picking uses the raw
   * {@link hitTest} instead, for the reason documented on {@link pickHover}.
   */
  pickHoverAt(x2, y2) {
    return this.pickHover(x2, y2);
  }
  /**
   * Apply a resolved hover for this surface: diff it against the currently
   * hovered target and emit `pointerover` / `pointerout`, plus the sub-part
   * `partover` / `partout` stream.
   *
   * The router calls this on **every** registered surface each move frame —
   * with the resolved hit on the one that won the pick and `null` on all the
   * others — so a surface that loses the pick correctly un-hovers whatever it
   * was holding. Cursor styling is the router's, not ours: only it knows which
   * surface won.
   */
  dispatchMove(hit, x2, y2) {
    const prev = this.currentHover;
    this.updatePartHover(hit, x2, y2);
    if (hit === null) {
      if (prev) {
        this.events.emit(`${prev.kind}:pointerout`, { id: prev.id, worldX: x2, worldY: y2 });
        this.currentHover = null;
      }
      return;
    }
    if (prev && prev.kind === hit.kind && prev.id === hit.id) return;
    if (prev) {
      this.events.emit(`${prev.kind}:pointerout`, { id: prev.id, worldX: x2, worldY: y2 });
    }
    this.events.emit(`${hit.kind}:pointerover`, { id: hit.id, worldX: x2, worldY: y2 });
    this.currentHover = hit;
  }
  /**
   * This surface won the press: emit `shape:pointerdown` / `connector:pointerdown`
   * and remember the target so {@link dispatchUp} can gate the click.
   */
  dispatchDown(hit, x2, y2, button, pointerId) {
    this.events.emit(`${hit.kind}:pointerdown`, {
      id: hit.id,
      worldX: x2,
      worldY: y2,
      button,
      pointerId
    });
    this.downHit = { kind: hit.kind, id: hit.id, button };
  }
  /**
   * This surface won the release: emit `pointerup`, then — when the press
   * landed on the same target with the same button — `click` / `doubleclick`
   * (left) or the context-menu pair (right).
   */
  dispatchUp(hit, x2, y2, button, pointerId) {
    this.events.emit(`${hit.kind}:pointerup`, {
      id: hit.id,
      worldX: x2,
      worldY: y2,
      button,
      pointerId
    });
    const down = this.downHit;
    this.downHit = null;
    if (!down) return;
    if (down.kind !== hit.kind || down.id !== hit.id) return;
    if (down.button !== button) return;
    if (button === 0) {
      this.events.emit(`${hit.kind}:click`, { id: hit.id, worldX: x2, worldY: y2, button: 0 });
      const now = performance.now();
      const last = this.lastLeftClick;
      if (last && last.kind === hit.kind && last.id === hit.id && now - last.t < 350) {
        this.events.emit(`${hit.kind}:doubleclick`, { id: hit.id, worldX: x2, worldY: y2, button: 0 });
        this.lastLeftClick = null;
      } else {
        this.lastLeftClick = { kind: hit.kind, id: hit.id, t: now };
      }
    } else if (button === 2) {
      const partId = this.partIdAt(hit, x2, y2);
      if (partId !== void 0) {
        this.events.emit("shape:partcontextmenu", { id: hit.id, partId, worldX: x2, worldY: y2 });
      } else {
        this.events.emit(`${hit.kind}:contextmenu`, { id: hit.id, worldX: x2, worldY: y2 });
      }
    }
  }
  /**
   * The press or release resolved somewhere else (another surface, or empty
   * canvas). Drop the captured press so a later release on *this* surface
   * can't synthesise a click out of two unrelated halves of a gesture.
   */
  clearDown() {
    this.downHit = null;
  }
  /**
   * Nothing anywhere was hit on a right-button release. The router fans this
   * to every surface so per-layer subscribers (`ContextMenuBehaviour` listens
   * on its own layer's renderer) keep receiving it as they did when each
   * surface routed its own input.
   */
  emitBackgroundContextMenu(x2, y2) {
    this.events.emit("background:contextmenu", { worldX: x2, worldY: y2 });
  }
  /** Is a press currently captured on this surface? Read by the router for cursor gating. */
  get hasCapturedPress() {
    return this.downHit !== null;
  }
  /**
   * Resolve the `hitId` of the sub-part under a point, or `undefined` (not a
   * shape / no `hitTestPart` / no part there). Local coordinates mirror
   * {@link geometricHit}: `(point − spec.origin) / gfxScale`. Shared by hover
   * ({@link updatePartHover}) and right-click routing.
   */
  partIdAt(hit, x2, y2) {
    if (!hit || hit.kind !== "shape") return void 0;
    const inst = this.shapeInstances.get(hit.id);
    if (!inst?.shape.hitTestPart) return void 0;
    const s = inst.drawnScale || 1;
    return inst.shape.hitTestPart(
      (x2 - inst.spec.x - inst.drawnDx) / s,
      (y2 - inst.spec.y - inst.drawnDy) / s
    );
  }
  /**
   * Diff the sub-part under the cursor against {@link currentPart} to emit
   * `shape:partout` (leaving a part) / `shape:partover` (entering one). Atomic
   * shapes (no `hitTestPart`) never produce part events.
   */
  updatePartHover(hit, x2, y2) {
    const partId = this.partIdAt(hit, x2, y2);
    const cur = this.currentPart;
    if (cur && (partId === void 0 || cur.id !== hit?.id || cur.partId !== partId)) {
      this.events.emit("shape:partout", { id: cur.id, partId: cur.partId });
      this.currentPart = null;
    }
    if (partId !== void 0 && hit && this.currentPart === null) {
      this.events.emit("shape:partover", { id: hit.id, partId, worldX: x2, worldY: y2 });
      this.currentPart = { id: hit.id, partId };
    }
  }
  // ─── Diagnostics ────────────────────────────────────────────────────────
  getRenderStats() {
    return {
      shapes: this.shapeInstances.size,
      connectors: this.connectorInstances.size,
      animatedDecorations: this.animated.size
    };
  }
  get shapeCount() {
    return this.shapeInstances.size;
  }
  get connectorCount() {
    return this.connectorInstances.size;
  }
  hasShape(id) {
    return this.shapeInstances.has(id);
  }
  /**
   * Kind of the currently-installed shape with id `id`, or `undefined`
   * if no shape with that id exists.
   *
   * `GraphLayer.rerenderNode` / `updateNodeShape` use this to decide
   * between an instance-preserving `updateShape` (when the rebuilt spec
   * has the same kind — the common case) and a `removeShape + addShape`
   * fallback (when the kind changed, e.g. `circle` → `rect`, which
   * `updateShape` can't handle since the underlying `IShape` class is
   * fixed at construction time).
   */
  getShapeKind(id) {
    return this.shapeInstances.get(id)?.spec.kind;
  }
  /**
   * Local AABB for the registered shape `kind`, derived from `spec` alone
   * without instantiating the shape's Pixi `Graphics`. Returns `undefined`
   * when the kind isn't registered, or when the registered ctor doesn't
   * implement `static boundsOf`.
   *
   * `spec.x` / `spec.y` are ignored — the returned rect is in the shape's
   * local (centre-relative) frame, so callers can reuse the same width /
   * height for every positioned instance of the kind. To get world-space
   * bounds for a mounted instance, use {@link getShapeWorldBounds}
   * instead.
   *
   * The argument's only required field is `kind`; pass either a full
   * positioned spec (with `x` / `y` / paint) or a bare shape-options
   * record (geometry only — `NodeStyle.shape` from `@invana/graph`).
   * Either way the shape's static `boundsOf` reads only its own
   * geometry params.
   *
   * Consumers (minimap footprint estimation, layouts that need node
   * sizes, label-collision pre-pass, the LOD behaviours) call this so
   * they don't have to switch over a closed kind enum — built-in shapes
   * and shapes registered at runtime via {@link registerShape} both
   * flow through the same hook.
   */
  boundsOfSpec(spec) {
    const Ctor = this.shapeRegistry.get(spec.kind);
    return Ctor?.boundsOf?.(spec);
  }
  /**
   * Uniformly-scaled partial of the registered shape `kind`, with
   * geometry params multiplied by `factor`. Aspect ratio, angular
   * range, and vertex topology are preserved. Returns `undefined`
   * when the kind isn't registered or its ctor doesn't implement
   * `static scaleSpec`.
   *
   * The contract pairs with {@link boundsOfSpec}: scaling by `k`
   * scales the AABB exactly by `k`. Callers compose the returned
   * partial with paint channels (`fill` / `stroke`) and position
   * (`x` / `y`) themselves.
   *
   * Used by `NodeScaleLODBehaviour` to rewrite shape size as the
   * camera zooms, without switching over a closed kind enum. Shapes
   * that don't implement `scaleSpec` are simply skipped by the
   * LOD writer.
   */
  scaleShapeSpec(spec, factor) {
    const Ctor = this.shapeRegistry.get(spec.kind);
    return Ctor?.scaleSpec?.(spec, factor);
  }
  /**
   * The registered shape's **minimal form** — the smallest version of the
   * silhouette that still identifies it — as a partial spec to merge over
   * `spec`. `undefined` when the kind isn't registered or its ctor doesn't
   * implement `collapsedOf`; callers then keep the spec unchanged.
   *
   * Container frames (`@invana/graph` group nodes) render a collapsed frame
   * through this instead of switching over a closed kind enum, so a runtime-
   * registered shape brings its own collapsed look. See
   * `ShapeCtor.collapsedOf` for the contract.
   */
  collapsedShapeSpec(spec) {
    const Ctor = this.shapeRegistry.get(spec.kind);
    return Ctor?.collapsedOf?.(spec);
  }
  /**
   * Geometry partial that fits the registered shape around `content` — the
   * measured size of what it carries (typically its label). `undefined` when
   * the kind isn't registered or its ctor doesn't implement `fitToContent`.
   *
   * The caller measures and the shape decides: pair this with
   * {@link measureLabel} so no caller needs to know how a given silhouette
   * turns a text size into geometry. See `ShapeCtor.fitToContent`.
   */
  fitShapeSpecToContent(spec, content) {
    const Ctor = this.shapeRegistry.get(spec.kind);
    return Ctor?.fitToContent?.(spec, content);
  }
  hasConnector(id) {
    return this.connectorInstances.has(id);
  }
  /**
   * Currently-mounted decoration instance for shape (or connector) `id` at
   * `slot`, or `undefined` when no decoration is attached at that slot.
   *
   * Domain behaviours read this when they need to introspect a decoration's
   * exposed state — e.g. `CollapseExpandBehaviour` calls
   * `getDecoration(nodeId, 'collapse-toggle')` and reads the toggle's
   * cached hit geometry to test a pointer click against the button's
   * shape-local centre + radius.
   *
   * The returned object is the live `IDecorationBase` — callers should
   * treat it as read-only and not mutate the decoration's `style` directly
   * (use `setDecoration` to swap the style atomically).
   */
  getDecoration(id, slot) {
    const shape = this.shapeInstances.get(id);
    const connector = this.connectorInstances.get(id);
    if (!shape && !connector) return void 0;
    return (shape ?? connector).decorations.get(slot);
  }
  /**
   * Densified polyline of the routed connector's path, in world coordinates,
   * or `null` when no connector with that id exists. Returns the same point
   * set used internally for hit-testing — so curved / orthogonal / bezier
   * connectors hand back their true visible silhouette, not the straight
   * source-to-target line.
   *
   * Domain-free read accessor for overview layers (e.g. `MiniMapLayer`) that
   * need to render the actual routed shape without re-running the router.
   * Cheap: only samples the cached `inst.path`; no router invocation.
   */
  getConnectorPolyline(id) {
    const inst = this.connectorInstances.get(id);
    if (!inst) return null;
    return this.sampledConnectorPolyline(inst);
  }
  /**
   * Densified polyline of a connector's routed path, memoised on the instance
   * ({@link ConnectorInstance.sampledPolyline}) and cleared on re-route. Hover
   * hit-testing runs this per candidate on every `pointermove`; caching turns a
   * dense-graph resample storm into one sample per edge per re-route.
   */
  sampledConnectorPolyline(inst) {
    return inst.sampledPolyline ??= samplePath(inst.path);
  }
  /**
   * World-space AABB of a decoration **as drawn**. Returns `null` when no host
   * or slot exists.
   *
   * The decoration's gfx is a child of the host's gfx, so its drawn box is its
   * local bounds through its own scale (a label-size policy), then through the
   * host's drawn transform: a shape's origin is `spec + drawn offset` and its
   * scale the drawn scale (node-size LOD × a display override); a connector's
   * gfx sits at the world origin, unscaled. Rotation is ignored (an AABB of the
   * unrotated box), and so are transient effect deltas.
   *
   * Cheaper than `getGlobalBounds` — no scene traversal. Used by
   * `LabelCollisionBehaviour` and any behaviour needing decoration geometry.
   */
  getDecorationWorldBounds(targetId, slot) {
    const shape = this.shapeInstances.get(targetId);
    const host = shape ?? this.connectorInstances.get(targetId);
    if (!host) return null;
    const deco = host.decorations.get(slot);
    if (!deco) return null;
    const g = deco.gfx;
    if (!g) return null;
    const lb = g.getLocalBounds();
    const own = g.scale.x;
    const hostScale = shape ? shape.drawnScale : 1;
    const originX = shape ? shape.spec.x + shape.drawnDx : 0;
    const originY = shape ? shape.spec.y + shape.drawnDy : 0;
    return {
      x: originX + hostScale * (g.position.x + own * lb.x),
      y: originY + hostScale * (g.position.y + own * lb.y),
      width: hostScale * own * lb.width,
      height: hostScale * own * lb.height
    };
  }
  /**
   * Show / hide a decoration's gfx without destroying it. Used by
   * collision-style behaviours that want to suppress overlapping labels for a
   * frame without paying the cost of re-mounting on the next reveal.
   *
   * For the `'label'` slot this is the **label-collision channel**: it is stored
   * on the host and combined with the text-LOD channel
   * ({@link setShapeTextVisible} / {@link setConnectorTextVisible}), so the
   * label is drawn only when both allow it. Other slots flip `visible` directly.
   *
   * No-op when `targetId` / `slot` doesn't resolve.
   */
  setDecorationVisible(targetId, slot, visible) {
    const shape = this.shapeInstances.get(targetId);
    const host = shape ?? this.connectorInstances.get(targetId);
    if (!host) return;
    const deco = host.decorations.get(slot);
    if (!deco) return;
    if (slot === "label") {
      if (shape) {
        shape.labelWanted = visible;
        this.applyShapeLabelVisibility(shape);
      } else {
        const connector = host;
        connector.labelWanted = visible;
        this.applyConnectorLabelVisibility(connector);
      }
      return;
    }
    const g = deco.gfx;
    if (g) g.visible = visible;
  }
  /**
   * World-space AABB of the registered shape, or `null` when no shape with
   * that id exists. Domain-free read accessor for layer code that needs to
   * query shape geometry without poking at private state — e.g. a graph
   * layer building an obstacle list for an edge's router, a behaviour that
   * wants to fit content to a selection, or a debug overlay.
   */
  getShapeWorldBounds(id) {
    return this.picking.shapeWorldBounds(id);
  }
  /**
   * World-space origin `(spec.x, spec.y)` of the registered shape, or `null`
   * when no shape with that id exists. Counterpart to `getShapeWorldBounds`;
   * use this when a behaviour needs the shape's translation point (drag
   * offset baseline, anchor for an external overlay, etc.).
   */
  getShapePosition(id) {
    const inst = this.shapeInstances.get(id);
    return inst ? { x: inst.spec.x, y: inst.spec.y } : null;
  }
  /**
   * World-space geometric **centre** of the registered shape's bounding box,
   * or `null` when no shape with that id exists. Differs from
   * `getShapePosition` for shapes whose local origin isn't the centre
   * (`RectShape` is anchored top-left; `CircleShape` is already centred).
   *
   * This is the canonical "anchor reference point" for layer code that wants
   * a uniform centre regardless of shape kind — connector routing, badge
   * placement, fit-to-content, etc.
   */
  getShapeCenter(id) {
    const inst = this.shapeInstances.get(id);
    if (!inst) return null;
    const b2 = inst.shape.bounds();
    if (inst.displayOverride !== null) {
      const s = inst.drawnScale;
      return {
        x: inst.spec.x + inst.drawnDx + (b2.x + b2.width / 2) * s,
        y: inst.spec.y + inst.drawnDy + (b2.y + b2.height / 2) * s
      };
    }
    return {
      x: inst.spec.x + b2.x + b2.width / 2,
      y: inst.spec.y + b2.y + b2.height / 2
    };
  }
  /**
   * Text extent `content` would occupy if mounted as a `label` decoration,
   * or `null` for content this can't measure statically (`html-text`).
   *
   * Nothing is mounted, drawn or cached — this is a pure query against the
   * same font resolution the renderer uses, so a domain layer can size
   * geometry **around** a label (a tab, a header band, a chip) before that
   * label exists, without importing a drawing library to do it.
   */
  measureLabel(content, wrap) {
    return measureLabelContent(content, wrap);
  }
  /**
   * Re-route every registered connector. Useful after a non-endpoint shape
   * moves (e.g. an obstacle) and you want connectors that auto-collect
   * obstacles to update their path.
   *
   * Each call re-runs `routePath` per connector and refreshes the hit index
   * and any connector decorations. Linear in `connectorInstances`; safe to
   * call from drag handlers in typical layouts. Heavy graphs with thousands
   * of edges should prefer a targeted re-route (future).
   */
  reRouteAllConnectors() {
    for (const inst of this.connectorInstances.values()) {
      inst.path = this.routePath(inst.spec);
      this.drawConnectorInstance(inst);
      this.indexConnector(inst);
      if (inst.decorations.size > 0) this.refreshConnectorDecorations(inst);
    }
  }
  // ─── Teardown ───────────────────────────────────────────────────────────
  destroy() {
    this.currentHover = null;
    this.currentPart = null;
    this.downHit = null;
    this.lastLeftClick = null;
    for (const id of [...this.shapeInstances.keys()]) this.removeShape(id);
    for (const id of [...this.connectorInstances.keys()]) this.removeConnector(id);
    this.animated.clear();
    this.picking.clear();
    this.events.removeAllListeners();
  }
  // ─── Internals ──────────────────────────────────────────────────────────
  /**
   * World-space AABB of a shape, via the picking index so bounds and hit boxes
   * can never disagree. The `null` branch is unreachable for a live instance
   * (the index falls back to `shape.bounds()` for custom kinds); it exists
   * because the index is keyed by id and an id can always be unknown.
   */
  shapeWorldBounds(inst) {
    return this.picking.shapeWorldBounds(inst.id) ?? { x: inst.spec.x + inst.drawnDx, y: inst.spec.y + inst.drawnDy, width: 0, height: 0 };
  }
  routePath(spec) {
    const routerKind = spec.router ?? "straight";
    const router = this.routerRegistry.get(routerKind);
    if (!router) {
      throw new Error(`PrimitivesRenderer: unknown router "${routerKind}"`);
    }
    const pathStyleKind = spec.pathStyle ?? "normal";
    const pathStyle = this.pathStyleRegistry.get(pathStyleKind);
    if (!pathStyle) {
      throw new Error(`PrimitivesRenderer: unknown pathStyle "${pathStyleKind}"`);
    }
    const sourceCenter = this.endpointCenter(spec.source);
    const targetCenter = this.endpointCenter(spec.target);
    const waypoints = spec.waypoints;
    const firstWp = waypoints?.[0];
    const lastWp = waypoints?.[waypoints.length - 1];
    const source = this.resolveEndpoint(
      spec.source,
      firstWp && !samePoint(firstWp, sourceCenter) ? firstWp : targetCenter
    );
    const target = this.resolveEndpoint(
      spec.target,
      lastWp && !samePoint(lastWp, targetCenter) ? lastWp : sourceCenter
    );
    const resolveObstacles = () => this.resolveObstacles(spec);
    let obstaclesCache = null;
    const ctx = {
      get obstacles() {
        if (obstaclesCache === null) obstaclesCache = resolveObstacles();
        return obstaclesCache;
      }
    };
    const polyline = router(source, target, spec.waypoints, spec.routerOpts, ctx);
    return pathStyle(polyline, spec.pathStyleOpts, { source, target });
  }
  /**
   * Build the obstacle list passed to the router. By default every shape in
   * the renderer except the source / target shapes (when those endpoints are
   * `kind: 'shape'`) is included. Each obstacle carries its AABB plus an
   * optional `containsInflated` silhouette test (when the shape exposes
   * `obstacleTest`) so routers can hug non-rect silhouettes tightly.
   *
   * Callers can override via `routerOpts.obstacles`:
   * - `'auto'` (default) — auto-collected as above.
   * - `'none'` — empty list; router runs as if no obstacles exist.
   * - `Obstacle[]` / `Rect[]` — verbatim list (used for testing or
   *   layer-specific filtering). Plain `Rect` entries are valid because
   *   `Obstacle extends Rect`; they fall back to AABB-only marking.
   */
  resolveObstacles(spec) {
    const opt = spec.routerOpts?.obstacles;
    if (opt === "none") return [];
    if (Array.isArray(opt)) return opt;
    const excludeIds = /* @__PURE__ */ new Set();
    if (spec.source.kind === "shape") excludeIds.add(spec.source.shapeId);
    if (spec.target.kind === "shape") excludeIds.add(spec.target.shapeId);
    const out = [];
    for (const [id, inst] of this.shapeInstances) {
      if (excludeIds.has(id)) continue;
      const bounds = this.shapeWorldBounds(inst);
      const containsInflated = inst.shape.obstacleTest?.();
      out.push({ ...bounds, containsInflated });
    }
    return out;
  }
  /**
   * Pass-1 endpoint resolution — stable, anchor-independent reference point.
   * Returns the shape's geometric bounding-box centre in world space (NOT
   * the raw `(spec.x, spec.y)` origin) so the anchor's pass-2 ray cast is
   * uniform across shape kinds.
   */
  endpointCenter(spec) {
    if (spec.kind === "point") return { x: spec.x, y: spec.y };
    const inst = this.shapeInstances.get(spec.shapeId);
    if (!inst) {
      throw new Error(`PrimitivesRenderer: connector references unknown shape "${spec.shapeId}"`);
    }
    const b2 = inst.shape.bounds();
    const s = inst.drawnScale;
    return {
      x: inst.spec.x + inst.drawnDx + (b2.x + b2.width / 2) * s,
      y: inst.spec.y + inst.drawnDy + (b2.y + b2.height / 2) * s
    };
  }
  /** Pass-2 endpoint resolution — applies the declared anchor for shape endpoints. */
  resolveEndpoint(spec, fromPoint) {
    if (spec.kind === "point") {
      return { x: spec.x, y: spec.y, tangent: spec.tangent };
    }
    const inst = this.shapeInstances.get(spec.shapeId);
    if (!inst) {
      throw new Error(`PrimitivesRenderer: connector references unknown shape "${spec.shapeId}"`);
    }
    const { name, opts } = normalizeAnchorSpec(spec.anchor);
    const anchor = this.anchorRegistry.get(name);
    if (!anchor) {
      throw new Error(`PrimitivesRenderer: unknown anchor "${name}"`);
    }
    const ctx = { getShape: (id) => this.anchorShapeRef(id) };
    const result = anchor({ shapeId: spec.shapeId, opts }, fromPoint, ctx);
    const padding = spec.padding ?? 0;
    if (padding === 0 || !result.tangent) return result;
    return {
      x: result.x + result.tangent.x * padding,
      y: result.y + result.tangent.y * padding,
      tangent: result.tangent
    };
  }
  anchorShapeRef(id) {
    const inst = this.shapeInstances.get(id);
    if (!inst) return void 0;
    const localBounds = inst.shape.bounds();
    const s = inst.drawnScale;
    const ox = inst.spec.x + inst.drawnDx;
    const oy = inst.spec.y + inst.drawnDy;
    const bounds = s === 1 ? localBounds : {
      x: localBounds.x * s,
      y: localBounds.y * s,
      width: localBounds.width * s,
      height: localBounds.height * s
    };
    const rawBoundary = inst.shape.boundaryIntersect?.bind(inst.shape);
    const boundaryIntersect = rawBoundary ? s === 1 ? rawBoundary : (localFromCenter) => {
      const p = rawBoundary({ x: localFromCenter.x / s, y: localFromCenter.y / s });
      return p === null ? null : { x: p.x * s, y: p.y * s };
    } : void 0;
    return {
      origin: { x: ox, y: oy },
      bounds,
      center: {
        x: ox + bounds.x + bounds.width / 2,
        y: oy + bounds.y + bounds.height / 2
      },
      boundaryIntersect
    };
  }
  indexConnector(inst) {
    if (inst.spec.visible === false || inst.path.length < 2) {
      this.picking.remove(inst.id);
      return;
    }
    if (this.picking.has(inst.id)) {
      this.picking.markConnectorMoved(inst.id);
      return;
    }
    this.picking.insertConnector(inst.id, inst.spec.zIndex ?? 0);
  }
  refreshShapeDecorations(inst, skip) {
    const bounds = inst.shape.bounds();
    const outerDecorationExtent = this.aggregateShapeOuterExtent(inst);
    for (const [slot, deco] of inst.decorations) {
      if (deco === skip) continue;
      if (!deco.update) continue;
      const host = {
        hostId: inst.id,
        slot,
        slotZIndex: slotZIndex(slot),
        bounds,
        surface: inst.shape.gfx,
        shape: inst.shape,
        outerDecorationExtent
      };
      deco.update(host);
    }
  }
  refreshConnectorDecorations(inst) {
    for (const [slot, deco] of inst.decorations) {
      if (!deco.update) continue;
      const host = {
        hostId: inst.id,
        slot,
        slotZIndex: slotZIndex(slot),
        path: inst.path,
        surface: inst.connector.gfx,
        connector: inst.connector,
        connectorSpec: inst.spec
      };
      deco.update(host);
    }
  }
  disposeDecoration(deco) {
    if ("tick" in deco && typeof deco.tick === "function") {
      this.animated.delete(deco);
    }
    if (decoHasSetResolution(deco)) this.labelBearingDecorations.delete(deco);
    try {
      deco.destroy?.();
    } catch {
    }
  }
  disposeEffect(fx) {
    if (typeof fx.tick === "function") {
      this.animatedEffects.delete(fx);
    }
    fx.destroy?.();
  }
};
var SLOT_Z_TABLE = {
  glow: -300,
  halo: -200,
  breathing: -150,
  pulse: -100,
  "pulse-ring": -80,
  ring: -50,
  liquid: 20,
  label: 200,
  badge: 300,
  fx: 400
};
var SLOT_Z_DEFAULT = 50;
function slotZIndex(slot, kind) {
  return SLOT_Z_TABLE[slot] ?? (kind !== void 0 ? SLOT_Z_TABLE[kind] : void 0) ?? SLOT_Z_DEFAULT;
}
function badgeIdFor(hostId, slot) {
  return `${hostId}:${slot}`;
}
function normalizeAnchorSpec(spec) {
  if (spec === void 0) return { name: "center" };
  if (typeof spec === "string") return { name: spec };
  return { name: spec.name, opts: spec.opts };
}
function decoHasSetResolution(deco) {
  return typeof deco.setResolution === "function";
}
function sameLabelSizePolicy(a, b2) {
  if (a === b2) return true;
  if (a === null || b2 === null) return false;
  return a.zoomGrowth === b2.zoomGrowth && a.minFontPx === b2.minFontPx && a.maxFontPx === b2.maxFontPx;
}
function labelDecoration(deco, kind) {
  const gfx = deco.gfx;
  if (!gfx) return;
  let label = DECO_LABELS.get(kind);
  if (label === void 0) DECO_LABELS.set(kind, label = `deco:${kind}`);
  gfx.label = label;
}
var DECO_LABELS = /* @__PURE__ */ new Map();
function pointInRect(x2, y2, r) {
  return x2 >= r.x && x2 <= r.x + r.width && y2 >= r.y && y2 <= r.y + r.height;
}
function pathInRect(path, r) {
  const a = path[0];
  const b2 = path[path.length - 1];
  if (!a || !b2) return false;
  return Math.max(a.x, b2.x) >= r.x && Math.min(a.x, b2.x) <= r.x + r.width && Math.max(a.y, b2.y) >= r.y && Math.min(a.y, b2.y) <= r.y + r.height;
}
function rectsIntersect(a, b2) {
  return a.x < b2.x + b2.width && a.x + a.width > b2.x && a.y < b2.y + b2.height && a.y + a.height > b2.y;
}
function isFiniteRect(r) {
  return Number.isFinite(r.x) && Number.isFinite(r.y) && Number.isFinite(r.width) && Number.isFinite(r.height);
}

// src/renderer/PixiSurface.ts
var PixiSurface = class {
  id;
  space;
  primitives;
  /**
   * The pixi root. Renderer-side only; nothing outside this package reaches for
   * it, and it moves to `@invana/renderer-pixijs` whole.
   */
  root;
  overlays = [];
  /** Renderer-side teardown hook — see {@link PixiSurfaceOptions.onDestroy}. */
  onDestroy;
  /** Backdrop objects, kept so a per-frame transform update costs no rebuild. */
  backdropSolid = null;
  backdropTile = null;
  backdropTexture = null;
  /** The image the current tile texture was built from — the cache key. */
  backdropSource = null;
  constructor(opts) {
    this.id = opts.id;
    this.space = opts.space;
    if (opts.onDestroy) this.onDestroy = opts.onDestroy;
    this.root = new Container(opts.space === "world" ? { isRenderGroup: true } : {});
    this.root.label = opts.id;
    opts.parent.addChild(this.root);
    this.primitives = new PrimitivesRenderer({
      container: this.root,
      camera: opts.camera,
      ...opts.textureRegistry ? { textureRegistry: opts.textureRegistry } : {},
      ...opts.hitFloorPx !== void 0 ? { hitFloorPx: opts.hitFloorPx } : {}
    });
  }
  overlay(label) {
    const device = new PixiOverlayDevice(this.root, label);
    this.overlays.push(device);
    return device;
  }
  setBackdrop(backdrop) {
    if (!backdrop) {
      this.clearBackdrop();
      return;
    }
    if (!this.backdropSolid) {
      const g = new Graphics();
      g.label = "background:solid";
      this.backdropSolid = g;
      this.root.addChildAt(g, 0);
    }
    this.backdropSolid.clear().rect(0, 0, backdrop.width, backdrop.height).fill(backdrop.color);
    const tile = backdrop.tile;
    if (!tile) {
      this.disposeBackdropTile();
      return;
    }
    if (this.backdropSource !== tile.source) {
      this.disposeBackdropTile();
      this.backdropTexture = Texture.from(tile.source);
      this.backdropSource = tile.source;
      const sprite2 = new TilingSprite({
        texture: this.backdropTexture,
        width: backdrop.width,
        height: backdrop.height
      });
      sprite2.label = "background:pattern";
      this.backdropTile = sprite2;
      this.root.addChildAt(sprite2, 1);
    } else if (this.backdropTile) {
      this.backdropTile.width = backdrop.width;
      this.backdropTile.height = backdrop.height;
    }
    const sprite = this.backdropTile;
    if (!sprite) return;
    sprite.alpha = tile.alpha ?? 1;
    sprite.visible = tile.visible ?? true;
    sprite.tileScale.set(tile.scale, tile.scale);
    sprite.tilePosition.set(tile.offsetX, tile.offsetY);
  }
  disposeBackdropTile() {
    this.backdropTile?.destroy();
    this.backdropTile = null;
    this.backdropTexture?.destroy(true);
    this.backdropTexture = null;
    this.backdropSource = null;
  }
  clearBackdrop() {
    this.backdropSolid?.destroy();
    this.backdropSolid = null;
    this.disposeBackdropTile();
  }
  setVisible(visible) {
    this.root.visible = visible;
  }
  setAlpha(alpha) {
    this.root.alpha = alpha;
  }
  setZIndex(z2) {
    this.root.zIndex = z2;
    const parent = this.root.parent;
    if (parent) parent.sortableChildren = true;
  }
  destroy() {
    this.onDestroy?.(this);
    for (const overlay of this.overlays) overlay.destroy();
    this.overlays.length = 0;
    this.clearBackdrop();
    this.primitives.destroy();
    this.root.destroy({ children: true });
  }
};

// src/renderer/PixiPointerRouter.ts
var PixiPointerRouter = class {
  stage;
  camera;
  canvasElement;
  /** Registered surfaces, in registration order. Paint order is computed per event. */
  surfaces = [];
  /**
   * True while any pointer button is held. Hover diffing is suppressed for the
   * duration — without it, dragging a node across its neighbours fires
   * `pointerover` on each one and wakes `HoverActivateBehaviour` mid-drag.
   */
  pointerDown = false;
  /** Listener disposers, run on {@link destroy}. */
  unsubs = [];
  /**
   * RAF handle + latest move event for the move-coalescing throttle. Raw
   * `globalpointermove` fires hundreds of times a second on a fast sweep; the
   * hit only needs resolving once per animation frame. This used to be one
   * throttle *per surface*, each running its own pick — now it is one for the
   * whole canvas.
   */
  pendingMove = null;
  moveRaf = null;
  /**
   * Last cursor this router wrote. The move path runs every animation frame, and
   * re-writing an unchanged `style.cursor` dirties the element's style for
   * nothing — so only a *change* reaches the DOM.
   */
  appliedCursor = null;
  constructor(opts) {
    this.stage = opts.stage;
    this.camera = opts.camera;
    this.canvasElement = opts.canvasElement ?? null;
    this.install();
  }
  // ─── Registration ────────────────────────────────────────────────────────
  /** Register a surface. Called by `PixiRenderer.createSurface`. */
  add(surface) {
    if (!this.surfaces.includes(surface)) this.surfaces.push(surface);
  }
  /** Drop a surface. Called by `PixiSurface.destroy` through the renderer. */
  remove(surface) {
    const i = this.surfaces.indexOf(surface);
    if (i >= 0) this.surfaces.splice(i, 1);
  }
  // ─── Install / teardown ──────────────────────────────────────────────────
  /**
   * One listener trio on the stage. The always-true `hitArea` is legitimate
   * here and nowhere else: the stage *is* the whole canvas, so making it the
   * dispatch target costs nothing and competes with no one. Every shape stays
   * `eventMode = 'none'`, so Pixi never walks the scene graph on a pointer
   * event — the pick is ours, answered from the spec-derived rbush index.
   */
  install() {
    const stage = this.stage;
    stage.eventMode = "static";
    stage.hitArea = { contains: () => true };
    const onMove = (e) => {
      this.pendingMove = e;
      if (this.moveRaf !== null) return;
      this.moveRaf = requestAnimationFrame(() => {
        this.moveRaf = null;
        const pending = this.pendingMove;
        this.pendingMove = null;
        if (pending) this.routeMove(pending);
      });
    };
    const onDown = (e) => this.routeDown(e);
    const onUp = (e) => this.routeUp(e);
    stage.on("globalpointermove", onMove);
    stage.on("pointerdown", onDown);
    stage.on("pointerup", onUp);
    stage.on("pointerupoutside", onUp);
    this.unsubs.push(
      () => stage.off("globalpointermove", onMove),
      () => stage.off("pointerdown", onDown),
      () => stage.off("pointerup", onUp),
      () => stage.off("pointerupoutside", onUp)
    );
  }
  destroy() {
    if (this.moveRaf !== null) {
      cancelAnimationFrame(this.moveRaf);
      this.moveRaf = null;
    }
    this.pendingMove = null;
    for (const off of this.unsubs) off();
    this.unsubs.length = 0;
    this.surfaces.length = 0;
    this.pointerDown = false;
    this.appliedCursor = null;
  }
  // ─── Ordering ────────────────────────────────────────────────────────────
  /** Registered surfaces in paint order, topmost first. See {@link orderByPaintOrderTopFirst}. */
  orderedTopFirst() {
    return orderByPaintOrderTopFirst(this.surfaces, this.stage);
  }
  // ─── Routing ─────────────────────────────────────────────────────────────
  /**
   * The point `e` falls on, expressed in `surface`'s own space: world
   * coordinates for a `world` surface, raw screen pixels for a `screen` one.
   */
  pointFor(surface, e) {
    if (surface.space === "screen") return { x: e.global.x, y: e.global.y };
    return this.camera.toWorld(e.global.x, e.global.y);
  }
  /** First surface (topmost) whose press-pick answers, or `null`. */
  resolvePress(e) {
    for (const surface of this.orderedTopFirst()) {
      const { x: x2, y: y2 } = this.pointFor(surface, e);
      const hit = surface.primitives.hitTest(x2, y2);
      if (hit) return { surface, hit, x: x2, y: y2 };
    }
    return null;
  }
  routeMove(e) {
    if (this.pointerDown) return;
    let winner = null;
    for (const surface of this.orderedTopFirst()) {
      const { x: x2, y: y2 } = this.pointFor(surface, e);
      if (winner) {
        surface.primitives.dispatchMove(null, x2, y2);
        continue;
      }
      const hit = surface.primitives.pickHoverAt(x2, y2);
      if (hit) {
        winner = { surface, hit, x: x2, y: y2 };
        surface.primitives.dispatchMove(hit, x2, y2);
      } else {
        surface.primitives.dispatchMove(null, x2, y2);
      }
    }
    this.applyCursor(winner !== null);
  }
  routeDown(e) {
    this.pointerDown = true;
    const won = this.resolvePress(e);
    for (const surface of this.surfaces) {
      if (surface !== won?.surface) surface.primitives.clearDown();
    }
    if (won) won.surface.primitives.dispatchDown(won.hit, won.x, won.y, e.button, e.pointerId);
  }
  routeUp(e) {
    this.pointerDown = false;
    const won = this.resolvePress(e);
    if (!won) {
      if (e.button === 2) {
        const w = this.camera.toWorld(e.global.x, e.global.y);
        for (const surface of this.surfaces) {
          surface.primitives.emitBackgroundContextMenu(w.x, w.y);
        }
      }
      for (const surface of this.surfaces) surface.primitives.clearDown();
      return;
    }
    for (const surface of this.surfaces) {
      if (surface !== won.surface) surface.primitives.clearDown();
    }
    won.surface.primitives.dispatchUp(won.hit, won.x, won.y, e.button, e.pointerId);
  }
  /**
   * Hover cursor on the canvas element. Skipped while a press is captured on
   * any surface, so a behaviour that owns the cursor during a drag
   * (`DragNodeBehaviour`'s `'grabbing'`) isn't overridden mid-gesture.
   */
  applyCursor(over) {
    if (!this.canvasElement) return;
    for (const surface of this.surfaces) {
      if (surface.primitives.hasCapturedPress) return;
    }
    const next = over ? "pointer" : "";
    if (next === this.appliedCursor) return;
    this.appliedCursor = next;
    this.canvasElement.style.cursor = next;
  }
};
function orderByPaintOrderTopFirst(items, stop) {
  const keyed = items.map((item) => ({ item, key: paintPathKey(item.root, stop) }));
  keyed.sort((a, b2) => comparePath(b2.key, a.key));
  return keyed.map((k2) => k2.item);
}
function paintPathKey(node, stop) {
  const key = [];
  let cur = node;
  while (cur && cur !== stop) {
    const parent = cur.parent ?? null;
    if (!parent) break;
    const index = parent.children.indexOf(cur);
    key.unshift(parent.sortableChildren ? cur.zIndex : 0, index);
    cur = parent;
  }
  return key;
}
function comparePath(a, b2) {
  const n = Math.min(a.length, b2.length);
  for (let i = 0; i < n; i++) {
    const d2 = (a[i] ?? 0) - (b2[i] ?? 0);
    if (d2 !== 0) return d2;
  }
  return a.length - b2.length;
}

// src/renderer/PixiRenderer.ts
var PIXI_SPEC_KINDS = [
  "circle",
  "ellipse",
  "rect",
  "tabbed-rect",
  "polygon",
  "regular-polygon",
  "star",
  "arc",
  "path",
  "composite",
  "arrow",
  "line",
  "curve"
];
var PixiRenderer = class {
  events;
  hitFloorPx;
  app;
  _stage;
  _world;
  _camera;
  /**
   * The canvas's single pointer dispatcher. Built with the camera (so it is
   * available from the same moment a surface can be), it owns the stage
   * listeners and decides which surface wins each press — see
   * {@link PixiPointerRouter} for why that is not each surface's own job.
   */
  _pointerRouter;
  _holdsSharedTexturePool = false;
  _resizeObserver;
  _onRendererResize;
  /**
   * Set once the WebGPU renderer has crashed at render time and we've halted the
   * loop + emitted `'canvas:renderer:fallback'`. Guards against repeating it.
   */
  _fellBack = false;
  constructor(opts) {
    this.events = opts.events;
    this.hitFloorPx = opts.hitFloorPx;
  }
  // ─── Lifecycle ───────────────────────────────────────────────────────────
  async mount(host, opts = {}) {
    const width = opts.width ?? host.clientWidth;
    const height = opts.height ?? host.clientHeight;
    const dpr = opts.resolution ?? (typeof window !== "undefined" ? window.devicePixelRatio : 1);
    acquireSharedTexturePool();
    this._holdsSharedTexturePool = true;
    const preference = resolveRenderPreference(opts.preference ?? "webgpu");
    const initOpts = {
      width,
      height,
      resolution: dpr,
      autoDensity: true,
      antialias: opts.antialias ?? true,
      backgroundAlpha: opts.opaque ? 1 : 0,
      backgroundColor: opts.background ?? 0,
      powerPreference: opts.powerPreference ?? "high-performance",
      hello: false,
      // The engine owns the only rAF (G3). Pixi must not start a render loop of
      // its own, or there would be two clocks disagreeing about frame order.
      autoStart: false,
      // With `autoResize`, point pixi's ResizePlugin at the host so its
      // `resize()` reads the element box and handles `autoDensity` / DPR. The
      // plugin only re-runs on the *window* resize event though — it never
      // observes the element — so element-only changes are picked up by the
      // `ResizeObserver` wired below instead.
      ...opts.autoResize ? { resizeTo: host } : {}
    };
    try {
      this.app = new Application();
      try {
        await this.app.init({ preference, ...initOpts });
      } catch (err) {
        if (preference !== "webgpu") throw err;
        this.app.destroy(true);
        this.app = new Application();
        await this.app.init({ preference: "webgl", ...initOpts });
      }
    } catch (err) {
      releaseSharedTexturePool();
      this._holdsSharedTexturePool = false;
      throw err;
    }
    this.app.ticker.stop();
    this.app.canvas.style.display = "block";
    host.appendChild(this.app.canvas);
    if (opts.suppressBrowserContextMenu ?? true) {
      this.app.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    }
    this.buildScene(this.app.stage, width, height, this.app.renderer.events);
    this.installRenderGuard();
    if (opts.autoResize) {
      this._onRendererResize = (w, h) => this._camera?.resize(w, h);
      this.app.renderer.on("resize", this._onRendererResize);
      if (typeof ResizeObserver !== "undefined") {
        this._resizeObserver = new ResizeObserver(() => this.app?.queueResize());
        this._resizeObserver.observe(host);
      }
    }
  }
  /**
   * Headless entry: adopt a caller-supplied stage instead of creating an
   * `Application`. **Adapter-specific, deliberately not on {@link IRenderer}** —
   * it exists for unit tests of the layer / behaviour / state pipeline that
   * don't need a GPU, and a second backend has no obligation to offer it.
   */
  mountStage(stage, screenWidth, screenHeight) {
    this.buildScene(stage, screenWidth, screenHeight);
  }
  destroy() {
    if (this._onRendererResize && this.app) {
      this.app.renderer.off("resize", this._onRendererResize);
    }
    this._onRendererResize = void 0;
    this._resizeObserver?.disconnect();
    this._resizeObserver = void 0;
    this._pointerRouter?.destroy();
    this._pointerRouter = void 0;
    this._world?.destroy({ children: true });
    this._world = void 0;
    this._stage = void 0;
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = void 0;
    }
    if (this._holdsSharedTexturePool) {
      releaseSharedTexturePool();
      this._holdsSharedTexturePool = false;
    }
  }
  // ─── Devices ─────────────────────────────────────────────────────────────
  createSurface(space, id, opts) {
    const parent = space === "screen" ? this.requireStage() : this.requireWorld();
    const surface = new PixiSurface({
      id,
      space,
      parent,
      camera: this.requireCamera(),
      // The layer's own policy wins over the renderer-wide default.
      ...(opts?.hitFloorPx ?? this.hitFloorPx) !== void 0 ? { hitFloorPx: opts?.hitFloorPx ?? this.hitFloorPx } : {},
      onDestroy: (s) => this._pointerRouter?.remove(s)
    });
    this.requirePointerRouter().add(surface);
    return surface;
  }
  createOverlay(label, space = "world") {
    return new PixiOverlayDevice(
      space === "screen" ? this.requireStage() : this.requireWorld(),
      label
    );
  }
  createCameraBinding() {
    return new PixiViewportBinding(this.requireWorld());
  }
  /**
   * Hand back the engine's `Camera` once it has been built on this renderer's
   * binding.
   *
   * The ordering is unavoidable and worth stating: the binding must exist before
   * a `Camera` can wrap it, and a surface needs the `Camera` (its primitives
   * renderer scales the hit floor and prioritises label rasterisation by what is
   * in view). So the sequence is `createCameraBinding` → `new Camera` →
   * `attachCamera` → `createSurface`. {@link createSurface} throws rather than
   * silently drawing without one.
   */
  attachCamera(camera) {
    this._camera = camera;
    this._pointerRouter?.destroy();
    this._pointerRouter = new PixiPointerRouter({
      stage: this.requireStage(),
      camera,
      ...this.canvasElement ? { canvasElement: this.canvasElement } : {}
    });
  }
  /** The pointer router, or a thrown error if `attachCamera` hasn't run yet. */
  requirePointerRouter() {
    if (!this._pointerRouter) {
      throw new Error(
        "PixiRenderer: pointer router unavailable \u2014 call attachCamera() before createSurface()."
      );
    }
    return this._pointerRouter;
  }
  // ─── Per-frame ───────────────────────────────────────────────────────────
  /**
   * Advance backend animation and **present the frame** (G3).
   *
   * Pixi's `Application.ticker` is stopped at mount, so this call is the only
   * thing that renders. The engine owns the sole `requestAnimationFrame` and
   * calls here once per frame, *after* it has advanced the camera, flushed data
   * and updated layers — which is what makes frame order deterministic and lets
   * a test drive time by hand.
   *
   * No-op after a render-time fallback: `_fellBack` means the host is swapping
   * backend and another frame would just re-hit the crash.
   */
  tick(_dtMs) {
    if (this._fellBack) return;
    this.app?.render();
  }
  resize(width, height) {
    this.app?.renderer.resize(width, height);
  }
  worldContentBounds() {
    const world = this._world;
    if (!world) return null;
    const b2 = world.getLocalBounds();
    if (!(b2.width > 0) || !(b2.height > 0)) return null;
    return { x: b2.minX, y: b2.minY, width: b2.width, height: b2.height };
  }
  /**
   * Raster capture (G1). Extracts onto a **fully transparent clear** so the
   * caller composites its own background — which is what keeps a
   * `'transparent'` request honest.
   *
   * `region` is world-local (the world container's own space, before the camera
   * transform), matching what `captureRect` computes.
   */
  extract(opts) {
    const renderer = this.app?.renderer;
    if (!renderer?.extract) {
      throw new Error(
        "PixiRenderer.extract: a GPU renderer is required (unavailable in headless mode)."
      );
    }
    const r = opts.region;
    return renderer.extract.canvas({
      target: this.requireWorld(),
      frame: new Rectangle(r.x, r.y, r.width, r.height),
      resolution: opts.resolution,
      clearColor: [0, 0, 0, 0]
    });
  }
  // ─── Reporting ───────────────────────────────────────────────────────────
  get canvasElement() {
    return this.app?.canvas ?? null;
  }
  /** The pixi `Application`, when one exists. `undefined` on the headless path. */
  get application() {
    return this.app;
  }
  /** The scene root. Screen-space surfaces attach here, above `world`. */
  get stage() {
    return this.requireStage();
  }
  /** The camera-transformed world root. World-space surfaces attach here. */
  get world() {
    return this.requireWorld();
  }
  get backend() {
    if (!this.app) return "canvas";
    const name = this.app.renderer.name;
    if (name === "webgpu" || name === "webgl" || name === "canvas") return name;
    const ctor = this.app.renderer.constructor.name.toLowerCase();
    if (ctor.includes("webgpu")) return "webgpu";
    if (ctor.includes("webgl")) return "webgl";
    return "canvas";
  }
  get capabilities() {
    return {
      effects: "shader",
      textMode: "native",
      rasterExport: this.app !== void 0,
      depth: false,
      specKinds: PIXI_SPEC_KINDS
    };
  }
  /** Device facts for the `canvas:renderer:ready` event. */
  deviceInfo() {
    if (!this.app) return { headless: true };
    return {
      backend: this.backend,
      resolution: this.app.renderer.resolution,
      width: this.app.renderer.width,
      height: this.app.renderer.height
    };
  }
  // ─── Internals ───────────────────────────────────────────────────────────
  /**
   * Build the scene root: a `Viewport` as `world` under the stage. World is
   * added first (bottom); screen-space surfaces attach to the stage afterwards
   * and therefore draw above it — pixi child order *is* draw order.
   */
  buildScene(stage, screenWidth, screenHeight, events) {
    const eventsForViewport = events ?? {
      domElement: typeof document !== "undefined" ? document.createElement("canvas") : {}
    };
    const viewport = new it({
      events: eventsForViewport,
      screenWidth,
      screenHeight,
      // The engine owns the tick loop; don't auto-register on the global pixi
      // Ticker. `Camera.tick` forwards `deltaMS` into the binding.
      noTicker: true,
      // A passive listener can't `preventDefault`, so a wheel/pinch that zooms
      // the graph also scrolls (or rubber-bands) the host page. Non-passive,
      // pixi-viewport cancels only wheels it consumed — `requireCtrl` embeds
      // still let plain scroll through.
      passiveWheel: false
    });
    viewport.label = "world";
    this._world = viewport;
    if (!stage.label) stage.label = "stage";
    this._stage = stage;
    stage.addChild(viewport);
  }
  /**
   * Wrap the renderer's `render` in place so a WebGPU render-time crash
   * (uncatchable at init) routes to {@link handleRenderError} instead of
   * throwing uncaught out of pixi's ticker. Non-invasive: same render path,
   * same timing, only a guard added.
   */
  installRenderGuard() {
    const renderer = this.app?.renderer;
    if (!renderer) return;
    const original = renderer.render.bind(renderer);
    renderer.render = ((...args) => {
      if (this._fellBack) return void 0;
      try {
        return original(...args);
      } catch (err) {
        this.handleRenderError(err);
        return void 0;
      }
    });
  }
  /**
   * Recover from a render-time crash. On WebGPU: halt the render loop and emit
   * `'canvas:renderer:fallback'` **once** so the host re-inits on WebGL (the
   * `@invana/canvas-react` `<Canvas>` does this automatically). Any other
   * backend has nowhere to fall back to, so the error is re-thrown.
   */
  handleRenderError(err) {
    if (this._fellBack || this.backend !== "webgpu") throw err;
    this._fellBack = true;
    console.warn(
      "[canvas] WebGPU renderer crashed at render time; falling back to WebGL. Original error:",
      err
    );
    this.events.emit("canvas:renderer:fallback", {
      from: "webgpu",
      to: "webgl",
      reason: err instanceof Error ? err.message : String(err)
    });
  }
  requireStage() {
    if (!this._stage) throw new Error("PixiRenderer: not mounted (no stage)");
    return this._stage;
  }
  requireWorld() {
    if (!this._world) throw new Error("PixiRenderer: not mounted (no world)");
    return this._world;
  }
  requireCamera() {
    if (!this._camera) {
      throw new Error(
        "PixiRenderer: attachCamera() must be called before creating a surface"
      );
    }
    return this._camera;
  }
};

// src/createDefaultRenderer.ts
function createDefaultRenderer(opts) {
  return new PixiRenderer(opts);
}

// src/assets/loadIconFont.ts
async function loadIconFont(stylesheetUrl, fontFamilyToProbe, fontWeightToProbe, fontStyleToProbe) {
  if (typeof document === "undefined") return;
  const dedupeKey = encodeURIComponent(stylesheetUrl);
  await ensureStylesheet(stylesheetUrl, dedupeKey);
  if (fontFamilyToProbe && document.fonts) {
    const style = fontStyleToProbe ?? "";
    const weight = fontWeightToProbe ?? "";
    const probe = `${style} ${weight} 16px "${fontFamilyToProbe}"`.trim().replace(/\s+/g, " ");
    await document.fonts.load(probe);
  }
}
function ensureStylesheet(href, dedupeKey) {
  const selector = `link[data-icon-font="${cssEscape(dedupeKey)}"]`;
  const existing = document.querySelector(selector);
  if (existing) {
    if (existing.sheet) return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`loadIconFont: stylesheet load failed: ${href}`)),
        { once: true }
      );
    });
  }
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.iconFont = dedupeKey;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`loadIconFont: stylesheet load failed: ${href}`));
    document.head.appendChild(link);
  });
}
function cssEscape(s) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(s);
  return s.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

export { ArcShape, ArrowMarker, BreathingConnectorEffect, BreathingEffect, CircleShape, CompositeShape, Connector, ConnectorBase, ConnectorDecorationBase, ConnectorEffectBase, DiamondMarker, DotMarker, EffectBase, EllipseShape, FadeInConnectorEffect, FadeInEffect, FlowParticlesConnectorDecoration, FlyMarkerConnectorDecoration, GlowConnectorDecoration, GlowDecoration, LabelConnectorDecoration, LabelDecoration, LiquidFillDecoration, MarchingAntsConnectorDecoration, MarchingAntsDecoration, PathShape, PixiOverlayDevice, PixiRenderer, PixiSurface, PixiViewportBinding, PolygonShape, PrimitiveBase, PrimitivesRenderer, PulseRingDecoration, RectShape, RegularPolygonShape, ResizeHandleDecoration, RevealConnectorDecoration, RingConnectorDecoration, RingDecoration, RippleConnectorDecoration, SelectionFrameDecoration, ShakeEffect, ShapeBase, ShapeDecorationBase, StarShape, TabbedRectShape, TextureRegistry, ToggleDecoration, arrowMarkerSpec, bestRenderPreference, canUseWebGPU, createDefaultRenderer, diamondMarkerSpec, dotMarkerSpec, hasWebGL, hasWebGPUApi, loadIconFont, resolveRenderPreference };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map