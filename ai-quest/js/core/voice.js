/* Guiones de voz de Nova (español latinoamericano neutro).
   Las líneas por nivel (intro / challenge / done) viven en js/levels/*.js.
   Cada clave puede convertirse en assets/audio/<clave>.mp3 (ver docs/AUDIO.md). */
(function (root) {
  const A = (root.AIQ = root.AIQ || {});
  A.voice = {
    welcome: '¡Hola! Soy Nova, tu guía en AI QUEST. Empezarás como explorador y terminarás como arquitecto de inteligencia artificial. ¿Cómo te llamas?',
    diag_intro: 'Seis preguntas rápidas para conocer tu punto de partida. No cuentan como nota.',
    diag_done: '¡Listo! Tu punto de partida quedó guardado. Vamos al mapa.',
    dashboard: 'Este es tu centro de mando. Toca mi imagen cuando quieras una pista.',
    map: 'Cada nivel desbloquea una habilidad. Para avanzar necesitas ochenta por ciento o más.',
    help_default: 'Lee la consigna, intenta una respuesta y usa la retroalimentación. Equivocarse también enseña.',
    correct_1: '¡Exacto!', correct_2: 'Muy bien.', correct_3: '¡Correcto, sigue así!', correct_4: 'Perfecto.',
    wrong_1: 'Casi. Revisa la explicación e inténtalo otra vez.', wrong_2: 'No es esa, pero la pista está en la explicación.', wrong_3: 'Todavía no. Piensa qué falta o qué sobra.',
    motivation_1: 'Cada intento cuenta.', motivation_2: 'Vas construyendo una habilidad real.', motivation_3: 'La IA asiste, tú decides.', motivation_4: 'Buen ritmo. Descansar también es aprender.', motivation_5: 'Mira cuánto has avanzado.',
    level_up: '¡Nivel superado! Se desbloquea el siguiente.', badge: '¡Nueva insignia desbloqueada!',
    warning_data: 'Atención: no compartas datos personales ni confidenciales con herramientas no autorizadas.', warning_error: 'Hubo un error. Revisa e inténtalo de nuevo.', warning_sim: 'Recuerda: esto es una simulación local.',
    surprise: '¡Desafío sorpresa! Una pregunta rápida con puntos extra.', chest: '¡Cofre diario! Abre tu recompensa.', streak: '¡Tu racha sigue creciendo!',
    certificate: '¡Felicitaciones! Ahora eres AI Architect. Tu certificado está listo.',
  };
  if (typeof module !== 'undefined') module.exports = A;
})(typeof window !== 'undefined' ? window : globalThis);
