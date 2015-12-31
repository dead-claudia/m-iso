# m-iso

***This package is deprecated, as Mithril doesn't require a lot of modifications to implement this.***

[![Build Status](https://travis-ci.org/isiahmeadows/m-iso.svg)](https://travis-ci.org/isiahmeadows/m-iso)

Mithril for the server side, done right.

Supports rendering strings, nodes, and even components. Also features some other facets of the Mithril API. You can even render entire pages with this thing.

*(Do note the 0.x semver. The API is still not stable, and much of this is still a work in progress. Things may break at any time.)*

```
npm install --save m-iso
```

## Why not [mithril-node-render](https://github.com/StephanHoyer/mithril-node-render)?

(I've been asked this a few times.)

That module is great for just stringifying Mithril templates into HTML, and is very well suited to that use case.

The problem is that it's not very pluggable (fixable without a rewrite), and I needed something far heavier on the server side. Something that I can use dependency injection to use stateful components unmodified on the server side. I need something with Mithril's state model as well as rendering to strings. One thing I'm planning on eventually adding here is server-side routing and state management.

## Examples

A small web page that loads Bootstrap and its dependencies, along with the entry script and a `<div>` to mount to.

```js
var m = require("m-iso")

var html = m.render([
    m("!doctype", "html"),
    m("head", [
        m("script[src=//code.jquery.com/jquery-2.1.4.min.js]"),
        m("link[rel=stylesheet][href=/static/bootstrap.css]"),
        m("script[src=/static/bootstrap.js]"),
        m("link[rel=stylesheet][href=/static/bootstrap-theme.css]"),
        m("script[src=/static/index.js]")
    ]),
    m("body", [
        m("img[src=/static/image.png]"),
        m("#body"),
        m("script", m.trust("$('#body').append(getChild())"))
    ])
])
```

```html
<!-- HTML equivalent -->
<!DOCTYPE html>
<head>
    <script src="//code.jquery.com/jquery-2.1.4.min.js"></script>
    <link rel="stylesheet" href="/static/bootstrap.css">
    <script src="/static/bootstrap.js"></script>
    <link rel="stylesheet" href="/static/bootstrap-theme.css">
    <script src="/static/index.js"></script>
</head>
<body>
    <img src="/static/image.png">
    <div id="body"></div>
    <script>$('#body').append(getChild())</script>
</body>
```

It also allows for several output formats:

- HTML5
- HTML4 (legacy)
- Polyglot HTML5
- XHTML1
- XML

Much of the virtual DOM node was ~~taken shamelessly~~adapted from Mithril, so it supports the full Mithril offering in selector syntax. You can even do things like this (another example adapted from the tests):

```js
// A simple Android XML view layout, adapted from an Android design-related blog
// post.
var xml = m.render([
    m("?xml"),
    m.r("android.support.design.widget.CoordinatorLayout", {
        "xmlns:android": "http://schemas.android.com/apk/res/android",
        "xmlns:app": "http://schemas.android.com/apk/res-auto",
        "android:layout_width": "match_parent",
        "android:layout_height": "match_parent"
    }, [
        m.r("android.support.v7.widget.RecyclerView", {
            "android:layout_width": "match_parent",
            "android:layout_height": "match_parent",
            "app:layout_behavior": "@string/appbar_view_behavior"
        }),
        m.r("android.support.design.widget.AppBarLayout", {
            "android:layout_width": "match_parent",
            "android:layout_height": "wrap_content"
        }, [
            m.r("android.support.v7.widget.Toolbar", {
                "app:layout_scrollFlags": "scroll|enterAlways"
            }),
            m.r("android.support.design.widget.TabLayout", {
                "app:layout_scrollFlags": "scroll|enterAlways"
            })
        ])
    ])
])
```

```xml
<!-- The equivalent XML -->
<?xml version="1.1" ?>
<android.support.design.widget.CoordinatorLayout
        xmlns:android="http://schemas.android.com/apk/res/android"
        xmlns:app="http://schemas.android.com/apk/res-auto"
        android:layout_width="match_parent"
        android:layout_height="match_parent">

    <android.support.v7.widget.RecyclerView
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            app:layout_behavior="@string/appbar_view_behavior" />

    <android.support.design.widget.AppBarLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content">

        <android.support.v7.widget.Toolbar
            app:layout_scrollFlags="scroll|enterAlways" />

        <android.support.design.widget.TabLayout
            app:layout_scrollFlags="scroll|enterAlways" />

    </android.support.design.widget.AppBarLayout>
</android.support.design.widget.CoordinatorLayout>
```

## API

**`m(selector, attrs?, ...children)`, `m(component, ...args)`**

[Mithril's virtual DOM factory.](http://mithril.js.org/mithril.html) This also works with components, just as Mithril's does.

**`m.r(name, attrs?, ...children)`**

This prevents parsing the `name` as a selector. For example, `m.r("a.b")` returns a virtual DOM node that looks like this: `{tag: "a.b", attrs: {}, children: []}`. It's mostly for XML, as one example above demonstrated.

**`m.r(component, ...args)`**

Alias of `m.component` for consistency.

**`m.component(component, ...args)`**

[Mithril's `m.component()` factory.](http://mithril.js.org/mithril.component.html) Works the same as Mithril's.

**`m.route.buildQueryString(obj)`**

[Mithril's `m.route.buildQueryString()`.](http://mithril.js.org/mithril.route.html#buildQueryString) Works the same as Mithril's.

**`m.route.parseQueryString(obj)`**

[Mithril's `m.route.parseQueryString()`.](http://mithril.js.org/mithril.route.html#parseQueryString) Works the same as Mithril's.

**`m.trust(string)`**

Trust this string. Same as [Mithril's `m.trust()`](http://mithril.js.org/mithril.trust.html). If you need to render a string that doesn't need escaping, this is how you do it.

**`m.render(tree, type="html", voids?, hooks?)`**

Renders a node tree to some format. It infers the type if you don't give it explicitly, but do use a `!doctype` or XML declaration.

- `tree` - The tree to render. It may be a string, a trusted string, a virtual node, a component with a view, or a possibly nested array of any of the above.

- `type` - The type to infer by default. Generally, you don't need to pass this argument unless you're rendering a fragment of something other than normal HTML5.

  Possible values (this will error if given an invalid, non-null value):

  - `"html"` - HTML5 (this is the default)
  - `"html-polyglot"` - Polyglot HTML markup
  - `"html4"` - Legacy HTML 4.01
  - `"xhtml"` - Legacy XHTML 1
  - `"xml"` - XML 1.0/1.1

  Note that due to an implementation detail, if you pass an explicit `type` and also include an XML declaration, it will be changed as the XML variant of that type, if applicable, e.g. `"html"` to `"html-polygot"`.

- `voids` - The list to check against to figure out what's a void element and what's not, such as `<br>` and `<img>`. This replaces the internal list for that respective type. This argument is meaningless and ignored when in `"xml"` mode.

- `hooks` - A plain object with hooks for the string renderer. Currently, there's only one hook, but there may be more later:

    - `print(node)` - Takes a virtual node, and returns a transformed node.

Note that also, `type` can be inferred from the tree itself, if you use a `!doctype` or XML declaration. Here's how values are inferred

- `"html"`:

  ```js
  m.render([
    m("!doctype", "html")
  ])
  ```

- `"html-polygot"`:

  ```js
  m.render([
    m("?xml"), // XML declaration
    m("!doctype", "html")
  ])
  ```

- `"html4"`:

  ```js
  m.render([
    m("!doctype", "html4-strict")
  ])

  m.render([
    m("!doctype", "html4-transitional")
  ])

  m.render([
    m("!doctype", "html4-frameset")
  ])
  ```

- `"xhtml"`:

  ```js
  m.render([
    m("?xml"), // XML declaration
    m("!doctype", "html4-strict")
  ])

  m.render([
    m("?xml"), // XML declaration
    m("!doctype", "html4-transitional")
  ])

  m.render([
    m("?xml"), // XML declaration
    m("!doctype", "html4-frameset")
  ])
  ```

- `"xml"`

  ```js
  m.render([
    m("?xml")
    m("non-doctype-element")
  ])
  ```

**`m.deferred()`**

[Mithril's `m.deferred()`](mithril.js.org/mithril.deferred.html), with mostly same implementation.

**`m.sync()`**

[Mithril's `m.sync()`](http://mithril.js.org/mithril.sync.html) with same implementation.

**`m.prop()`**

[Mithril's `m.prop()`](http://mithril.js.org/mithril.prop.html) with same implementation.

## Additional syntax

To support generating DTDs, XML declarations, etc., there are some additional syntax this supports on the renderer side.

- `"!doctype"` - This string, case-insensitive, turns into a `<!DOCTYPE>` declaration with the appropriate contents. The possible values for it are:

  - `m("!doctype", "html")` - The HTML5 DTD.

    ```html
    <!DOCTYPE html>
    ```

  - `m("!doctype", "html4-strict")` - The HTML4 Strict DTD.

    ```html
    <!DOCTYPE HTML PUBLIC
        "-//W3C//DTD HTML 4.01//EN"
        "http://www.w3.org/TR/html4/strict.dtd">
    ```

  - `m("!doctype", "html4-transitional")` - The HTML4 Transitional DTD.

    ```html
    <!DOCTYPE HTML PUBLIC
        "-//W3C//DTD HTML 4.01 Transitional//EN"
        "http://www.w3.org/TR/html4/loose.dtd">
    ```

  - `m("!doctype", "html4-frameset")` - The HTML4 Frameset DTD.

    ```html
    <!DOCTYPE HTML PUBLIC
        "-//W3C//DTD HTML 4.01 Frameset//EN"
        "http://www.w3.org/TR/html4/frameset.dtd">
    ```

- `m("?xml")` - This string, case-sensitive, turns into an XML declaration. It takes the following options as attributes:

  - `version` - The version, either `1.0` or `1.1`. It can be a string or a number that equals that string (which is converted by `version.toPrecision(1)`).

  - `encoding` - The encoding to specify in the XML declaration. Defaults to `"utf-8"`.

  - `standalone` - The `standalone` attribute in the XML declaration. It may be `"yes"` or `"no"` (as according to spec), or it may be a boolean, `true` for `"yes"` or `false` for `"no"`

Note that these are parsed as any other tag. XML declaration attributes can be specified as normal attributes, such as `m("?xml[version=1.0][encoding="utf-8"][standalone=yes]")`.

## Bugs and feature requests

Use the issue tracker.

There's still things I want to add, in decreasing order of priority:

- `m.withAttr()` to make strings similarly to Mithril's making anonymous functions.
- Hooks for an external renderer.
- `m.request()` for easier access on server side.
- `m.route()` for organizing routes.
- An internal representation to manage component trees (and not just stringify them). Along with this would come `m.render()` on an existing root, and `m.redraw()`, `m.redraw.strategy()`, `m.startComputation()`, and `m.endComputation()` for dealing with redraws. This could also become pluggable.
- `m.mount()` for mounting onto existing nodes.
- `m.request.mock()` for mocking requests.

## Contributing

Pull requests are most definitely welcome. Tests are run through Travis CI on Node 0.10, 0.12, and 4.0 and the last io.js version, so it's easy to catch failing tests.

This project in its entirety is run through ESLint.

As for a style guide, check out the [eslint config](https://github.com/impinball/m-iso/blob/master/.eslintrc).

## Other Information

Do note that this is more permissive than Mithril in what a component can return. This will accept anything from a single node to a nested array of mixed strings, nodes, and even ES6 Symbols. It'll also accept anything that provides a view function as input, even if it's just a `{view: function () {}}`, returning `undefined`.

## License

ISC
