(function (global) {
  "use strict";

  var MIN_CHARACTERS = 20;
  var textarea = null;
  var counter = null;
  var hint = null;
  var submitButton = null;

  function getSelectedType() {
    var checked = document.querySelector('input[name="dtype"]:checked');
    if (!checked) {
      return "Otro";
    }
    var label = document.querySelector('label[for="' + checked.id + '"]');
    return label ? label.textContent.trim() : checked.id;
  }

  function updateFormState() {
    if (!textarea || !submitButton || !counter || !hint) {
      return;
    }

    var length = textarea.value.length;
    var isValid = textarea.value.trim().length >= MIN_CHARACTERS;

    counter.textContent = length + " car.";
    hint.style.display = length > 0 && length < MIN_CHARACTERS ? "block" : "none";
    submitButton.classList.toggle("is-disabled", !isValid);
  }

  function setLoading(isLoading) {
    if (!submitButton) {
      return;
    }

    if (isLoading) {
      submitButton.classList.add("is-loading");
      submitButton.innerHTML = '<span class="spinner"></span> Analizando tu decisión...';
    } else {
      submitButton.classList.remove("is-loading");
      submitButton.innerHTML = submitButton.dataset.originalHtml || submitButton.innerHTML;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!submitButton || submitButton.classList.contains("is-disabled") || submitButton.classList.contains("is-loading")) {
      return;
    }

    setLoading(true);
    var decisionText = textarea.value.trim();
    var typeLabel = getSelectedType();

    global.AppAPI.submitDecision({ decision: decisionText, type: typeLabel })
      .then(function (result) {
        global.AppRender.renderResults(result, decisionText, typeLabel);
      })
      .catch(function (error) {
        window.alert(error && error.message ? error.message : "No se pudo completar el análisis.");
      })
      .finally(function () {
        setLoading(false);
      });
  }

  function init() {
    textarea = document.getElementById("dt");
    counter = document.getElementById("cnt");
    hint = document.getElementById("hint");
    submitButton = document.getElementById("sbtn");

    if (!textarea || !submitButton) {
      return;
    }

    submitButton.dataset.originalHtml = submitButton.innerHTML;
    textarea.addEventListener("input", updateFormState);
    submitButton.addEventListener("click", handleSubmit);
    updateFormState();
  }

  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  global.AppUI = {
    init: init
  };

  boot();
})(window);
