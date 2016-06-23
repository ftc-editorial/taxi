(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jshint browser:true, node:true*/

'use strict';

module.exports = Delegate;

/**
 * DOM event delegator
 *
 * The delegator will listen
 * for events that bubble up
 * to the root node.
 *
 * @constructor
 * @param {Node|string} [root] The root node or a selector string matching the root node
 */
function Delegate(root) {

  /**
   * Maintain a map of listener
   * lists, keyed by event name.
   *
   * @type Object
   */
  this.listenerMap = [{}, {}];
  if (root) {
    this.root(root);
  }

  /** @type function() */
  this.handle = Delegate.prototype.handle.bind(this);
}

/**
 * Start listening for events
 * on the provided DOM element
 *
 * @param  {Node|string} [root] The root node or a selector string matching the root node
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.root = function (root) {
  var listenerMap = this.listenerMap;
  var eventType;

  // Remove master event listeners
  if (this.rootElement) {
    for (eventType in listenerMap[1]) {
      if (listenerMap[1].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, true);
      }
    }
    for (eventType in listenerMap[0]) {
      if (listenerMap[0].hasOwnProperty(eventType)) {
        this.rootElement.removeEventListener(eventType, this.handle, false);
      }
    }
  }

  // If no root or root is not
  // a dom node, then remove internal
  // root reference and exit here
  if (!root || !root.addEventListener) {
    if (this.rootElement) {
      delete this.rootElement;
    }
    return this;
  }

  /**
   * The root node at which
   * listeners are attached.
   *
   * @type Node
   */
  this.rootElement = root;

  // Set up master event listeners
  for (eventType in listenerMap[1]) {
    if (listenerMap[1].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, true);
    }
  }
  for (eventType in listenerMap[0]) {
    if (listenerMap[0].hasOwnProperty(eventType)) {
      this.rootElement.addEventListener(eventType, this.handle, false);
    }
  }

  return this;
};

/**
 * @param {string} eventType
 * @returns boolean
 */
Delegate.prototype.captureForType = function (eventType) {
  return ['blur', 'error', 'focus', 'load', 'resize', 'scroll'].indexOf(eventType) !== -1;
};

/**
 * Attach a handler to one
 * event for all elements
 * that match the selector,
 * now or in the future
 *
 * The handler function receives
 * three arguments: the DOM event
 * object, the node that matched
 * the selector while the event
 * was bubbling and a reference
 * to itself. Within the handler,
 * 'this' is equal to the second
 * argument.
 *
 * The node that actually received
 * the event can be accessed via
 * 'event.target'.
 *
 * @param {string} eventType Listen for these events
 * @param {string|undefined} selector Only handle events on elements matching this selector, if undefined match root element
 * @param {function()} handler Handler function - event data passed here will be in event.data
 * @param {Object} [eventData] Data to pass in event.data
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.on = function (eventType, selector, handler, useCapture) {
  var root, listenerMap, matcher, matcherParam;

  if (!eventType) {
    throw new TypeError('Invalid event type: ' + eventType);
  }

  // handler can be passed as
  // the second or third argument
  if (typeof selector === 'function') {
    useCapture = handler;
    handler = selector;
    selector = null;
  }

  // Fallback to sensible defaults
  // if useCapture not set
  if (useCapture === undefined) {
    useCapture = this.captureForType(eventType);
  }

  if (typeof handler !== 'function') {
    throw new TypeError('Handler must be a type of Function');
  }

  root = this.rootElement;
  listenerMap = this.listenerMap[useCapture ? 1 : 0];

  // Add master handler for type if not created yet
  if (!listenerMap[eventType]) {
    if (root) {
      root.addEventListener(eventType, this.handle, useCapture);
    }
    listenerMap[eventType] = [];
  }

  if (!selector) {
    matcherParam = null;

    // COMPLEX - matchesRoot needs to have access to
    // this.rootElement, so bind the function to this.
    matcher = matchesRoot.bind(this);

    // Compile a matcher for the given selector
  } else if (/^[a-z]+$/i.test(selector)) {
      matcherParam = selector;
      matcher = matchesTag;
    } else if (/^#[a-z0-9\-_]+$/i.test(selector)) {
      matcherParam = selector.slice(1);
      matcher = matchesId;
    } else {
      matcherParam = selector;
      matcher = matches;
    }

  // Add to the list of listeners
  listenerMap[eventType].push({
    selector: selector,
    handler: handler,
    matcher: matcher,
    matcherParam: matcherParam
  });

  return this;
};

/**
 * Remove an event handler
 * for elements that match
 * the selector, forever
 *
 * @param {string} [eventType] Remove handlers for events matching this type, considering the other parameters
 * @param {string} [selector] If this parameter is omitted, only handlers which match the other two will be removed
 * @param {function()} [handler] If this parameter is omitted, only handlers which match the previous two will be removed
 * @returns {Delegate} This method is chainable
 */
