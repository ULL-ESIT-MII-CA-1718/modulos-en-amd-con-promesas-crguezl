var fs = require('fs');

const {inspect, promisify} = require('util');

//Node.js 8 has a new utility function: util.promisify(). It converts a callback-based function to a Promise-based one.
// See http://2ality.com/2017/05/util-promisify.html
var backgroundReadFile = promisify(fs.readFile);

var defineCache = Object.create(null);
var currentMod = {
      name: "main",    // for debugging only
      exports: null, // Contains the object returned by the module function once it has been evaluated
      loaded: false, // It is set to true when the module has been read and fully evaluated
      onLoad: []     // Queue of 'event handlers'  "whenDepsLoaded" to execute for the modules waiting for the load of this  module
    };

function getModule(name) {
  let gM = new Promise((success, reject) => {
    //if (name in defineCache) success(defineCache[name]);

    var module = {
      name: name,    // for debugging only
      exports: null, // Contains the object returned by the module function once it has been evaluated
      loaded: false, // It is set to true when the module has been read and fully evaluated
      onLoad: []     // Queue of 'event handlers'  "whenDepsLoaded" to execute for the modules waiting for the load of this  module
    };
    defineCache[name] = module;
    backgroundReadFile(name+".js").then((code) => {
      /* We assume the loaded file also contains a (single) call to define. 
       * The currentMod variable is used to tell this call about the
       * module object that is currently being loaded so that it can
       * update this object when it finishes loading.
       */
      currentMod = module;
      //console.log("backgroundReadFile callback: finished reading file "+name+" now is currentMod: "+inspect(currentMod));
      /*jslint evil: true */ // https://github.com/jamesallardice/jslint-error-explanations/blob/master/message-articles/function-constructor.md
      new Function("", code)();  // Evaluate it!
      success(module);
    }, (err) => {
      console.log("rejecting ... "+name);
      reject(err);
    });
    // return module;
  });
  return gM;
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
  myMod.moduleFunction = moduleFunction;


  Promise.all(deps).then((modules) => {
    function whenDepsLoaded() {
      if (!modules.every(function(m) { return m.loaded; }))
        return;  
        /* This function immediately returns if there are still
         * unloaded dependencies, so it will do actual work only once,
         * when the last dependency has finished loading.
         */

      //console.log("whenDepsLoaded. myMod = "+inspect(myMod));
      var args = modules.map(function(m) { 
        return m.exports; 
      });
      //console.log("whenDepsLoaded: calling with args:\n  "+inspect(args));
      var exports = moduleFunction.apply(null, args);
      if (myMod) {
        myMod.exports = exports;
        myMod.loaded = true;
        myMod.onLoad.forEach(function(f) { f(); }); // Call whenDepsLoaded for all the modules which depend on this module
        // console.log("whenDepsLoaded after: myMod = "+inspect(myMod, {depth: null})+"\n   depNames = "+depNames);
        // console.log("whenDepsLoaded after. All deps read. Array modules is:\n  "+inspect(modules, {depth: null}));
      }
    }

    modules.forEach(function(mod) {
      if (!mod.loaded)  // whenDepsLoaded is added to the onLoad array of all dependencies that are not yet loaded.
        mod.onLoad.push(whenDepsLoaded); // I believe closure here plays an important role
      // console.log("mod.onLoad: "+inspect(mod.onLoad));
    });
    whenDepsLoaded();
    // var exports = moduleFunction.apply(null, args);
    // myMod.loaded = true;
    // myMod.exports = exports;
    //  myMod.onLoad.forEach(function(f) { f(); }); // Call whenDepsLoaded for all the modules which depend on this module
  }).catch((error) => console.log("Ufff!!!! myMod = "+inspect(myMod)+" Error: "+error));
}
/* function define(module dependencies list, callback) */
module.exports =  define;
