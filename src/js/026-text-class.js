/* ═══════════════ CLASSROOM TEXT (EN/ES) ═══════════════ */
Object.assign(G.en, {
  prof: {
    title: "Before you start", sub: "A few details about you. They stay in this browser, and travel with your result when you play a class assignment.",
    nick: "Nickname", age: "Age", gender: "Gender", edu: "Education", prof: "What you do", profOther: "Tell us what", pick: "Prefer not to say",
    genders: { f: "Woman", m: "Man", nb: "Non-binary", na: "Prefer not to say" },
    edus: { primary: "Primary school", secondary: "Secondary school", vocational: "Vocational training", under: "Undergraduate", grad: "Master's", phd: "Doctorate" },
    profs: { student: "Student", teacher: "Teacher or researcher", econ: "Economist or analyst", public: "Public sector", private: "Private sector", other: "Something else" },
    save: "Save and play", skip: "Skip", edit: "Profile", needNick: "A nickname is enough to start.",
    privacy: "No account, no email, no tracking. If your teacher set up a class spreadsheet, these answers are sent with your final score and how your term ended."
  },
  cls: {
    teacherBtn: "For teachers", joinBtn: "Join a class", joinTitle: "Join a class", joinHint: "Paste the class code your teacher gave you.", joinGo: "Join",
    badCode: "That code doesn't look right. Copy it again, in full.", assignTitle: "Class assignment", yourName: "Your name", start: "Start the assignment",
    leave: "Leave this class", nameNeeded: "Type your name first.", defaultIntro: "Welcome, Governor. Your term starts now. The country is counting on you.",
    customBlurb: "A scenario built by your teacher.",
    handTitle: "Hand in your result", handHint: "Copy this code and send it to your teacher by email, chat or your course page. It contains your decisions, so your teacher can replay your game and check it.",
    copy: "Copy", copied: "Copied", download: "Download file", shareBtn: "Result code", nameFor: "Name on the result",
    desk: { title: "Teacher desk", sub: "Set up a class, build your own scenario and collect results. Everything stays in this browser: nothing is uploaded anywhere.", tabs: ["Assignment", "Scenario builder", "Results", "Data"], back: "Back" },
    data: {
      url: "Collection link (Google Apps Script)", urlHint: "Paste the web app URL your Apps Script gives you. Every class link you create afterwards carries it, so your students' finished games land in your spreadsheet by themselves.",
      test: "Send a test row", sent: "Sent. Check the sheet: a TEST row should appear.", badUrl: "That should start with https://",
      stepsTitle: "How to set it up, once",
      steps: ["Create a Google Sheet.", "In it, open Extensions › Apps Script.", "Delete whatever is there, paste the code below and save.",
        "Press Deploy › New deployment › Web app. Set 'Execute as: me' and 'Who has access: anyone'. Authorise it.",
        "Copy the web app URL it gives you and paste it above, then send a test row."],
      script: "Apps Script code", privacy: "Rows arrive as the game sends them: nickname and the details each player chose to give, the scenario, the score and how the term ended. No names, emails or accounts are involved, and each row carries the player's result code, so you can replay any game in the Results tab."
    },
    assign: {
      className: "Class name", classPh: "Macro 101, group B", level: "Scenario", custom: "My scenario", code: "Shock code", newCode: "New code",
      link: "Link for students", linkHint: "Everyone who opens this link plays exactly the same economy, with the same shocks and settings. Their name goes on the result.",
      classCode: "Class code", classCodeHint: "If links are awkward, students can paste this code with 'Join a class' on the title screen.",
      tryIt: "Try it as a student", noCustom: "Build and save a scenario first, in the Scenario builder tab."
    },
    build: {
      name: "Scenario name", namePh: "Commodity boom", intro: "Opening line from the President", introPh: "Governor, copper prices are at record highs…",
      year: "Starting year", quarter: "Quarter", cred: v => `Starting credibility: ${v}`, surprises: "Surprise events",
      surprisesHint: "On: the game adds a few random events and desk decisions late in the term, different for each shock code. Off: only what you write here, plus small everyday noise.",
      events: "Shock events", addEvent: "Add an event", q: "Quarter", kind: "Type", kinds: { d: "Demand", s: "Supply" }, size: "Size", dur: "Lasts", durN: n => `${n} q`,
      head: "Headline", headPh: "Housing market cools", dek: "Details (optional)", remove: "Remove", dilemmas: "Desk decisions", addDil: "Add a decision",
      guide: "Demand shocks move inflation and output the same way: a spending boom raises both. Supply shocks move them in opposite directions: a cost shock raises inflation and cuts output. A positive size pushes inflation up. Shocks fade over the quarters they last.",
      preview: "Shock path", demand: "Demand", supply: "Supply", save: "Save scenario", saved: "Saved", test: "Test play", use: "Use in an assignment",
      empty: "No events yet: the economy will only get small random shocks."
    },
    res: {
      paste: "Result codes", pastePh: "Paste the codes your students sent you. Any text around them is ignored.", check: "Check results",
      cols: ["Student", "Class", "Scenario", "Score", "Stars", "Rule", "Credibility", "Outcome", "On target", "Followed rule", "Check"],
      report: "Report", csv: "Download CSV", copyTable: "Copy for a spreadsheet", print: "Print",
      summary: (n, avg, done) => `${n} results · average score ${avg} · ${done} completed the term`, bad: "Unreadable code", tampered: "Code altered", ok: "Verified",
      none: "No results yet. Paste codes above and press Check results.", done: "Completed"
    },
    report: { print: "Print report", who: (nm, cl, date) => [nm, cl, date].filter(Boolean).join(" · ") }
  }
});