Delegate.prototype.off = function (eventType, selector, handler, useCapture) {
  var i, listener, listenerMap, listenerList, singleEventType;

  // Handler can be passed as
  // the second or third argument
  if (typeof selector === 'function') {
    useCapture = handler;
    handler = selector;
    selector = null;
  }

  // If useCapture not set, remove
  // all event listeners
  if (useCapture === undefined) {
    this.off(eventType, selector, handler, true);
    this.off(eventType, selector, handler, false);
    return this;
  }

  listenerMap = this.listenerMap[useCapture ? 1 : 0];
  if (!eventType) {
    for (singleEventType in listenerMap) {
      if (listenerMap.hasOwnProperty(singleEventType)) {
        this.off(singleEventType, selector, handler);
      }
    }

    return this;
  }

  listenerList = listenerMap[eventType];
  if (!listenerList || !listenerList.length) {
    return this;
  }

  // Remove only parameter matches
  // if specified
  for (i = listenerList.length - 1; i >= 0; i--) {
    listener = listenerList[i];

    if ((!selector || selector === listener.selector) && (!handler || handler === listener.handler)) {
      listenerList.splice(i, 1);
    }
  }

  // All listeners removed
  if (!listenerList.length) {
    delete listenerMap[eventType];

    // Remove the main handler
    if (this.rootElement) {
      this.rootElement.removeEventListener(eventType, this.handle, useCapture);
    }
  }

  return this;
};

/**
 * Handle an arbitrary event.
 *
 * @param {Event} event
 */
Delegate.prototype.handle = function (event) {
  var i,
      l,
      type = event.type,
      root,
      phase,
      listener,
      returned,
      listenerList = [],
      target,
      /** @const */EVENTIGNORE = 'ftLabsDelegateIgnore';

  if (event[EVENTIGNORE] === true) {
    return;
  }

  target = event.target;

  // Hardcode value of Node.TEXT_NODE
  // as not defined in IE8
  if (target.nodeType === 3) {
    target = target.parentNode;
  }

  root = this.rootElement;

  phase = event.eventPhase || (event.target !== event.currentTarget ? 3 : 2);

  switch (phase) {
    case 1:
      //Event.CAPTURING_PHASE:
      listenerList = this.listenerMap[1][type];
      break;
    case 2:
      //Event.AT_TARGET:
      if (this.listenerMap[0] && this.listenerMap[0][type]) listenerList = listenerList.concat(this.listenerMap[0][type]);
      if (this.listenerMap[1] && this.listenerMap[1][type]) listenerList = listenerList.concat(this.listenerMap[1][type]);
      break;
    case 3:
      //Event.BUBBLING_PHASE:
      listenerList = this.listenerMap[0][type];
      break;
  }

  // Need to continuously check
  // that the specific list is
  // still populated in case one
  // of the callbacks actually
  // causes the list to be destroyed.
  l = listenerList.length;
  while (target && l) {
    for (i = 0; i < l; i++) {
      listener = listenerList[i];

      // Bail from this loop if
      // the length changed and
      // no more listeners are
      // defined between i and l.
      if (!listener) {
        break;
      }

      // Check for match and fire
      // the event if there's one
      //
      // TODO:MCG:20120117: Need a way
      // to check if event#stopImmediatePropagation
      // was called. If so, break both loops.
      if (listener.matcher.call(target, listener.matcherParam, target)) {
        returned = this.fire(event, target, listener);
      }

      // Stop propagation to subsequent
      // callbacks if the callback returned
      // false
      if (returned === false) {
        event[EVENTIGNORE] = true;
        event.preventDefault();
        return;
      }
    }

    // TODO:MCG:20120117: Need a way to
    // check if event#stopPropagation
    // was called. If so, break looping
    // through the DOM. Stop if the
    // delegation root has been reached
    if (target === root) {
      break;
    }

    l = listenerList.length;
    target = target.parentElement;
  }
};

/**
 * Fire a listener on a target.
 *
 * @param {Event} event
 * @param {Node} target
 * @param {Object} listener
 * @returns {boolean}
 */
