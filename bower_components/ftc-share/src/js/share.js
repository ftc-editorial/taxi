const DomDelegate = require('dom-delegate');
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
	summary: (function() {
			let descElement = document.querySelector('meta[property="og:description"]');
			if (descElement) {
				return descElement.hasAttribute('content') ? descElement.getAttribute('content') : '';
			}
			return '';
		})(),
	title: (function() {
			let titleElement = document.querySelector('title');
			if (titleElement) {
	//`innerText` for IE
				let titleText = (titleElement.textContent !== undefined) ? titleElement.textContent : titleElement.innerText;
				return titleText.split('-')[0].trim();
			}
			return '';
		})()
};

/*
config = {
	url: 'http://www.fthince.com',location.href.
	title: 'Article Title',
	summary: 'A short summary of the article',
	links: ['wechat', 'weibo', 'linkedin']
}
*/
function Share (rootEl, config) {
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

		const initEvent = new CustomEvent('oShare.ready',
			{
				detail: {
					share: oShare
				},
				bubbles: true
			}
		);

		oShare.rootEl.dispatchEvent(initEvent);
	}

	function render() {
		const ulElement = document.createElement('ul');

		for (let i = 0; i < config.links.length; i++) {
			const link = config.links[i];
			const linkName = socialUrls[link].name;
			
			const liElement = document.createElement('li');
			liElement.classList.add('o-share__action', 'o-share__action--' + link)
			
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

	function generateSocialUrl (socialNetwork) {
		let templateUrl = socialUrls[socialNetwork].url;
		templateUrl = templateUrl.replace('{{url}}', encodeURIComponent(config.url))
			.replace('{{title}}', encodeURIComponent(config.title))
			.replace('{{summary}}', encodeURIComponent(config.summary));
		
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
			onCopy: function() {
				oShare.rootEl.dispatchEvent(new CustomEvent('oShare.copy', {
					detail: {
						share: oShare,
						action: 'url',
						url: url
					}
				}));
			},
			onDestroy: function() {
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

Share.prototype.destroy = function() {
	this.rootDomDelegate.destroy();

	for (let i = 0; i < this.rootEl.children; i++) {
		this.rootEl.removeChild(this.rootEl.chidlren[i]);
	}

	this.rootEl.removeAttribute('data-o-share--js');
	this.rootEl = undefined;
};

Share.init = function(el) {
	const shareInstances = [];

	if (!el) {
		el =document.body;
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