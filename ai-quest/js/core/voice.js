/* Guiones de voz de Nova (español latinoamericano neutro).
   Las líneas por nivel (intro / challenge / done) viven en js/levels/*.js.
   Cada clave puede convertirse en assets/audio/<clave>.mp3 (ver docs/AUDIO.md). */
(function (root) {
  const A = (root.AIQ = root.AIQ || {});
  A.voice = {
    welcome: '¡Hola! Soy Nova, tu guía en AI QUEST. Vas a empezar como explorador y terminarás como arquitecto de inteligencia artificial. No necesitas conocimientos previos: avanzaremos paso a paso, practicando. Primero cuéntame cómo te llamas.',
    diag_intro: 'Antes de empezar, un diagnóstico rápido de seis preguntas. No cuenta como nota: me ayuda a conocer tu punto de partida. Si no sabes una respuesta, está bien, elige la que te parezca más razonable.',
    diag_done: 'Diagnóstico listo. Tu punto de partida queda guardado y al final de la ruta podremos comparar cuánto avanzaste. Vamos al mapa de niveles.',
    dashboard: 'Este es tu centro de mando. Aquí ves tu progreso, tus misiones y el siguiente paso recomendado. Cuando quieras ayuda, tócame.',
    map: 'Este es el mapa de la ruta. Cada nivel desbloquea una habilidad nueva. Para pasar al siguiente necesitas demostrar dominio: ochenta por ciento o más en la evaluación.',
    help_default: 'Estoy aquí. Lee con calma el objetivo de esta actividad, intenta una respuesta y usa la retroalimentación para ajustar. Equivocarse también enseña.',
    correct_1: '¡Exacto! Buen razonamiento.',
    correct_2: 'Muy bien. Eso demuestra que entendiste la idea.',
    correct_3: '¡Correcto! Sigue así.',
    correct_4: 'Perfecto, esa es la respuesta.',
    wrong_1: 'Casi. Revisa la retroalimentación y vuelve a intentarlo, vas bien encaminado.',
    wrong_2: 'No es esa, pero fíjate en la explicación: ahí está la pista.',
    wrong_3: 'Todavía no. Piensa en qué información le falta o le sobra a la respuesta.',
    motivation_1: 'Cada intento cuenta. Lo importante es entender el porqué, no la velocidad.',
    motivation_2: 'Vas construyendo una habilidad real. Un paso más.',
    motivation_3: 'Recuerda: la inteligencia artificial asiste, tú decides.',
    motivation_4: 'Buen ritmo. Si te cansas, descansar también es parte del aprendizaje.',
    motivation_5: 'Mira cuánto has avanzado desde el primer nivel.',
    level_up: '¡Nivel superado! Has demostrado dominio. Se desbloquea el siguiente nivel.',
    badge: '¡Nueva insignia desbloqueada! Ya es parte de tu colección.',
    warning_data: 'Atención: no compartas datos personales ni información confidencial con herramientas de inteligencia artificial sin autorización.',
    warning_error: 'Hubo un error. Revisa los datos e inténtalo de nuevo.',
    warning_sim: 'Recuerda: esto es una simulación local. No se envía nada a un servicio real.',
    surprise: '¡Desafío sorpresa! Una pregunta rápida con puntos extra. ¿Te animas?',
    streak: '¡Tu racha de aprendizaje sigue creciendo! La constancia vale más que la prisa.',
    certificate: '¡Felicitaciones! Completaste la ruta y ahora eres AI Architect. Tu certificado está listo para descargar.',
    sfx_note: 'Efectos sonoros (clic, acierto, error, desbloqueo, insignia, transición, alerta): se generan en el navegador con Web Audio; no requieren archivos.',
  };
  if (typeof module !== 'undefined') module.exports = A;
})(typeof window !== 'undefined' ? window : globalThis);
