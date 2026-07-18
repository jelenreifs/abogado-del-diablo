(function (global) {
  "use strict";

  function buildSystemInstruction() {
    return "Eres «El Abogado del Diablo», un analista de decisiones implacable y escéptico.\n" +
      "Tu trabajo NO es agradar ni validar la idea, sino someterla a la crítica más dura\n" +
      "y honesta para proteger a quien decide de su sesgo de confirmación. Reglas: no\n" +
      "infles las fortalezas ni endulces las debilidades; cuestiona los supuestos\n" +
      "implícitos; sé concreto y específico, nada de tópicos; prioriza lo más relevante.\n" +
      "No inventes hechos ni supuestos que no aparezcan en la decisión. Si falta\n" +
      "información crítica, dilo explícitamente y no la sustituyas por conjeturas.\n" +
      "No des por hecho que una idea es buena solo porque suena ambiciosa ni que es mala\n" +
      "solo porque suena arriesgada; analiza la evidencia disponible con rigor.\n" +
      "Evalúa únicamente las SEIS dimensiones siguientes con una puntuación entre 0 y 10 (0 = muy sólido, 10 = muy débil). Devuelve un objeto JSON que incluya `dictamen`, `scores` (objeto con las seis puntuaciones), `swot` y `verdict`. NO devuelvas un número final de fragilidad — la aplicación cliente calculará el índice final con pesos fijos.\n" +
      "Dimensiones (devuelve en `scores` con exactamente estas claves):\n" +
      "1) 'problema_propuesta_valor' — Problema y propuesta de valor\n" +
      "2) 'mercado_competencia' — Mercado y competencia\n" +
      "3) 'validacion' — Validación\n" +
      "4) 'ejecucion' — Ejecución\n" +
      "5) 'riesgos_criticos' — Riesgos críticos\n" +
      "6) 'claridad_decision' — Claridad de la decisión\n" +
      "Para cada dimensión, explica brevemente en el `dictamen` la justificación (texto), y devuelve `scores` con valores numéricos entre 0 y 10 (enteros o decimales con un decimal).\n" +
      "Devuelve EXCLUSIVAMENTE el JSON del esquema, sin texto adicional ni markdown.";
  }

  function buildUserPrompt(type, decision) {
    return "Tipo de decisión: " + type + ".\nDecisión: " + decision;
  }

  function buildResponseSchema() {
    return {
      type: "object",
      properties: {
        dictamen: { type: "string" },
        scores: {
          type: "object",
          properties: {
            problema_propuesta_valor: { type: "number", minimum: 0, maximum: 10 },
            mercado_competencia: { type: "number", minimum: 0, maximum: 10 },
            validacion: { type: "number", minimum: 0, maximum: 10 },
            ejecucion: { type: "number", minimum: 0, maximum: 10 },
            riesgos_criticos: { type: "number", minimum: 0, maximum: 10 },
            claridad_decision: { type: "number", minimum: 0, maximum: 10 }
          },
          required: ["problema_propuesta_valor", "mercado_competencia", "validacion", "ejecucion", "riesgos_criticos", "claridad_decision"]
        },
        swot: {
          type: "object",
          properties: {
            fortalezas: { type: "array", items: { type: "string" } },
            debilidades: { type: "array", items: { type: "string" } },
            oportunidades: { type: "array", items: { type: "string" } },
            amenazas: { type: "array", items: { type: "string" } }
          },
          required: ["fortalezas", "debilidades", "oportunidades", "amenazas"]
        },
        verdict: {
          type: "object",
          properties: {
            cargos: { type: "array", items: { type: "string" } },
            riesgo: { type: "string" },
            seguirias: { type: "string" }
          },
          required: ["cargos", "riesgo", "seguirias"]
        }
      },
      required: ["dictamen", "scores", "swot", "verdict"]
    };
  }

  function buildGeminiPayload(type, decision) {
    return {
      contents: [
        {
          role: "user",
          parts: [{ text: buildUserPrompt(type, decision) }]
        }
      ],
      systemInstruction: {
        parts: [{ text: buildSystemInstruction() }]
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: buildResponseSchema()
      }
    };
  }

  global.AppPrompt = {
    buildGeminiPayload: buildGeminiPayload
  };
})(window);
