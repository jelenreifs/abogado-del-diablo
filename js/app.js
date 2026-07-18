(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    if (window.AppUI && typeof window.AppUI.init === "function") {
      window.AppUI.init();
    }
  });
})();
