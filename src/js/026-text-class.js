/* ═══════════════ CLASSROOM TEXT (EN/ES) ═══════════════ */
Object.assign(G.en, {
  cls: {
    teacherBtn: "For teachers", joinBtn: "Join a class", joinTitle: "Join a class", joinHint: "Paste the class code your teacher gave you.", joinGo: "Join",
    badCode: "That code doesn't look right. Copy it again, in full.", assignTitle: "Class assignment", yourName: "Your name", start: "Start the assignment",
    leave: "Leave this class", nameNeeded: "Type your name first.", defaultIntro: "Welcome, Governor. Your term starts now. The country is counting on you.",
    customBlurb: "A scenario built by your teacher.",
    handTitle: "Hand in your result", handHint: "Copy this code and send it to your teacher by email, chat or your course page. It contains your decisions, so your teacher can replay your game and check it.",
    copy: "Copy", copied: "Copied", download: "Download file", shareBtn: "Result code", nameFor: "Name on the result",
    desk: { title: "Teacher desk", sub: "Set up a class, build your own scenario and collect results. Everything stays in this browser: nothing is uploaded anywhere.", tabs: ["Assignment", "Scenario builder", "Results"], back: "Back" },
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
  cls: {
    teacherBtn: "Para docentes", joinBtn: "Unirse a una clase", joinTitle: "Unirse a una clase", joinHint: "Pega el código de clase que te dio tu docente.", joinGo: "Unirse",
    badCode: "Ese código no parece correcto. Cópialo de nuevo, completo.", assignTitle: "Tarea de la clase", yourName: "Tu nombre", start: "Empezar la tarea",
    leave: "Salir de esta clase", nameNeeded: "Primero escribe tu nombre.", defaultIntro: "Bienvenido al Banco. Su mandato empieza ahora. El país cuenta con usted.",
    customBlurb: "Un escenario creado por tu docente.",
    handTitle: "Entrega tu resultado", handHint: "Copia este código y envíaselo a tu docente por correo, chat o la página del curso. Contiene tus decisiones, así tu docente puede repetir tu partida y verificarla.",
    copy: "Copiar", copied: "Copiado", download: "Descargar archivo", shareBtn: "Código de resultado", nameFor: "Nombre en el resultado",
    desk: { title: "Escritorio docente", sub: "Arma una clase, crea tu propio escenario y reúne los resultados. Todo queda en este navegador: no se sube nada a ningún lado.", tabs: ["Tarea", "Creador de escenarios", "Resultados"], back: "Volver" },
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
