[See section *Slow-loading modules* from Chapter10 of the book *Eloquent JavaScript*](http://eloquentjavascript.net/10_modules.html)

Though it is possible to use the CommonJS module style when writing
JavaScript for the browser, it is somewhat involved. The reason for
this is that reading a file (module) from the Web is a lot slower
than reading it from the hard disk. While a script is running in
the browser, nothing else can happen to the website on which it
runs, for reasons that will become clear in [Chapter 14](http://eloquentjavascript.net/14_event.html#timeline). 

This means
that if every `require` call went and fetched something from some
faraway web server, the page would freeze for a painfully long time
while loading its scripts.

One way to work around this problem is to run a program like [Browserify](http://browserify.org/) 
on your code before you serve it on a web page. This will look for
calls to `require`, resolve all dependencies, and gather the needed
code into a single big file. The website itself can simply load
this file to get all the modules it needs.

Another solution is to wrap the code that makes up your module in
a function so that **the module loader can first load its dependencies
in the background and then call the function**, initializing the
module, when the dependencies have been loaded. That is what the
Asynchronous Module Definition (AMD) module system does.

**Example of use:**

```
[~/EJS/chapter10-modules/slow-loading-modules(master)]$ cat main.js 
// global define
define = require(__dirname+"/amd.js");

define(["week-days"], function(weekDay) {
  console.log(weekDay.name(0));
});
```

**Example of Execution**
 
```
[~/EJS/chapter10-modules/slow-loading-modules(master)]$ node main.js 
Sunday
```

**Debugging**

```
[~/EJS/chapter6-the-secret-life-of-objects(master)]$ cat gulpfile.js
// En versiones v8.*  chrome://inspect en el navegador
gulp.task('debug', shell.task('node inspect main-draw-table.js'));
```
