Social media and URL sharing buttons modified from Financial Times o-share component.

- Provides the ability to share a URL provided by the product
- Uses a standard set of social media icons.
- Provides a copyable representation of a link

## Getting started

The simplest markup you might need looks like this:

```html
<div data-o-component="o-share"
    class="o-share"
    data-o-share-links="{{links}}"
    data-o-share-url="{{url}}"
    data-o-share-title="{{title}}"
    data-o-share-summary="{{summary}}">
</div>
```

The different options are:

* `links`: List of lower case social networks to be added separated by a space.
* `url`: The URL to be shared.
* `title`: The title of the content to be shared
* `summary`: Summary text to be shared.

The different social networks are (in the order frequency used in China):

* Wechat
* Weibo
* Linkedin
* Facebook
* Twitter
* URL (The url to be copied for share)

You can take a look at the example by running `gulp serve`.

### Instantiation

#### Javascript
To instantiate the JavaScript:

```javascript
var oShare = require('o-share');
var oShareInstance = new oShare(document.querySelector('[data-o-component=o-share]'));
```

The markup will be generated for that instance of `o-share`.

You can also instantiate all instances in your page by running `oShare.init` which returns an array with all of them.

## Events

This module will trigger the following events on its root element:

* `oShare.ready` - when a share links behaviour has been initialised
* `oShare.open` - when a share link has been opened (popup/flyout opened as a result of button click)
* `oShare.copy` - when the URL has been copied

#### Sass

```scss
@import 'o-share/main';
```

We also support silent mode. So if you want to use all the default `o-share` classes, you need to set it to false:

```scss
$o-share-is-silent: false;
@import 'o-share/main';
```

If not, you can just use our mixins to set you custom class.

## SASS API

We provide default icons image. 3 alternative groups of images and related color sets are provided besides the default ones. If you want to use the alternative sets, you need to `$o-share-use-default-icon` to `false` and use `oShareIcons` mixin:

```sass
$o-share-is-silent: false;
$$o-share-use-default-icon: false;
@import 'o-share/main';
@include oShareIcons($set);
```

Parameter `$set` could be one of the fllowwing:

* polychrome
* duotone
* monochrome

Other mixins:

- `oShareBase`  set the layout of every icon container
- `oShareActionLink`  set styles specific to url-icon (the last one in the default output) 
- `oShareLinkTooltip` the tooltip shown up when you hover over the icon.
- `oShareSetIconSize($size)`  sets the icons size.
- `oShareActionIcon($name, $color:'white', $bgcolor:'wechat', $bghovercolor: false)`;

The `$color`, `$bgcolor` and `$bghovercolor` should be color values or one of those strings as listed in o-colors palette. $bghovercolor could accept a false value to turn hove effects off.

Each icons official color was added to o-colors' palette, or you can directly get the value from the list:

```sass
$o-share-icon-colors: (
    wechat:#609700,
    weibo: #e6162d,
    linkedin:#0977b6,
    facebook: #3c5a99,
    twitter: #6aa9e0,
    url: #27757b
);
```

## JS API

`oShare` accepted an optional config object which takes precedence over the `data` attributes set on the container:

```javascript
var config = {
    links: ['wechat', 'weibo', 'linkedin'],
    url: window.location.href,
    title: 'Syria oil map',
    summary: 'How the Isis oil economy works, explained through the journey of a barrel of oil in Syria',
};
```

If you do not pass the `config`, the script will first search `data` attributes of container for related infomation. If no `data` is specified, it will use an internal fallback config object, which searched `meta` tag on the page used as open graph for `summary` and `<title>` value for `title`. You should at leat provide a `meta` tag with the following attributes and values in your HTML file:

```html
<meta property="og:description" content="summary of the article" />
```

### Generated Markup
```html
<ul>
    <li class="o-share__action o-share__action--wechat">
        <a href="" data-link-tooltip="微信">
            <i>微信</i>
        </a>
    </li>
</ul>
```