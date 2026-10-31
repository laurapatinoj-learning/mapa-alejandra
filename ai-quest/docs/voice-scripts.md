# Guiones de voz de Nova

_Español latinoamericano neutro · tono cálido, claro y profesional · ritmo medio._

Generado por `tools/build-voice-docs.js`. Cada `id` corresponde al archivo `assets/audio/<id>.mp3` que la app reproduce si activas `AIQ.audio.cfg.useAudioFiles = true`.


## Generales

| id | guion |
|---|---|
| `welcome` | ¡Hola! Soy Nova, tu guía en AI QUEST. Vas a empezar como explorador y terminarás como arquitecto de inteligencia artificial. No necesitas conocimientos previos: avanzaremos paso a paso, practicando. Primero cuéntame cómo te llamas. |
| `diag_intro` | Antes de empezar, un diagnóstico rápido de seis preguntas. No cuenta como nota: me ayuda a conocer tu punto de partida. Si no sabes una respuesta, está bien, elige la que te parezca más razonable. |
| `diag_done` | Diagnóstico listo. Tu punto de partida queda guardado y al final de la ruta podremos comparar cuánto avanzaste. Vamos al mapa de niveles. |
| `dashboard` | Este es tu centro de mando. Aquí ves tu progreso, tus misiones y el siguiente paso recomendado. Cuando quieras ayuda, tócame. |
| `map` | Este es el mapa de la ruta. Cada nivel desbloquea una habilidad nueva. Para pasar al siguiente necesitas demostrar dominio: ochenta por ciento o más en la evaluación. |
| `help_default` | Estoy aquí. Lee con calma el objetivo de esta actividad, intenta una respuesta y usa la retroalimentación para ajustar. Equivocarse también enseña. |

## Retroalimentación: respuesta correcta

| id | guion |
|---|---|
| `correct_1` | ¡Exacto! Buen razonamiento. |
| `correct_2` | Muy bien. Eso demuestra que entendiste la idea. |
| `correct_3` | ¡Correcto! Sigue así. |
| `correct_4` | Perfecto, esa es la respuesta. |

## Retroalimentación: respuesta incorrecta

| id | guion |
|---|---|
| `wrong_1` | Casi. Revisa la retroalimentación y vuelve a intentarlo, vas bien encaminado. |
| `wrong_2` | No es esa, pero fíjate en la explicación: ahí está la pista. |
| `wrong_3` | Todavía no. Piensa en qué información le falta o le sobra a la respuesta. |

## Mensajes motivacionales

| id | guion |
|---|---|
| `motivation_1` | Cada intento cuenta. Lo importante es entender el porqué, no la velocidad. |
| `motivation_2` | Vas construyendo una habilidad real. Un paso más. |
| `motivation_3` | Recuerda: la inteligencia artificial asiste, tú decides. |
| `motivation_4` | Buen ritmo. Si te cansas, descansar también es parte del aprendizaje. |
| `motivation_5` | Mira cuánto has avanzado desde el primer nivel. |

## Generales

| id | guion |
|---|---|
| `level_up` | ¡Nivel superado! Has demostrado dominio. Se desbloquea el siguiente nivel. |
| `badge` | ¡Nueva insignia desbloqueada! Ya es parte de tu colección. |

## Alertas y advertencias

| id | guion |
|---|---|
| `warning_data` | Atención: no compartas datos personales ni información confidencial con herramientas de inteligencia artificial sin autorización. |
| `warning_error` | Hubo un error. Revisa los datos e inténtalo de nuevo. |
| `warning_sim` | Recuerda: esto es una simulación local. No se envía nada a un servicio real. |

## Generales

