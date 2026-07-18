(function (global) {
  "use strict";

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    }
  }

  function renderResults(data, decisionText, typeLabel) {
    if (!data || typeof data !== "object") {
      return;
    }

    setText("results-title", decisionText || "Análisis de decisión");
    setText("results-type", typeLabel || "Otro");
    setText("results-dictamen", data.dictamen || "Sin dictamen");
    // Compute fragility from Gemini's six scores if available, otherwise fallback to provided fragilidad
    var fragilityValue = null;
    if (data.scores && typeof data.scores === 'object') {
      fragilityValue = computeFragilityFromScores(data.scores);
      // expose computed value to data for potential debugging
      data.fragilidad_computed = fragilityValue;
    } else if (data.fragilidad !== undefined) {
      fragilityValue = Number(data.fragilidad);
    }
    setText("results-fragilidad", (fragilityValue !== null && !isNaN(fragilityValue) ? fragilityValue : "—") + "");
    setText("results-fragilidad-label", (fragilityValue !== null && !isNaN(fragilityValue) ? fragilityValue : "—") + "/100");

    var swot = data.swot || {};
    renderList("swot-fortalezas", swot.fortalezas || []);
    renderList("swot-debilidades", swot.debilidades || []);
    renderList("swot-oportunidades", swot.oportunidades || []);
    renderList("swot-amenazas", swot.amenazas || []);

    var verdict = data.verdict || {};
    renderList("verdict-cargos", verdict.cargos || []);
    setText("verdict-riesgo", verdict.riesgo || "Sin riesgo principal");
    setText("verdict-seguirias", verdict.seguirias || "No disponible");

    // update meter width
    var meter = document.getElementById("fragility-meter");
    var meterValue = (typeof fragilityValue === 'number' && !isNaN(fragilityValue)) ? fragilityValue : (Number(data.fragilidad) || 0);
    if (meter) {
      meter.style.width = (isNaN(meterValue) ? 0 : Math.max(0, Math.min(100, meterValue))) + "%";
    }

    // render breakdown if scores provided
    var breakdownEl = document.getElementById('fragility-breakdown');
    if (breakdownEl) {
      renderFragilityBreakdown(breakdownEl, data);
    }

    var resultsScreen = document.getElementById("r-results");
    if (resultsScreen) {
      resultsScreen.checked = true;
    }
    window.scrollTo(0, 0);
  }

  function renderList(id, items) {
    var el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.innerHTML = "";
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "swot-item";
      li.innerHTML = '<span class="swot-item-dot"></span>' + (item || "");
      el.appendChild(li);
    });
  }

  // compute final fragility from six 0..10 scores using specified weights
  function computeFragilityFromScores(scores) {
    var weights = {
      problema_propuesta_valor: 0.25,
      mercado_competencia: 0.20,
      validacion: 0.20,
      ejecucion: 0.15,
      riesgos_criticos: 0.10,
      claridad_decision: 0.10
    };
    var total = 0;
    Object.keys(weights).forEach(function (k) {
      var s = Number(scores[k]);
      if (isNaN(s)) s = 0;
      // score is 0..10, contribution = (s/10) * weight * 100 = s * weight * 10
      var contrib = s * weights[k] * 10;
      total += contrib;
    });
    return Math.round(Math.max(0, Math.min(100, total)));
  }

  function renderFragilityBreakdown(containerEl, data) {
    containerEl.innerHTML = '';
    var scores = data.scores || {};
    var weights = {
      problema_propuesta_valor: { label: 'Problema y propuesta de valor', weight: 0.25 },
      mercado_competencia: { label: 'Mercado y competencia', weight: 0.20 },
      validacion: { label: 'Validación', weight: 0.20 },
      ejecucion: { label: 'Ejecución', weight: 0.15 },
      riesgos_criticos: { label: 'Riesgos críticos', weight: 0.10 },
      claridad_decision: { label: 'Claridad de la decisión', weight: 0.10 }
    };

    var list = document.createElement('div');
    list.className = 'fragility-breakdown-list';
    Object.keys(weights).forEach(function (k) {
      var label = weights[k].label;
      var w = weights[k].weight;
      var s = Number(scores[k]);
      if (isNaN(s)) s = 0;
      var contrib = Math.round(s * w * 10);

      var row = document.createElement('div');
      row.className = 'fragility-breakdown-row';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.padding = '6px 0';

      var left = document.createElement('div');
      left.style.flex = '1';
      left.textContent = label;

      var middle = document.createElement('div');
      middle.style.width = '80px';
      middle.style.textAlign = 'right';
      middle.textContent = (s % 1 === 0 ? s.toFixed(0) : s.toFixed(1)) + ' / 10';

      var right = document.createElement('div');
      right.style.width = '72px';
      right.style.textAlign = 'right';
      right.textContent = contrib + ' pts';

      row.appendChild(left);
      row.appendChild(middle);
      row.appendChild(right);

      list.appendChild(row);
    });

    containerEl.appendChild(list);
  }

  global.AppRender = {
    renderResults: renderResults
  };
})(window);