Delegate.prototype.fire = function (event, target, listener) {
  return listener.handler.call(target, event, target);
};

/**
 * Check whether an element
 * matches a generic selector.
 *
 * @type function()
 * @param {string} selector A CSS selector
 */
var matches = function (el) {
  if (!el) return;
  var p = el.prototype;
  return p.matches || p.matchesSelector || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector;
}(Element);

/**
 * Check whether an element
 * matches a tag selector.
 *
 * Tags are NOT case-sensitive,
 * except in XML (and XML-based
 * languages such as XHTML).
 *
 * @param {string} tagName The tag name to test against
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesTag(tagName, element) {
  return tagName.toLowerCase() === element.tagName.toLowerCase();
}

/**
 * Check whether an element
 * matches the root.
 *
 * @param {?String} selector In this case this is always passed through as null and not used
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesRoot(selector, element) {
  /*jshint validthis:true*/
  if (this.rootElement === window) return element === document;
  return this.rootElement === element;
}

/**
 * Check whether the ID of
 * the element in 'this'
 * matches the given ID.
 *
 * IDs are case-sensitive.
 *
 * @param {string} id The ID to test against
 * @param {Element} element The element to test with
 * @returns boolean
 */
function matchesId(id, element) {
  return id === element.id;
}

/**
 * Short hand for off()
 * and root(), ie both
 * with no parameters
 *
 * @return void
 */