| id | guion |
|---|---|
| `surprise` | ¡Desafío sorpresa! Una pregunta rápida con puntos extra. ¿Te animas? |
| `streak` | ¡Tu racha de aprendizaje sigue creciendo! La constancia vale más que la prisa. |
| `certificate` | ¡Felicitaciones! Completaste la ruta y ahora eres AI Architect. Tu certificado está listo para descargar. |
| `sfx_note` | Efectos sonoros (clic, acierto, error, desbloqueo, insignia, transición, alerta): se generan en el navegador con Web Audio; no requieren archivos. |

## Nivel 1 · AI Explorer

| id | guion |
|---|---|
| `lvl1_intro` | Nivel uno: AI Explorer. Aquí construyes tu mapa mental de la inteligencia artificial: qué es, qué tipos hay y dónde están sus límites. Practicarás clasificando herramientas y detectando respuestas dudosas. |
| `lvl1_challenge` | Reto del nivel uno: decide qué tareas puede resolver una inteligencia artificial por sí sola, cuáles necesitan que un humano revise y cuáles no deben delegarse. Piensa en el riesgo de equivocarse. |
| `lvl1_done` | Lo lograste, explorador. Ya sabes distinguir tipos de inteligencia artificial y cuándo supervisar. Insignia AI Explorer desbloqueada. |

## Nivel 2 · Prompt Initiation

| id | guion |
|---|---|
| `lvl2_intro` | Nivel dos: Prompt Initiation. Un prompt es la instrucción que le das a la inteligencia artificial. Aprenderás a pasar de preguntas vagas a instrucciones claras, con contexto, objetivo y resultado esperado. |
| `lvl2_challenge` | Reto del nivel dos: tienes cinco prompts ambiguos. Reescríbelos para que cualquier persona entienda qué se pide, para quién y en qué formato. Cada prompt se evalúa con tres criterios. |
| `lvl2_done` | Excelente. Ya no le pides cosas a la inteligencia artificial: le das instrucciones claras. Insignia Prompt Builder desbloqueada. |

## Nivel 3 · Prompt Engineering

| id | guion |
|---|---|
| `lvl3_intro` | Nivel tres: Prompt Engineering. Aprenderás un método de ocho componentes para construir prompts estructurados: rol, contexto, objetivo, tarea, restricciones, formato, ejemplos y criterios de calidad. |
| `lvl3_challenge` | Reto del nivel tres: construye un prompt profesional para un caso laboral real. Debe incluir los componentes del método y los datos concretos del caso. Se evalúa con diez criterios. |
| `lvl3_done` | Muy bien. Ya construyes prompts reproducibles que otros pueden usar. Insignia Prompt Engineer desbloqueada. |

## Nivel 4 · Advanced Prompting

| id | guion |
|---|---|
| `lvl4_intro` | Nivel cuatro: Advanced Prompting. Verás técnicas para tareas complejas: descomponer, encadenar prompts, pedir salida en JSON, usar razonamiento con acciones, poner guardrails y gestionar la ventana de contexto. |
| `lvl4_challenge` | Reto del nivel cuatro: diseña una secuencia de prompts que automatice un proceso de varios pasos. Cuida el orden, la validación y la revisión humana antes de enviar nada. |
| `lvl4_done` | Impecable. Ya diseñas secuencias de prompts con validación y control. Insignia Advanced Prompt Master desbloqueada. |

## Nivel 5 · AI Multimodal

| id | guion |
|---|---|
| `lvl5_intro` | Nivel cinco: IA multimodal. Verás cómo la inteligencia artificial genera y analiza imágenes, audio, video y documentos, y cómo se combinan. Cada modalidad necesita instrucciones distintas y cuidados propios. |
| `lvl5_challenge` | Reto del nivel cinco: construye una solución que combine texto con imagen, o texto con audio. Describe el flujo, escribe las instrucciones para cada modalidad y no olvides la revisión humana y los derechos. |
| `lvl5_done` | Gran trabajo. Ya combinas modalidades con criterio. Insignia Multimodal Creator desbloqueada. |

## Nivel 6 · AI Workflows

