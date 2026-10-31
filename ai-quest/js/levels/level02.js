(function (root) {
  const A = (root.AIQ = root.AIQ || {});
  const { has, words } = A.util;
  const SCEN = '<b>Escenario:</b> eres coordinador/a de logística y debes escribir a una clienta, <i>Marta Ríos</i>, porque su pedido <b>#4821</b> se retrasa 3 días (llegará el viernes). Quieres que la IA redacte el correo.';
  const tier = (v) => {
    const t = (v.p || ''), a = A.prompt.analyze(t);
    if (words(t) < 4) return '<i>Escribe tu prompt para ver cómo cambia la respuesta simulada.</i>';
    if (a.score < 35) return '<b>Asunto:</b> Información\n<br><br>Estimado cliente: lamentamos informarle que podría haber novedades con su solicitud. Gracias por su comprensión. Atentamente, La Empresa.<br><br><span class="muted small">⚠ Respuesta genérica: faltan destinatario, hechos, tono y formato.</span>';
    if (a.score < 70) return '<b>Asunto:</b> Retraso en su pedido<br><br>Hola Marta: su pedido #4821 se retrasará. Lamentamos las molestias y la mantendremos informada. Saludos.<br><br><span class="muted small">Mejor, pero aún sin fecha clara, compensación ni longitud controlada.</span>';
    return '<b>Asunto:</b> Tu pedido #4821 llegará el viernes<br><br>Hola Marta:<br>Queremos avisarte con transparencia: tu pedido #4821 se retrasó 3 días y llegará este viernes. Lamentamos el inconveniente. Como compensación, te enviamos un cupón del 10 % para tu próxima compra. Si necesitas cambiar algo, respóndenos y lo resolvemos hoy.<br>Un abrazo,<br>Logística<br><br><span class="muted small">✓ Respuesta precisa: destinatario, hechos, tono, formato y acción.</span>';
  };
  A.levels[2] = {
    n: 2, name: 'Prompt Initiation', subtitle: 'Aprendiendo a comunicarte con la IA', icon: '💬', bloom: 'Comprender · Aplicar',
    badge: { id: 'promptbuilder', name: 'Prompt Builder', icon: '💬' },
    objective: 'Transformarás 5 prompts ambiguos en instrucciones claras (contexto, objetivo y resultado esperado) alcanzando ≥ 80% en la rúbrica de precisión.',
    narrative: 'La IA es una colaboradora brillante que acaba de llegar a tu empresa: sabe mucho, pero no conoce tu situación. Todo lo que no le cuentas, lo adivina. Este nivel trata de dejar de hacerla adivinar.',
    voice: {
      intro: 'Nivel dos: Prompt Initiation. Un prompt es la instrucción que le das a la inteligencia artificial. Aprenderás a pasar de preguntas vagas a instrucciones claras, con contexto, objetivo y resultado esperado.',
      challenge: 'Reto del nivel dos: tienes cinco prompts ambiguos. Reescríbelos para que cualquier persona entienda qué se pide, para quién y en qué formato. Cada prompt se evalúa con tres criterios.',
      done: 'Excelente. Ya no le pides cosas a la inteligencia artificial: le das instrucciones claras. Insignia Prompt Builder desbloqueada.',
    },
    concept: [
      { h: '¿Qué es un prompt?', p: '<p>Es la <b>entrada</b> que le das al modelo: pregunta, instrucción, datos, ejemplos. El modelo responde a todo lo que ve en ese texto; no puede leer tu mente ni conocer tu empresa.</p>' },
      { h: 'Pregunta vs. instrucción', p: '<p><b>Pregunta:</b> «¿Qué es el phishing?» → una explicación genérica.<br><b>Instrucción:</b> «Explica el phishing a vendedores sin conocimientos técnicos en 5 puntos con un ejemplo» → un resultado útil y específico.</p>' },
      { h: 'Contexto, objetivo y resultado esperado', p: '<ul><li><b>Contexto:</b> quién eres, para quién, qué datos tienes.</li><li><b>Objetivo:</b> para qué lo necesitas.</li><li><b>Resultado esperado:</b> formato, longitud, tono.</li></ul>' },
      { h: 'Ambigüedad y precisión', p: '<p>«Hazlo corto» ¿cuánto? «Algo profesional» ¿para quién? Sustituye palabras vagas por criterios medibles: <i>«máximo 120 palabras, tono cordial, con un asunto»</i>.</p>' },
      { h: 'Errores comunes', p: '<ul><li>Pedir sin contexto ni insumos («resume esto» sin pegar el texto).</li><li>Mezclar demasiadas tareas en un solo prompt.</li><li>No definir formato ni longitud.</li><li>Dar por hecho que la IA conoce tu empresa.</li><li>No iterar: el primer resultado rara vez es el mejor.</li><li>Incluir datos sensibles innecesarios.</li></ul>' },
    ],
    example: { title: 'De vago a preciso', html: '<table class="t"><tr><th>Antes</th><th>Después</th></tr><tr><td>«Hazme un resumen.»</td><td>«Resume en 5 viñetas el texto delimitado por ### para la gerente comercial. Destaca decisiones y fechas. Tono neutro. ### [texto] ###»</td></tr></table><p>Mismo modelo, mismo texto: lo que cambió fue la <b>calidad de la instrucción</b>.</p>' },
    practice: [
      { id: 'l2-mt', type: 'match', title: 'Diagnostica el prompt', xp: 40, goal: 'Une cada prompt con el problema principal que tiene.', hint: 'Pregúntate qué falta: ¿insumo?, ¿objetivo?, ¿formato?, ¿precisión?, ¿demasiadas tareas?',
        pairs: [['«Escribe algo sobre ventas.»', 'Falta objetivo y audiencia'], ['«Resume esto» (sin pegar el texto)', 'Falta el insumo/contexto'], ['«Hazlo corto.»', 'Ambigüedad: no define cuánto es corto'], ['«Dame ideas de marketing, finanzas y RR. HH.»', 'Demasiadas tareas mezcladas'], ['«Escribe un correo.»', 'No define destinatario, tono ni formato']] },
      { id: 'l2-sim', type: 'designer', title: 'Simulador de prompts', xp: 80, goal: 'Escribe un prompt para redactar el correo. Mira cómo cambia la respuesta simulada a medida que lo mejoras. Meta: ≥ 80% de la rúbrica.', hint: 'Añade: a quién escribes, hechos (pedido, retraso, fecha), tono, longitud máxima y qué acción esperas.',
        scenario: SCEN + '<br><span class="muted small">La respuesta se genera con plantillas locales según la estructura de tu prompt; es una <b>simulación</b> didáctica, no un modelo real.</span>',
        fields: [{ id: 'p', kind: 'text', label: 'Tu prompt', rows: 6, ph: 'Escribe una instrucción para la IA…' }],
        preview: tier, previewLabel: 'Respuesta simulada',
        rules: [
          { label: 'Indica destinatario / contexto (Marta, clienta…)', check: (v) => has(v.p, /marta|clienta|cliente|destinatari/i), hint: 'Dile a quién va dirigido el correo.' },
          { label: 'Incluye los hechos (pedido 4821, retraso de 3 días, viernes)', check: (v) => has(v.p, /4821/) && has(v.p, /(3|tres)\s*d[ií]as|viernes/i), hint: 'La IA no conoce el número de pedido ni la fecha.' },
          { label: 'Define el objetivo (informar, disculparse, mantener la relación…)', check: (v) => has(v.p, /(objetivo|para (informar|disculpar|mantener|que)|informar|disculp)/i), hint: 'Explica para qué es el correo.' },
          { label: 'Fija tono y/o formato (cordial, asunto, viñetas…)', check: (v) => has(v.p, /(tono|cordial|formal|emp[aá]tic|asunto|formato)/i), hint: 'Indica el tono y si debe llevar asunto.' },
          { label: 'Limita la longitud (p. ej. máximo 120 palabras)', check: (v) => has(v.p, /(\d+\s*(palabras|l[ií]neas|p[aá]rrafos)|m[aá]ximo\s*\d+|breve)/i), hint: 'Usa un número: «máximo 120 palabras».' },
        ],
        sample: 'Actúa como coordinador de logística. Escribe un correo a Marta Ríos, clienta, para informarle que su pedido #4821 se retrasó 3 días y llegará el viernes. Objetivo: mantener su confianza. Tono cordial y transparente, con asunto, máximo 120 palabras y una compensación del 10 %.' },
      { id: 'l2-ord', type: 'order', title: 'El ciclo de iteración', xp: 40, goal: 'Ordena los pasos del ciclo para mejorar un prompt.', hint: 'Se empieza escribiendo y se termina volviendo a probar.', explain: 'Iterar es parte del método: escribir, evaluar, detectar el fallo y ajustar.',
        items: ['Escribir un primer prompt claro', 'Leer y evaluar la respuesta', 'Identificar qué faltó o sobró', 'Ajustar contexto, restricciones o formato', 'Probar de nuevo y comparar'] },
    ],
    challenge: { id: 'l2-ch', type: 'designer', title: 'Reto: 5 prompts ambiguos → 5 instrucciones claras', xp: 120, goal: 'Reescribe cada prompt ambiguo. Cada uno se evalúa con 3 criterios (15 en total). Necesitas ≥ 80%.', hint: 'Para cada prompt incluye: a quién/qué (contexto), para qué (objetivo) y cómo lo quieres (formato o longitud).',
      fields: [
        { id: 'a', kind: 'text', label: '1. «Escribe un correo.»', rows: 2 }, { id: 'b', kind: 'text', label: '2. «Resume este documento.»', rows: 2 }, { id: 'c', kind: 'text', label: '3. «Dame ideas de marketing.»', rows: 2 }, { id: 'd', kind: 'text', label: '4. «Mejora mi texto.»', rows: 2 }, { id: 'e', kind: 'text', label: '5. «Explícame la inteligencia artificial.»', rows: 2 }],
      rules: [
        { label: 'P1 · Indica destinatario y propósito', check: (v) => has(v.a, /(cliente|proveedor|equipo|jefe|jefa|colega|gerente|candidat)/i) && has(v.a, /(para|solicitar|informar|confirmar|agradecer|objetivo)/i), hint: '¿A quién y para qué?' },
        { label: 'P1 · Define tono o formato', check: (v) => has(v.a, /(tono|formal|cordial|breve|asunto|\d+\s*palabras)/i), hint: 'Tono, asunto o longitud.' },
        { label: 'P1 · Es lo bastante específico (≥ 15 palabras)', check: (v) => words(v.a) >= 15 },
        { label: 'P2 · Incluye o delimita el texto a resumir', check: (v) => has(v.b, /(a continuaci[oó]n|texto|adjunto|\[.*\]|"""|###|---|:\s)/i), hint: 'Indica dónde está el insumo: «texto delimitado por ###».' },
        { label: 'P2 · Define audiencia o uso del resumen', check: (v) => has(v.b, /(para (la|el|los|las)|audiencia|gerente|equipo|cliente|direcci[oó]n|junta)/i), hint: '¿Quién leerá el resumen?' },
        { label: 'P2 · Fija formato/longitud (p. ej. 5 viñetas)', check: (v) => has(v.b, /(\d+\s*(palabras|puntos|bullets|l[ií]neas|vi[ñn]etas)|vi[ñn]etas|bullets)/i), hint: 'Número de viñetas o palabras.' },
        { label: 'P3 · Indica producto/público', check: (v) => has(v.c, /(producto|curso|servicio|p[uú]blico|audiencia|clientes|marca|empresa)/i), hint: '¿Marketing de qué y para quién?' },
        { label: 'P3 · Pide cantidad o formato', check: (v) => has(v.c, /(\d+\s*ideas|\d+\s*opciones|lista|tabla)/i), hint: '«10 ideas en una tabla».' },
        { label: 'P3 · Incluye una restricción (presupuesto, canal, tono)', check: (v) => has(v.c, /(presupuesto|\$|sin costo|bajo costo|restric|canal|redes|sin |evita|solo)/i), hint: 'Presupuesto, canal o lo que se debe evitar.' },
        { label: 'P4 · Dice qué mejorar (claridad, tono, concisión…)', check: (v) => has(v.d, /(claridad|tono|ortograf|concis|estructura|persuas|gram[aá]tica|fluidez)/i), hint: '«Mejora la claridad y la concisión».' },
        { label: 'P4 · Indica para quién es el texto', check: (v) => has(v.d, /(para (un|una|el|la|los|las)|audiencia|lector|p[uú]blico|cliente|gerente)/i), hint: '¿Quién lo leerá?' },
        { label: 'P4 · Indica qué conservar', check: (v) => has(v.d, /(mant[eé]n|conserva|sin cambiar|no cambies|respeta|no alteres)/i), hint: '«Mantén mi voz y los datos».' },
        { label: 'P5 · Fija nivel/audiencia', check: (v) => has(v.e, /(principiante|ni[ñn]o|gerente|sin conocimientos|nivel|equipo|estudiante|no t[eé]cnic)/i), hint: '¿Para quién y con qué nivel?' },
        { label: 'P5 · Define formato o longitud', check: (v) => has(v.e, /(\d+\s*(palabras|p[aá]rrafos|puntos|minutos|l[ií]neas)|vi[ñn]etas|breve|esquema)/i), hint: 'Longitud o estructura.' },
        { label: 'P5 · Pide ejemplo o analogía', check: (v) => has(v.e, /(ejemplo|analog[ií]a|compar|met[aá]fora)/i), hint: 'Un ejemplo cotidiano ayuda a entender.' },
      ], sample: '1) Redacta un correo cordial para un cliente, con asunto, para confirmar que su pedido llegará el viernes (máx. 100 palabras).\n2) Resume el texto delimitado por ### en 5 viñetas para la gerente comercial. ### [texto] ###\n3) Dame 10 ideas de marketing para nuestro curso de ventas dirigido a pymes, en una tabla, con presupuesto bajo.\n4) Mejora la claridad y concisión de mi texto para un cliente; mantén mi tono y los datos.\n5) Explícame la IA como a un gerente sin conocimientos técnicos, en 3 párrafos y con una analogía.' },
    mastery: [
      { q: '¿Cuál es la diferencia más útil entre una pregunta y una instrucción?', o: ['La instrucción especifica tarea, contexto y resultado esperado', 'La pregunta siempre es más corta', 'No hay diferencia', 'La instrucción solo sirve para código'], a: 0, e: 'Una instrucción orienta qué hacer y cómo entregarlo.' },
      { q: '«Hazlo corto» es un problema de…', o: ['Ambigüedad: no define cuánto es corto', 'Falta de verbos', 'Exceso de contexto', 'Formato JSON'], a: 0, e: 'Sustitúyelo por un criterio medible: «máximo 80 palabras».' },
      { q: 'Quieres un resumen de un informe. ¿Qué es imprescindible incluir?', o: ['El texto (insumo) y para quién/cómo resumirlo', 'Solo la palabra «resumen»', 'Un saludo cordial', 'El nombre del modelo'], a: 0, e: 'Sin insumo, la IA inventa o responde genéricamente.' },
      { q: 'Marca TODOS los errores comunes al escribir prompts.', o: ['Mezclar muchas tareas en una sola instrucción', 'No indicar el formato deseado', 'Dar contexto relevante', 'Suponer que la IA conoce tu empresa'], a: [0, 1, 3], e: 'Dar contexto relevante es lo recomendable.' },
      { q: 'La primera respuesta no es la esperada. Lo más productivo es…', o: ['Identificar qué faltó y ajustar el prompt (iterar)', 'Cambiar de herramienta sin analizar', 'Aceptarla', 'Escribir lo mismo en mayúsculas'], a: 0, e: 'El ciclo evaluar → ajustar → probar es la base del trabajo con prompts.' },
      { q: '¿Cuál prompt es más preciso?', o: ['«Redacta un correo cordial de máx. 100 palabras para un cliente informando un retraso de 3 días en el pedido #4821.»', '«Escribe un correo.»', '«Hazme algo bonito para un cliente.»', '«Correo cliente.»'], a: 0, e: 'Tiene destinatario, hechos, tono y longitud.' },
    ],
  };
  if (typeof module !== 'undefined') module.exports = A;
})(typeof window !== 'undefined' ? window : globalThis);
