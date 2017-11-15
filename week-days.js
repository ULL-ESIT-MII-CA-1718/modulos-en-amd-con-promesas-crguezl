// Module week-days
define(["chuchu"], function(Chuchu) {
  var names = ["Sunday", "Monday", "Tuesday", "Wednesday",
               "Thursday", "Friday", "Saturday"];
  return {
    name: function(number) { return names[number]; },
    number: function(name) { return names.indexOf(name); },
    chuchu: Chuchu
  };
});