Delegate.prototype.destroy = function () {
  this.off();
  this.root();
};

},{}],2:[function(require,module,exports){
/*global require, module*/
const oShare = require('./src/js/share');

const constructAll = function () {
	oShare.init();
	document.removeEventListener('o.DOMContentLoaded', constructAll);
};

document.addEventListener('o.DOMContentLoaded', constructAll);

module.exports = oShare;

},{"./src/js/share":4}],3:[function(require,module,exports){
/*global require, module*/

const DomDelegate = require("./../../../dom-delegate/lib/delegate.js");
/*const Tooltip = require('./Tooltip');*/

/**
 * Gets the width of a text by using a <canvas> element
 *
 * @param {string} text - The text to measure
 * @param {HTMLElement} refEl - The reference element where the text will be to get the font properties
 *
 * @returns {number}
 */
function getPixelWidthOfText(text, refEl) {
	const c = document.createElement("canvas");

	if (c.getContext && window.getComputedStyle) {
		const ctx = c.getContext("2d");
		const refElStyle = window.getComputedStyle(refEl);
		ctx.font = refElStyle.getPropertyValue('font-style') + " " + refElStyle.getPropertyValue('font-size') + " " + refElStyle.getPropertyValue('font-family');
		ctx.fillText(text, 10, 100);
		return ctx.measureText(text).width;
	}

	return -1;
}

/**
 * @class TextCopyHelper
 *
 * @param {Object} config
 * @param {string} config.text - Value of the url input element
 * @param {string} config.message - Tooltip text
 * @param {HTMLElement} config.parentEl - Parent element
 * @param {function} config.onDestroy - Optional, callback that will be ran on {@link destroy}
 * @param {function} config.onCopy - Optional, callback that will be ran when the 'copy' event is triggered
 */
function TextCopyHelper(config) {

	const textCopyHelper = this;
	const cssClass = 'o-share-tooltip';
	/**
  * Creates an input element for the URL setting it's correct width corresponding to said URL
  *
  * @private
  * @returns {HTMLElement} inputEl
  */
	function createInputElement(cssClass, text) {
		const inputEl = document.createElement('input');
		inputEl.setAttribute('type', 'text');
		inputEl.id = cssClass + '__url';
		inputEl.setAttribute('value', text);

		return inputEl;
	}

	// Ported from ./Tooltip.js to simply markup strure.
	function createMessageElement(cssClass, message) {
		const messageEl = document.createElement('span');
		messageEl.className = cssClass + '__text';
		messageEl.innerHTML = message;

		return messageEl;
	}

	function createTooltip(cssClass) {
		const tipEl = document.createElement('div');
		tipEl.className = cssClass;

		return tipEl;
	}

	/**
  * Initializes document.body and input dom-delegates and creates tooltip and input element
  *
  * @private
  */
	function init() {
		textCopyHelper.inputEl = createInputElement(cssClass, config.text);
		const inputWidth = getPixelWidthOfText(config.text, textCopyHelper.inputEl);

		if (inputWidth !== -1) {
			textCopyHelper.inputEl.style.width = inputWidth + 'px';
		}

		textCopyHelper.messageEl = createMessageElement(cssClass, config.message);

		textCopyHelper.tooltip = createTooltip(cssClass);

		textCopyHelper.tooltip.appendChild(textCopyHelper.inputEl);
		textCopyHelper.tooltip.appendChild(textCopyHelper.messageEl);

		config.parentEl.appendChild(textCopyHelper.tooltip);
		// select() must be put after inputEl appeared in the DOM tree.		
		textCopyHelper.inputEl.select();
		//		textCopyHelper.tooltip = new Tooltip(config.message, config.parentEl);
		textCopyHelper.config = config;

		textCopyHelper.bodyDomDelegate = new DomDelegate(document.body);

		textCopyHelper.inputDomDelegate = new DomDelegate(textCopyHelper.inputEl);
	}

	init();

	this.bodyDomDelegate.on('click', function (ev) {
		if (!config.parentEl.contains(ev.target)) {
			textCopyHelper.destroy();
		}
	});
	this.bodyDomDelegate.on('keydown', function (ev) {
		// 27 = Escape, 9 = Tab
		if (ev.keyCode === 27 || ev.keyCode === 9) {
			textCopyHelper.destroy();
		}

		// 8 = Backspace
		if (ev.keyCode === 8) {
			ev.stopImmediatePropagation();
			ev.preventDefault();
		}
	});

	// Stop input from being edited
	this.inputDomDelegate.on('keypress', function (ev) {
		ev.preventDefault();
	});

	this.inputDomDelegate.on('copy', function () {
		textCopyHelper.messageEl.innerHTML = '已复制!';

		if (typeof config.onCopy === "function") {
			config.onCopy();
		}
	});
}

/**
 * Destroys the TextCopyHelper, disabling event listeners, and removing the input and tooltip from DOM. Also runs optional {@link config.onDestroy}
 */
TextCopyHelper.prototype.destroy = function () {
	this.tooltip.removeChild(this.inputEl);
	this.inputEl = undefined;

	this.tooltip.removeChild(this.messageEl);
	this.messageEl = undefined;

	this.tooltip.parentElement.removeChild(this.tooltip);
	this.tooltip = undefined;
	//	this.tooltip.destroy();

	this.bodyDomDelegate.destroy();
	//	this.inputDomDelegate.destroy();

	if (typeof this.config.onDestroy === "function") {
		this.config.onDestroy();
	}
};

module.exports = TextCopyHelper;

},{"./../../../dom-delegate/lib/delegate.js":1}],4:[function(require,module,exports){
const DomDelegate = require("./../../../dom-delegate/lib/delegate.js");
const TextCopyHelper = require('./TextCopyHelper');

const socialUrls = {
	wechat: {
		name: "微信",
		url: "http://www.ftchinese.com/m/corp/qrshare.html?title={{title}}&url={{url}}&ccode=2C1A1408"
	},
	weibo: {
		name: "微博",
		url: "http://service.weibo.com/share/share.php?&appkey=4221537403&url={{url}}&title=【{{title}}】{{summary}}&ralateUid=1698233740&source=FT中文网&sourceUrl=http://www.ftchinese.com/&content=utf8&ccode=2G139005"
	},
	linkedin: {
		name: "领英",
		url: "http://www.linkedin.com/shareArticle?mini=true&url={{url}}&title={{title}}&summary={{summary}}&source=FT中文网"
	},
	facebook: {
		name: "Facebook",
		url: "http://www.facebook.com/sharer.php?u={{url}}"
	},
	twitter: {
		name: "Twitter",
		url: "https://twitter.com/intent/tweet?url={{url}}&amp;text={{title}}&amp;via=FTChinese"
	},
	url: {
		name: "复制链接",
		url: "{{url}}"
	}
};

// Get page meta content statically. Should not put this inside the `Share` object in order to reduce DOM traverse.
const fallbackConfig = {
	links: ['wechat', 'weibo', 'linkedin', 'facebook', 'twitter', 'url'],

	url: window.location.href || '',
	summary: function () {
		let descElement = document.querySelector('meta[property="og:description"]');
		if (descElement) {
			return descElement.hasAttribute('content') ? descElement.getAttribute('content') : '';
		}
		return '';
	}(),
	title: function () {
		let titleElement = document.querySelector('title');
		if (titleElement) {
			//`innerText` for IE
			let titleText = titleElement.textContent !== undefined ? titleElement.textContent : titleElement.innerText;
			return titleText.split('-')[0].trim();
		}
		return '';
	}()
};

/*
config = {
	url: 'http://www.fthince.com',location.href.
	title: 'Article Title',
	summary: 'A short summary of the article',
	links: ['wechat', 'weibo', 'linkedin']
}
*/
function Share(rootEl, config) {
	const oShare = this;
	const openWindows = {};

	function init() {
		if (!rootEl) {
			rootEl = document.body;
		} else if (!(rootEl instanceof HTMLElement)) {
			rootEl = document.querySelector(rootEl);
		}

		const rootDelegate = new DomDelegate(rootEl);
		rootDelegate.on('click', handleClick);
		rootEl.setAttribute('data-o-share--js', '');

		oShare.rootDomDelegate = rootDelegate;
		oShare.rootEl = rootEl;

		if (rootEl.children.length === 0) {
			if (!config) {
				config = {};
				config.links = rootEl.hasAttribute('data-o-share-links') ? rootEl.getAttribute('data-o-share-links').split(' ') : fallbackConfig.links;
				config.url = rootEl.getAttribute('data-o-share-url') || fallbackConfig.url;
				config.title = rootEl.getAttribute('data-o-share-title') || fallbackConfig.title;
				config.summray = rootEl.getAttribute('data-o-share-summary') || fallbackConfig.summary;
			}
			render();
		}

		const initEvent = new CustomEvent('oShare.ready', {
			detail: {
				share: oShare
			},
			bubbles: true
		});

		oShare.rootEl.dispatchEvent(initEvent);
	}

	function render() {
		const ulElement = document.createElement('ul');

		for (let i = 0; i < config.links.length; i++) {
			const link = config.links[i];
			const linkName = socialUrls[link].name;

			const liElement = document.createElement('li');
			liElement.classList.add('o-share__action', 'o-share__action--' + link);

			const aElement = document.createElement('a');
			// Do not need to encode url for `socialUrl[url]`
			if (link !== 'url') {
				aElement.href = generateSocialUrl(link);
			} else {
				aElement.href = config.url;
			}

			aElement.setAttribute('data-link-tooltip', linkName);

			const iElement = document.createElement('i');
			iElement.innerHTML = linkName;
			aElement.appendChild(iElement);

			liElement.appendChild(aElement);
			ulElement.appendChild(liElement);
		}
		oShare.rootEl.appendChild(ulElement);
	}

	function generateSocialUrl(socialNetwork) {
		let templateUrl = socialUrls[socialNetwork].url;
		templateUrl = templateUrl.replace('{{url}}', encodeURIComponent(config.url)).replace('{{title}}', encodeURIComponent(config.title)).replace('{{summary}}', encodeURIComponent(config.summary));

		return templateUrl;
	}

	function handleClick(e) {
		const actionEl = e.target.closest('li.o-share__action');

		if (oShare.rootEl.contains(actionEl) && actionEl.querySelector('a[href]')) {
			e.preventDefault();

			const url = actionEl.querySelector('a[href]').href;

			const clickEvent = new CustomEvent('oTracking.event', {
				detail: {
					category: 'share',
					action: 'click',
					button: actionEl.textContent.trim()
				}
			});
			oShare.rootEl.dispatchEvent(clickEvent);

			if (actionEl.classList.contains('o-share__action--url')) {
				copyLink(url, actionEl);
			} else {
				shareSocial(url);
			}
		}
	}

	function copyLink(url, parentEl) {
		if (!url || !parentEl || parentEl.hasAttribute('aria-selected')) {
			return;
		}
		parentEl.setAttribute('aria-selected', 'true');

		new TextCopyHelper({
			message: '分享此链接',
			text: url,
			parentEl: parentEl,
			onCopy: function () {
				oShare.rootEl.dispatchEvent(new CustomEvent('oShare.copy', {
					detail: {
						share: oShare,
						action: 'url',
						url: url
					}
				}));
			},
			onDestroy: function () {
				parentEl.removeAttribute('aria-selected');
			}
		});

		oShare.rootEl.dispatchEvent(new CustomEvent('oShare.open', {
			detail: {
				share: oShare,
				action: 'url',
				url: url
			}
		}));
	}

	function shareSocial(url) {
		if (url) {
			if (openWindows[url] && !openWindows[url].closed) {
				openWindows[url].focus();
			} else {
				openWindows[url] = window.open(url, '', 'width=646,height=436');
			}

			oShare.rootEl.dispatchEvent(new CustomEvent('oShare.open', {
				detail: {
					share: oShare,
					action: 'social',
					url: url
				}
			}));
		}
	}

	init();
}

Share.prototype.destroy = function () {
	this.rootDomDelegate.destroy();

	for (let i = 0; i < this.rootEl.children; i++) {
		this.rootEl.removeChild(this.rootEl.chidlren[i]);
	}

	this.rootEl.removeAttribute('data-o-share--js');
	this.rootEl = undefined;
};

Share.init = function (el) {
	const shareInstances = [];

	if (!el) {
		el = document.body;
	} else if (!el instanceof HTMLElement) {
		el = document.querySelector(el);
	}

	const shareElements = el.querySelectorAll('[data-o-component=o-share]');

	for (let i = 0; i < shareElements.length; i++) {
		if (!shareElements[i].hasAttribute('data-o-header--js')) {
			shareInstances.push(new Share(shareElements[i]));
		}
	}

	return shareInstances;
};

const OSharePrototype = Object.create(HTMLElement.prototype);

Share.Element = document.registerElement ? document.registerElement('o-share', {
	prototype: OSharePrototype
}) : undefined;

module.exports = Share;

},{"./../../../dom-delegate/lib/delegate.js":1,"./TextCopyHelper":3}],5:[function(require,module,exports){
'use strict';

var oShare = require("./../bower_components/ftc-share/main.js");

oShare.init();

$(function () {

	/* variables*/
	var $w = $(window);
	var pageName = window.location.pathname;
	var headerHeight = $('.header').height();
	var viewportHeight = $(window).height() - headerHeight;
	var $tocNav = $('.nav__toc').eq(0);

	/* Show/Hide Navigation */
	showHideNav($('.small-menu'), $('.nav__toc'));

	backToTop($('.to-top'));

	/* Generate navigation and deal with scrolled pagination */
	var navLinks = generateNav($('.nav__toc'), $('.nav-target'));

	var navTargetTops = getOffsetTop($('.nav-target')).toArray();

	var wScrolledTop = $w.scrollTop();
	var currentPage = onWhichPage(wScrolledTop, navTargetTops);
	var previousPage = currentPage;
	activeNavLink(currentPage, navLinks);
	logPages(pageName, currentPage);

	$w.on('scroll', function () {
		var wScrolledTop = $w.scrollTop();
		var currentPage = onWhichPage(wScrolledTop, navTargetTops);
		if (previousPage !== currentPage) {
			previousPage = currentPage;
			activeNavLink(currentPage, navLinks);
			logPages(pageName, currentPage);
		}
	});
});

function activeNavLink(currentPage, navLinks) {
	var currentNavLink = navLinks[currentPage - 1];
	currentNavLink.addClass('active');
	currentNavLink.siblings().removeClass('active');
}

function onWhichPage(x, arr) {
	//Initially you are on the page 1.
	var j = 1;
	for (var i = 0; i < arr.length; i++) {
		// If x > arr[i], you are on the page i+1.
		if (x >= arr[i]) {
			j = i + 1;
		}
	}
	return j;
}

function logPages(pageName, pageNumber) {
	try {
		ga('send', 'pageview', pageName + '?page=' + pageNumber);
		fa('send', 'pageview', pageName + '?page=' + pageNumber);
		ftcLog();
	} catch (ignore) {}
}

function backToTop($elm) {
	$elm.on('click', function (e) {
		e.preventDefault();
		$(window).scrollTo(0, 1000);
	});
}

function getOffsetTop($elms) {
	return $elms.map(function () {
		return $(this).offset().top;
	});
}

function generateNav($navContainer, $navTargets) {
	var navLinks = [];
	$navTargets.each(function (i) {
		var targetId = $(this).attr('id');
		var link = $('<a/>', {
			'href': '#' + targetId,
			'click': function (e) {
				e.preventDefault();
				$(window).scrollTo(document.getElementById(targetId), 300);
				$(e.target).addClass('active');
				$(e.target).siblings().removeClass('active');
			}
		}).text(i + 1);

		$navContainer.append(link);
		navLinks.push(link);
	});
	return navLinks;
}

function showHideNav($elm, $navContainer) {
	$('body').on('load click touch', function () {
		$navContainer.addClass('hide-on-small');
	});

	$elm.on('click touch', function (e) {
		$navContainer.toggleClass('hide-on-small');
		e.stopPropagation();
	});
}

},{"./../bower_components/ftc-share/main.js":2}]},{},[5])


//# sourceMappingURL=bundle.js.map
