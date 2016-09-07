# Humblebee Boilerplate using Browserify and Babel

* * *

## UPDATES

### 2016-02-015
* Added mixins for responsive gutter, see /tools/_mixins.scss
* Changed variable-names for breakpoints, added variables for gutter and container-layout.
* Added mixins for breakpoints, see /tools/_breakpoints.scss
* Added object prefix to grid components: container, row, col.

### 2016-02-02
* New structure of sass files. Added folder for objects, files for elements and utilities.
* Added mixin for vh-units. Use this to prevent buggy behavior on devices running iOS 7 and lower.

* * *

## Workflow

* gulp (watch) : for development and livereload (default: localhost:8000)
* gulp build : for a one off development build
* gulp build --production : for a minified production build

* * *

## Included packages

* fastclick (https://www.npmjs.com/package/fastclick)
* handlebars (https://www.npmjs.com/package/handlebars)
* jquery (https://www.npmjs.com/package/jquery)
* outdated-browser-rework (https://www.npmjs.com/package/outdated-browser-rework) 
* canvid (https://www.npmjs.com/package/canvid)

Add whatever module you might think would be nice to have in our daily workflow with npm install [package name] --save.

* * *

## How to use Browserify

### Using modules written by you

Require your modules the way you would do with node, for example: to use the module helpers.js within our app.js we would write

```
var helpers = require('modules/helpers');
```
We can then use the methods within helpers.js:
```
var clonedObj = helpers.cloneObject({ a: '1', b: '2' });
```

With the help of aliasify we can require our modules using absolute paths, instead of typing "../../module" for instance.

Browserify will then look at our javascript files within our js-folder, and depending on the modules that where required it will output a bundle including only the files that we're using.

### Using modules written by others

Instead of using bower or some other package manager (well, npm is indeed a package manager) we'll use npm. Install the module of your choice the same way you would install a dev dependency: npm install [package name] --save.

To use this package we then basically do the same thing as we did with our own written modules, the only difference is that you wont't need to target the modules-folder. Instead you'll just write the name of the library/plugin (the same name as you used when you installed it with npm).

Some modules might not be CommonJS-compatible, then you would need to use browserify-shim (https://github.com/thlorenz/browserify-shim) to make them compatible. This is a bit tricky, even more so if the plugin has dependencies on its own.


* * *

## Using Babel

Babel is: "Babel is a JavaScript transpiler, also known as a source-to-source compiler. It converts JavaScript code with ES6 language features to equivalent code that uses only language features from the widely-supported ES5 specification.".

To integrate it with browserify, just add "babelify" to our list with transformers inside our package.json. The 

"browserify": {
    "transform": [
        "babelify",
        "aliasify"
    ]
}


* * *

## SCSS

The sass files are located in the css-folder and outputs as styles.css. The structure of folders and files are mostly inspired by this article http://www.sitepoint.com/architecture-sass-project/. If you don't feel like putting any effort in trying to organize your code, if it's a smaller project for instance, just use like the _main.scss file in /base and ignore everything else.

styles.scss in root will import each glob-file that every folder contains, the glob file will then import the files within it's folder. 

Instead of using compass for compiling sass this boilerplate uses gulp-sass which includes and take advantage of a library called libsass which implements sass in C. This means that ruby is no longer a dependency for every project.

* * *
