// global define
define = require(__dirname+"/amd.js");

// Dependencies:
// main |-> week-days -> chuchu
//      `->  tutu
define(["week-days", "tutu"], function(weekDay, Tutu) {
  console.log("main: "+Tutu);
  console.log("main: "+weekDay.chuchu);
  console.log("main: "+weekDay.name(0));
});