| id | guion |
|---|---|
| `lvl6_intro` | Nivel seis: AI Workflows. Un workflow conecta varios pasos: un disparador, datos, inteligencia artificial, condiciones y acciones. Aprenderás cuándo automatizar y dónde poner validación humana. |
| `lvl6_challenge` | Reto del nivel seis: diseña el flujo de incorporación de nuevos colaboradores. Empieza con un disparador, usa la inteligencia artificial donde aporta, decide con condiciones y pide aprobación humana antes de las acciones importantes. |
| `lvl6_done` | Muy bien. Ya diseñas flujos con control y trazabilidad. Insignia Workflow Designer desbloqueada. |

## Nivel 7 · AI Agents

| id | guion |
|---|---|
| `lvl7_intro` | Nivel siete: agentes de inteligencia artificial. Un agente no solo responde: percibe, planifica y actúa con herramientas para lograr un objetivo. Aprenderás a configurarlo y, sobre todo, a ponerle límites. |
| `lvl7_challenge` | Reto del nivel siete: diseña un agente para tramitar solicitudes de capacitación. Define su objetivo, las herramientas que necesita, su memoria, su autonomía y los límites que impiden que haga daño. |
| `lvl7_done` | Excelente criterio. Diseñas agentes útiles y controlados. Insignia AI Agent Builder desbloqueada. |

## Nivel 8 · API & AI Integration

| id | guion |
|---|---|
| `lvl8_intro` | Nivel ocho: APIs e integración. Una API es el contrato que permite que dos programas se comuniquen. Aprenderás sobre endpoints, métodos, JSON, claves de acceso y códigos de respuesta, y practicarás con un simulador local. |
| `lvl8_challenge` | Reto del nivel ocho: diseña una solicitud conceptual a un modelo de inteligencia artificial. Define método, endpoint, encabezados y un cuerpo JSON válido, cuidando que la clave nunca quede escrita en el código. |
| `lvl8_done` | Muy bien. Ya lees y diseñas solicitudes a una API. Es la base para entender MCP. Insignia API Integrator desbloqueada. |

## Nivel 9 · MCP — Model Context Protocol

| id | guion |
|---|---|
| `lvl9_intro` | Nivel nueve: Model Context Protocol, o MCP. Es un protocolo abierto para conectar aplicaciones de inteligencia artificial con herramientas y fuentes de datos externas. No es un modelo ni una técnica de prompts. Antes de empezar, comprobaremos que dominas APIs, JSON, herramientas y agentes. |
| `lvl9_challenge` | Reto del nivel nueve: diseña una arquitectura MCP para un asistente de capacitación. Decide qué es un recurso, qué es un prompt y qué es una herramienta, cómo se conecta, cómo se autoriza y qué salvaguardas pones antes de ejecutar cualquier acción. |
| `lvl9_done` | Impresionante. Ya entiendes y diseñas arquitecturas con MCP, con seguridad desde el principio. Insignia MCP Specialist desbloqueada. Solo falta el proyecto integrador. |

## Nivel 10 · AI Architect

| id | guion |
|---|---|
| `lvl10_intro` | Nivel diez: AI Architect. Es el proyecto integrador. Recibirás un caso empresarial y tendrás que decidir si resolverlo con un prompt, un workflow, un agente o MCP, y diseñar la solución con seguridad y criterios de calidad. A veces, la mejor decisión es no complicar las cosas. |
| `lvl10_challenge` | Proyecto final: elige uno de los tres casos. Identifica el problema, decide el enfoque, define herramientas, arquitectura, seguridad y calidad, y presenta tu solución. Se evalúa con la rúbrica de cinco criterios. |
| `lvl10_done` | Lo lograste. Has pasado de explorador a arquitecto de inteligencia artificial. Piensas, diseñas, experimentas, evalúas y construyes con criterio. Tu certificado está listo. |

---
Total: **57 líneas** · 7894 caracteres.