Object.assign(G.es, {
  prof: {
    title: "Antes de empezar", sub: "Algunos datos sobre ti. Quedan en este navegador y viajan con tu resultado cuando juegas la tarea de una clase.",
    nick: "Apodo", age: "Edad", gender: "Género", edu: "Educación", prof: "A qué te dedicas", profOther: "Cuéntanos cuál", pick: "Prefiero no decirlo",
    genders: { f: "Mujer", m: "Hombre", nb: "No binario", na: "Prefiero no decirlo" },
    edus: { primary: "Primaria", secondary: "Secundaria", vocational: "Formación técnica", under: "Universidad (grado)", grad: "Maestría", phd: "Doctorado" },
    profs: { student: "Estudiante", teacher: "Docente o investigador", econ: "Economista o analista", public: "Sector público", private: "Sector privado", other: "Otra cosa" },
    save: "Guardar y jugar", skip: "Omitir", edit: "Perfil", needNick: "Con un apodo alcanza para empezar.",
    privacy: "Sin cuenta, sin correo, sin rastreo. Si tu docente configuró una planilla de clase, estas respuestas se envían junto con tu puntaje final y cómo terminó tu mandato."
  },
  cls: {
    teacherBtn: "Para docentes", joinBtn: "Unirse a una clase", joinTitle: "Unirse a una clase", joinHint: "Pega el código de clase que te dio tu docente.", joinGo: "Unirse",
    badCode: "Ese código no parece correcto. Cópialo de nuevo, completo.", assignTitle: "Tarea de la clase", yourName: "Tu nombre", start: "Empezar la tarea",
    leave: "Salir de esta clase", nameNeeded: "Primero escribe tu nombre.", defaultIntro: "Bienvenido al Banco. Su mandato empieza ahora. El país cuenta con usted.",
    customBlurb: "Un escenario creado por tu docente.",
    handTitle: "Entrega tu resultado", handHint: "Copia este código y envíaselo a tu docente por correo, chat o la página del curso. Contiene tus decisiones, así tu docente puede repetir tu partida y verificarla.",
    copy: "Copiar", copied: "Copiado", download: "Descargar archivo", shareBtn: "Código de resultado", nameFor: "Nombre en el resultado",
    desk: { title: "Escritorio docente", sub: "Arma una clase, crea tu propio escenario y reúne los resultados. Todo queda en este navegador: no se sube nada a ningún lado.", tabs: ["Tarea", "Creador de escenarios", "Resultados", "Datos"], back: "Volver" },
    data: {
      url: "Enlace de recolección (Google Apps Script)", urlHint: "Pega la URL de la aplicación web que te da Apps Script. Todos los enlaces de clase que crees después la llevan, así las partidas terminadas de tus estudiantes llegan solas a tu planilla.",
      test: "Enviar una fila de prueba", sent: "Enviado. Revisa la planilla: debería aparecer una fila TEST.", badUrl: "Debería empezar con https://",
      stepsTitle: "Cómo configurarlo, una sola vez",
      steps: ["Crea una hoja de cálculo de Google.", "Dentro, abre Extensiones › Apps Script.", "Borra lo que haya, pega el código de abajo y guarda.",
        "Presiona Implementar › Nueva implementación › Aplicación web. Elige 'Ejecutar como: yo' y 'Quién tiene acceso: cualquiera'. Autorízala.",
        "Copia la URL de la aplicación web y pégala arriba; luego envía una fila de prueba."],
      script: "Código de Apps Script", privacy: "Las filas llegan tal como las envía el juego: el apodo y los datos que cada persona quiso dar, el escenario, el puntaje y cómo terminó el mandato. No hay nombres reales, correos ni cuentas, y cada fila incluye el código de resultado, así puedes repetir cualquier partida en la pestaña Resultados."
    },
    assign: {
      className: "Nombre de la clase", classPh: "Macro 101, grupo B", level: "Escenario", custom: "Mi escenario", code: "Código de shocks", newCode: "Nuevo código",
      link: "Enlace para estudiantes", linkHint: "Quien abra este enlace juega exactamente la misma economía, con los mismos shocks y opciones. Su nombre queda en el resultado.",
      classCode: "Código de clase", classCodeHint: "Si los enlaces son incómodos, los estudiantes pueden pegar este código en 'Unirse a una clase', en la pantalla de inicio.",
      tryIt: "Probar como estudiante", noCustom: "Primero crea y guarda un escenario en la pestaña Creador de escenarios."
    },
    build: {
      name: "Nombre del escenario", namePh: "Auge de materias primas", intro: "Frase inicial del Presidente", introPh: "El cobre está en máximos históricos…",
      year: "Año de inicio", quarter: "Trimestre", cred: v => `Credibilidad inicial: ${v}`, surprises: "Eventos sorpresa",
      surprisesHint: "Activado: el juego agrega algunos eventos y decisiones al azar al final del mandato, distintos para cada código. Desactivado: solo lo que escribas aquí, más un pequeño ruido cotidiano.",
      events: "Shocks", addEvent: "Agregar un shock", q: "Trimestre", kind: "Tipo", kinds: { d: "Demanda", s: "Oferta" }, size: "Tamaño", dur: "Dura", durN: n => `${n} t`,
      head: "Titular", headPh: "Se enfría el mercado inmobiliario", dek: "Detalle (opcional)", remove: "Quitar", dilemmas: "Decisiones de escritorio", addDil: "Agregar una decisión",
      guide: "Los shocks de demanda mueven la inflación y la producción en la misma dirección: un auge del gasto sube ambas. Los de oferta las mueven en direcciones opuestas: un shock de costos sube la inflación y baja la producción. Un tamaño positivo empuja la inflación hacia arriba. Los shocks se desvanecen durante los trimestres que duran.",
      preview: "Camino de los shocks", demand: "Demanda", supply: "Oferta", save: "Guardar escenario", saved: "Guardado", test: "Probar", use: "Usar en una tarea",
      empty: "Todavía no hay shocks: la economía solo tendrá pequeños shocks al azar."
    },
    res: {
      paste: "Códigos de resultado", pastePh: "Pega los códigos que te enviaron tus estudiantes. Se ignora cualquier texto alrededor.", check: "Revisar resultados",
      cols: ["Estudiante", "Clase", "Escenario", "Puntaje", "Estrellas", "Regla", "Credibilidad", "Resultado", "En meta", "Siguió la regla", "Control"],
      report: "Informe", csv: "Descargar CSV", copyTable: "Copiar para planilla", print: "Imprimir",
      summary: (n, avg, done) => `${n} resultados · puntaje promedio ${avg} · ${done} completaron el mandato`, bad: "Código ilegible", tampered: "Código alterado", ok: "Verificado",
      none: "Todavía no hay resultados. Pega los códigos arriba y presiona Revisar resultados.", done: "Completado"
    },
    report: { print: "Imprimir informe", who: (nm, cl, date) => [nm, cl, date].filter(Boolean).join(" · ") }
  }
});
