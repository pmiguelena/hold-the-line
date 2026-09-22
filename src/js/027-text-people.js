/* ═══════════════ PEOPLE, HEARINGS AND MEMOIRS (EN/ES) ═══════════════ */
Object.assign(G.en, {
  standing: {
    title: "Where you stand", role: "Your standing", hudBtn: "People",
    sub: "Everyone you deal with keeps a running opinion of you. It fades towards indifference, but it never resets.",
    who: { harrow: ["Dr. Harrow", "Keynesian advisor"], weiss: ["Dr. Weiss", "Monetarist advisor"], okafor: ["Dr. Okafor", "Rule-based advisor"],
      press: ["The press corps", "Who explains you to the country"], pres: ["The President", "Who can end your term"], board: ["Your board", "Who votes on your proposals"] },
    moods: { ally: "On your side", warm: "Warm", neutral: "Neutral", cool: "Cool", hostile: "Hostile" },
    lines: {
      harrow: { ally: "Follows your reasoning even when she disagrees.", warm: "Thinks you take jobs seriously.", neutral: "Reserves judgement.", cool: "Thinks you are too relaxed about unemployment.", hostile: "Says in private that you have forgotten who pays the price." },
      weiss: { ally: "Calls you the most serious governor in years.", warm: "Approves of your discipline.", neutral: "Watches the money numbers, and you.", cool: "Thinks you drift with the politics.", hostile: "Tells anyone who asks that this will end in inflation." },
      okafor: { ally: "Treats your decisions as the benchmark.", warm: "Finds you predictable, which he means as praise.", neutral: "Notes every deviation from the rule.", cool: "Thinks you improvise too much.", hostile: "Has stopped expecting you to follow any rule at all." },
      press: { ally: "Reports your reasoning before your critics'.", warm: "Gives you the benefit of the doubt.", neutral: "Prints what you say, and what it costs.", cool: "Leads with the awkward question.", hostile: "Treats every decision as a scandal waiting to be found." },
      pres: { ally: "Calls you an asset to the government.", warm: "Is willing to wait for results.", neutral: "Watches the polls and your rate.", cool: "Complains about the Bank in cabinet.", hostile: "Is asking who could replace you." },
      board: { ally: "Backs you before you finish the sentence.", warm: "Trusts your judgement.", neutral: "Votes on the merits.", cool: "Argues with you in the minutes.", hostile: "Is looking for a majority without you." }
    },
    tipAlly: "An advisor who trusts you shares what the staff is hearing before it is published.",
    hint: { press: "A friendly press softens how your surprises land and helps your standing with the public.",
      pres: "A President who trusts you is slower to reach for your job.", board: "A board that trusts you gives your proposals more room before voting them down." }
  },
  hearing: {
    title: "Hearing in parliament", role: "Economic affairs committee", chair: "Committee chair",
    intro: "Governor, thank you for coming. The committee has questions, and the country is watching.",
    of: (k, n) => `Question ${k} of ${n}`, done: "The committee thanks the Governor.",
    qs: {
      h_infl: ["Inflation is not where you promised it would be. Why should anyone believe your next forecast?",
        ["I own the miss. Here is what we got wrong, and what we are doing about it.", "Prices are moving for reasons no central bank controls.", "Forecasts are always uncertain; I would not read much into one number."]],
      h_jobs: ["People are losing their jobs while you hold rates high. How do you justify that to them?",
        ["Bringing inflation down protects those same wages. I will not pretend it is painless.", "Fair point. We will ease sooner than planned.", "Employment is a matter for the government, not the Bank."]],
      h_indep: ["The government says the Bank is working against it. Who do you actually answer to?",
        ["To the mandate parliament gave us, and to this committee. Not to any minister.", "We work with the government. There is no point pretending otherwise.", "I am not going to comment on conversations with the President."]],
      h_debt: ["Every point you add to rates costs the Treasury billions. Do you accept responsibility for that?",
        ["The cost of borrowing is the price of credibility. Cheap money bought with inflation is not cheap.", "We are conscious of it, and it does weigh on our decisions.", "Debt is the government's business; ours is inflation."]],
      h_banks: ["Were you asleep while the banks took these risks?",
        ["We acted with the tools we had, and we are tightening the rules further.", "Supervision failed, and I have asked for changes at the top.", "The banks are supervised within the law. Nothing was hidden from us."]],
      h_record: ["Governor, how would you describe your own record so far?",
        ["Mixed, and I will be judged on the numbers, not on my description of them.", "Strong. Inflation and jobs are in better shape than when I arrived.", "I inherited a difficult situation and that is still the main story."]]
    },
    mood: "Committee mood", moods: ["Hostile", "Sceptical", "Fair", "Satisfied"]
  },
  whisper: { calm: "Between us: the staff see nothing unusual building for next quarter.", costs: "Between us: the staff are hearing about costs rising again. Expect a price shock.",
    boom: "Between us: orders are running hotter than the published data shows. Demand is coming.", weak: "Between us: the staff think demand is about to fall away. Do not be surprised." },
  memoir: {
    title: "From your memoirs", chapter: era => `Chapter: ${era}`,
    open: { good: "They will write that the numbers came back to target. What I remember is the meetings.",
      mixed: "The record is mixed, and I have stopped arguing with it.",
      bad: "It ended badly. The honest account is that I did not see it in time." },
    ally: nm => `${nm} stood with me when it would have been cheaper not to.`,
    foe: nm => `${nm} never forgave me, and was not entirely wrong to.`,
    press: { warm: "The press gave me a fair hearing, which is more than most governors get.", cold: "The papers had made up their minds long before the last meeting." },
    pres: { warm: "The President and I disagreed in private and held the line in public.", cold: "The President wanted a different governor, and eventually said so out loud." },
    close: { fired: "They took the office, the car and the title. The mandate was never mine to keep.", done: "I left the office as I found it: unfinished." }
  }
});

