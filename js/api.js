(function (global) {
  "use strict";

  async function submitDecision(options) {
    var decision = options && options.decision ? options.decision.trim() : "";
    var type = options && options.type ? options.type : "Otro";
    var debug = CONFIG && CONFIG.DEBUG;

    if (!decision) {
      throw new Error("Escribe una decisión para analizar.");
    }

    var hasApiKey = CONFIG && CONFIG.API_KEY && CONFIG.API_KEY !== "TU_GEMINI_API_KEY_AQUI";
    if (!hasApiKey) {
      throw new Error("Configura tu API Key de Gemini en js/config.js antes de continuar.");
    }

    var endpoint = CONFIG.ENDPOINT + "?key=" + encodeURIComponent(CONFIG.API_KEY);
    var requestBody = AppPrompt.buildGeminiPayload(type, decision);

    try {
      var startTime = debug ? performance.now() : 0;
      if (debug) {
        console.groupCollapsed("Gemini DEBUG");
        console.log("Prompt enviado a Gemini:", requestBody);
        console.log("Endpoint utilizado:", endpoint);
        console.log("Modelo utilizado:", CONFIG.MODEL);
      }

      var response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      var payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }

      if (debug) {
        var duration = performance.now() - startTime;
        console.log("Tiempo de respuesta:", duration.toFixed(2) + " ms");
        console.log("JSON recibido:", payload);
      }

      if (!response.ok) {
        var errorMsg = payload && payload.error ? payload.error.message || JSON.stringify(payload.error) : "Error desconocido";
        throw new Error("Gemini: " + errorMsg);
      }

      if (!payload || !payload.candidates || !payload.candidates[0]) {
        throw new Error("La respuesta de Gemini no contiene resultados.");
      }

      var textBlock = payload.candidates[0].content.parts[0].text;
      if (!textBlock) {
        throw new Error("Gemini no devolvió texto.");
      }

      var parsed = JSON.parse(textBlock);

      // Client-side fallback: if Gemini did not return the six required scores,
      // compute them deterministically from the parsed response.
      function isValidScores(obj) {
        if (!obj || typeof obj !== 'object') return false;
        var keys = ['problema_propuesta_valor','mercado_competencia','validacion','ejecucion','riesgos_criticos','claridad_decision'];
        return keys.every(function(k){ return typeof obj[k] === 'number' || (typeof obj[k] === 'string' && !isNaN(Number(obj[k]))); });
      }

      function toNum(v){ var n = Number(v); return isNaN(n)?0:n; }

      function computeScoresFromParsed(p) {
        var dictamen = (p.dictamen || '').toLowerCase();
        var swot = p.swot || {};
        var verdict = p.verdict || {};
        var nCargos = Array.isArray(verdict.cargos) ? verdict.cargos.length : 0;
        var nDeb = Array.isArray(swot.debilidades) ? swot.debilidades.length : 0;
        var nFort = Array.isArray(swot.fortalezas) ? swot.fortalezas.length : 0;

        // 1) Problema y propuesta de valor (0..10)
        // Start neutral at 5, +1 per fortaleza, -1 per debilidad, clamp 0..10
        var problema = 5 + Math.min(5, nFort) - Math.min(5, nDeb);
        if (/vago|poco claro|poca propuesta|no claro|confuso/.test(dictamen)) problema -= 2;
        if (/claro|bien definido|fuerte propuesta|propuesta clara/.test(dictamen)) problema += 2;

        // 2) Mercado y competencia
        var oportunidades = Array.isArray(swot.oportunidades) ? swot.oportunidades.length : 0;
        var amenazas = Array.isArray(swot.amenazas) ? swot.amenazas.length : 0;
        var mercado = 5 + Math.min(5, oportunidades - amenazas);
        if (/saturad|competit|muy competit/.test(dictamen)) mercado -= 2;
        if (/ventaja competitiva|diferenciador|único/.test(dictamen)) mercado += 2;

        // 3) Validación
        var validacion = 5;
        if (/sin datos|no se ha validado|no probado|no hay información|no probado/.test(dictamen)) validacion -= 3;
        if (/piloto|prueba|clientes piloto|early users|evidencia|validado|validación|datos positivos/.test(dictamen)) validacion += 3;
        // penalize lack of clear validation signals
        if (validacion < 0) validacion = 0;

        // 4) Ejecución
        // More cargos and debilidades suggest execution risk -> lower score
        var ejecucion = Math.max(0, 10 - (nCargos * 1.5) - (nDeb * 0.8));

        // 5) Riesgos críticos (map risk text to 0..10 where 10 is high fragility)
        var riesgoText = (verdict.riesgo || '').toLowerCase();
        var riesgos = 5;
        if (/muy alto|extremo/.test(riesgoText)) riesgos = 10;
        else if (/alto/.test(riesgoText)) riesgos = 8;
        else if (/medio/.test(riesgoText)) riesgos = 5;
        else if (/bajo/.test(riesgoText)) riesgos = 2;
        else if (/muy bajo/.test(riesgoText)) riesgos = 0;

        // 6) Claridad de la decisión
        var claridad = 6;
        if (/falta|insuficiente|no se sabe|no está claro|confuso/.test(dictamen)) claridad -= 3;
        if (/claro|bien definido|objetivos claros/.test(dictamen)) claridad += 2;

        // clamp to 0..10 and round to 1 decimal
        function clamp10(x){ x = Math.round(Math.max(0, Math.min(10, x)) * 10) / 10; return x; }

        return {
          problema_propuesta_valor: clamp10(problema),
          mercado_competencia: clamp10(mercado),
          validacion: clamp10(validacion),
          ejecucion: clamp10(ejecucion),
          riesgos_criticos: clamp10(riesgos),
          claridad_decision: clamp10(claridad)
        };
      }

      if (debug) {
        console.log("JSON parseado:", parsed);
      }

      if (!parsed.scores || !isValidScores(parsed.scores)) {
        var fallbackScores = computeScoresFromParsed(parsed);
        parsed.scores = fallbackScores;
        if (debug) console.log('Fallback scores computed:', fallbackScores);
      }

      if (debug) {
        console.groupEnd();
      }

      return parsed;
    } catch (error) {
      if (debug) {
        console.error("Gemini DEBUG Error:", error);
        console.groupEnd();
      }
      if (error instanceof SyntaxError) {
        throw new Error("Respuesta de Gemini no es JSON válido.");
      }
      if (error && error.message) {
        throw error;
      }
      throw new Error("No se pudo conectar con la API de Gemini.");
    }
  }

  global.AppAPI = {
    submitDecision: submitDecision
  };
})(window);
