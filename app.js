/* El Abogado del Diablo — mejoras progresivas (JS opcional).
   La maquetación vive en index.html y la interacción base (enrutado entre
   pantallas y selector de tipo) se resuelve solo con CSS mediante radios
   ocultos. Este archivo añade lo que el CSS no puede hacer por sí mismo:
   contador de caracteres, validación del envío y simulación de carga.
   Si el JS no se carga, la app sigue siendo navegable. */
(function () {
  "use strict";

  var MIN = 20; // caracteres mínimos para habilitar el envío

  /* 1) Volver arriba al cambiar de pantalla */
  var routes = document.querySelectorAll('input[name="screen"]');
  Array.prototype.forEach.call(routes, function (r) {
    r.addEventListener("change", function () {
      window.scrollTo(0, 0);
    });
  });

  /* 2) Formulario: contador de caracteres, pista y validación */
  var ta = document.getElementById("dt");
  var cnt = document.getElementById("cnt");
  var hint = document.getElementById("hint");
  var submit = document.getElementById("sbtn");

  function refresh() {
    if (!ta) return;
    var len = ta.value.length;
    var valid = ta.value.trim().length >= MIN;
    if (cnt) cnt.textContent = len + " car.";
    if (hint) hint.style.display = (len > 0 && len < MIN) ? "block" : "none";
    if (submit) submit.classList.toggle("is-disabled", !valid);
  }

  if (ta) {
    ta.addEventListener("input", refresh);
    refresh(); // estado inicial (envío deshabilitado al estar vacío)
  }

  /* 3) Envío: simula el análisis antes de mostrar el veredicto */
  if (submit) {
    submit.addEventListener("click", function (e) {
      // Si está deshabilitado o ya analizando, no hacemos nada
      if (submit.classList.contains("is-disabled") || submit.classList.contains("is-loading")) {
        e.preventDefault();
        return;
      }
      // Evitamos el cambio inmediato de pantalla para mostrar la carga
      e.preventDefault();
      submit.classList.add("is-loading");
      var original = submit.innerHTML;
      submit.innerHTML = '<span class="spinner"></span> Analizando tu decisión...';

      setTimeout(function () {
        var results = document.getElementById("r-results");
        if (results) results.checked = true; // muestra la pantalla de resultados
        window.scrollTo(0, 0);
        submit.classList.remove("is-loading");
        submit.innerHTML = original;
      }, 2200);
    });
  }
})();
