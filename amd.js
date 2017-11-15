var fs = require('fs');
var util = require("util");

var backgroundReadFile = fs.readFile;

var defineCache = Object.create(null);
var currentMod = null;

function getModule(name) {
  if (name in defineCache)
    return defineCache[name];

  var module = {
    name: name,    // for debugging only
    exports: null, // Contains the object returned by the module function once it has been evaluated
		loaded: false, // It is set to true when the module has been read and fully evaluated
		onLoad: []     // Queue of 'event handlers'  "whenDepsLoaded" to execute for the modules waiting for the load of this  module
  };
  defineCache[name] = module;
  backgroundReadFile(name+".js", function(err, code) {
		if (err) {
			throw err;
		}
    /* We assume the loaded file also contains a (single) call to define. 
     * The currentMod variable is used to tell this call about the
     * module object that is currently being loaded so that it can
     * update this object when it finishes loading.
     */
    currentMod = module;
    console.log("backgroundReadFile callback: finished reading file "+name+" now is currentMod: "+util.inspect(currentMod));
    new Function("", code)();
  });
  return module;
}

/*
 * The define function uses getModule to fetch or create the
 * module objects for the current module’s dependencies. Its task is
 * to schedule the moduleFunction (the function that contains the
 * module’s actual code) to be run whenever those dependencies are
 * loaded.
 */
function define(depNames, moduleFunction) {
  var myMod = currentMod;
  var deps = depNames.map(getModule);

  console.log("define: myMod = "+util.inspect(myMod)+" depNames = "+depNames);
  deps.forEach(function(mod) {
    if (!mod.loaded)  // whenDepsLoaded is added to the onLoad array of all dependencies that are not yet loaded.
      mod.onLoad.push(whenDepsLoaded); // I believe closure here plays an important role
    console.log("mod.onLoad: "+util.inspect(mod.onLoad));
  });

  function whenDepsLoaded() {
    if (!deps.every(function(m) { return m.loaded; }))
      return;  
      /* This function immediately returns if there are still
       * unloaded dependencies, so it will do actual work only once,
       * when the last dependency has finished loading.
       */

    console.log("whenDepsLoaded. myMod = "+util.inspect(myMod));
    var args = deps.map(function(m) { 
      return m.exports; 
    });
    console.log("whenDepsLoaded: calling with args:\n  "+util.inspect(args));
    var exports = moduleFunction.apply(null, args);
    if (myMod) {
      myMod.exports = exports;
      myMod.loaded = true;
      myMod.onLoad.forEach(function(f) { f(); }); // Call whenDepsLoaded for all the modules which depend on this module
    }
  }
  // whenDepsLoaded is also called from define itself, in case there are no dependencies that need to be loaded.
  whenDepsLoaded();
};
/* function define(module dependencies list, callback) */
module.exports =  define;