Object.assign(G.es, {
  standing: {
    title: "Cómo te ven", role: "Tu posición", hudBtn: "Personas",
    sub: "Todos con quienes tratas mantienen una opinión sobre ti. Se desvanece hacia la indiferencia, pero nunca se borra.",
    who: { harrow: ["Dra. Harrow", "Asesora keynesiana"], weiss: ["Dr. Weiss", "Asesor monetarista"], okafor: ["Dr. Okafor", "Asesor de reglas"],
      press: ["La prensa", "Quien te explica ante el país"], pres: ["El Presidente", "Quien puede terminar tu mandato"], board: ["Tu directorio", "Quien vota tus propuestas"] },
    moods: { ally: "De tu lado", warm: "Cercano", neutral: "Neutral", cool: "Frío", hostile: "Hostil" },
    lines: {
      harrow: { ally: "Sigue tu razonamiento incluso cuando no coincide.", warm: "Cree que te tomas en serio el empleo.", neutral: "Reserva su juicio.", cool: "Cree que eres demasiado indiferente al desempleo.", hostile: "Dice en privado que olvidaste quién paga el costo." },
      weiss: { ally: "Te llama el banquero central más serio en años.", warm: "Aprueba tu disciplina.", neutral: "Vigila los agregados monetarios, y a ti.", cool: "Cree que te dejas llevar por la política.", hostile: "Le dice a quien pregunte que esto termina en inflación." },
      okafor: { ally: "Toma tus decisiones como referencia.", warm: "Te encuentra predecible, y lo dice como elogio.", neutral: "Anota cada desvío de la regla.", cool: "Cree que improvisas demasiado.", hostile: "Ya no espera que sigas ninguna regla." },
      press: { ally: "Publica tus razones antes que las de tus críticos.", warm: "Te concede el beneficio de la duda.", neutral: "Publica lo que dices y lo que cuesta.", cool: "Abre con la pregunta incómoda.", hostile: "Trata cada decisión como un escándalo por descubrir." },
      pres: { ally: "Te llama un activo del gobierno.", warm: "Está dispuesto a esperar resultados.", neutral: "Mira las encuestas y tu tasa.", cool: "Se queja del Banco en el gabinete.", hostile: "Anda preguntando quién podría reemplazarte." },
      board: { ally: "Te respalda antes de que termines la frase.", warm: "Confía en tu criterio.", neutral: "Vota según el caso.", cool: "Te discute en las actas.", hostile: "Busca una mayoría sin ti." }
    },
    tipAlly: "Un asesor que confía en ti comparte lo que escucha el equipo antes de que se publique.",
    hint: { press: "Una prensa amable suaviza cómo caen tus sorpresas y ayuda a tu imagen pública.",
      pres: "Un Presidente que confía en ti tarda más en buscar tu reemplazo.", board: "Un directorio que confía en ti le da más margen a tus propuestas antes de rechazarlas." }
  },
  hearing: {
    title: "Audiencia en el Congreso", role: "Comisión de asuntos económicos", chair: "Presidencia de la comisión",
    intro: "Gobernador, gracias por venir. La comisión tiene preguntas y el país está mirando.",
    of: (k, n) => `Pregunta ${k} de ${n}`, done: "La comisión agradece al Gobernador.",
    qs: {
      h_infl: ["La inflación no está donde usted prometió. ¿Por qué habría que creerle el próximo pronóstico?",
        ["Asumo el error. Esto es lo que calculamos mal y esto es lo que estamos haciendo.", "Los precios se mueven por razones que ningún banco central controla.", "Los pronósticos siempre son inciertos; no leería tanto en un solo dato."]],
      h_jobs: ["Hay gente perdiendo el empleo mientras usted mantiene tasas altas. ¿Cómo se lo explica?",
        ["Bajar la inflación protege esos mismos salarios. No voy a fingir que no duele.", "Es un punto justo. Vamos a aflojar antes de lo previsto.", "El empleo es asunto del gobierno, no del Banco."]],
      h_indep: ["El gobierno dice que el Banco trabaja en su contra. ¿Ante quién responde usted?",
        ["Ante el mandato que nos dio el Congreso y ante esta comisión. Ante ningún ministro.", "Trabajamos con el gobierno. No tiene sentido fingir lo contrario.", "No voy a comentar mis conversaciones con el Presidente."]],
      h_debt: ["Cada punto de tasa le cuesta miles de millones al Tesoro. ¿Se hace cargo?",
        ["El costo de endeudarse es el precio de la credibilidad. El dinero barato pagado con inflación no es barato.", "Somos conscientes y pesa en nuestras decisiones.", "La deuda es asunto del gobierno; lo nuestro es la inflación."]],
      h_banks: ["¿Estaba usted dormido mientras los bancos tomaban estos riesgos?",
        ["Actuamos con las herramientas que teníamos y vamos a endurecer las reglas.", "La supervisión falló y pedí cambios en su conducción.", "Los bancos se supervisan conforme a la ley. No nos ocultaron nada."]],
      h_record: ["Gobernador, ¿cómo describiría su propia gestión hasta aquí?",
        ["Mixta, y se me juzgará por los números, no por cómo los describo.", "Sólida. La inflación y el empleo están mejor que cuando llegué.", "Heredé una situación difícil y esa sigue siendo la historia principal."]]
    },
    mood: "Ánimo de la comisión", moods: ["Hostil", "Escéptica", "Correcta", "Satisfecha"]
  },
  whisper: { calm: "Entre nosotros: el equipo no ve nada raro armándose para el próximo trimestre.", costs: "Entre nosotros: el equipo escucha que los costos vuelven a subir. Espera un shock de precios.",
    boom: "Entre nosotros: los pedidos van más fuertes de lo que muestran los datos publicados. Viene demanda.", weak: "Entre nosotros: el equipo cree que la demanda está por caer. Que no te sorprenda." },
  memoir: {
    title: "De tus memorias", chapter: era => `Capítulo: ${era}`,
    open: { good: "Escribirán que los números volvieron a la meta. Yo recuerdo las reuniones.",
      mixed: "El balance es mixto y dejé de discutirlo.",
      bad: "Terminó mal. La versión honesta es que no lo vi a tiempo." },
    ally: nm => `${nm} me acompañó cuando habría sido más cómodo no hacerlo.`,
    foe: nm => `${nm} nunca me lo perdonó, y no le faltaba del todo razón.`,
    press: { warm: "La prensa me dio un trato justo, más de lo que reciben casi todos.", cold: "Los diarios ya habían decidido mucho antes de la última reunión." },
    pres: { warm: "Con el Presidente discutimos en privado y sostuvimos la línea en público.", cold: "El Presidente quería otro gobernador y terminó diciéndolo en voz alta." },
    close: { fired: "Se llevaron la oficina, el auto y el título. El mandato nunca fue mío.", done: "Dejé la oficina como la encontré: sin terminar." }
  }
});
