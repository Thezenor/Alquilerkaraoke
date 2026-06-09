// Contenido SEO inicial de los tipos de evento (generado por el agente seo-architect).
// Editable después desde /admin/eventos. Idempotente vía seed-event-types.ts.

export type EventTypeSeed = {
  slug: string;
  name: string;
  shortDescription: string;
  intro: string;
  description: string;
  features: string[];
  faq: { q: string; a: string }[];
  metaTitle: string;
  metaDescription: string;
};

export const EVENT_TYPES: EventTypeSeed[] = [
  {
    slug: "bodas",
    name: "Bodas",
    shortDescription: "Karaoke profesional para bodas: música, micros y emoción tras el banquete.",
    intro:
      "Karaoke para bodas que convierte el post-banquete en el momento que todos recordarán: voces, risas y vuestra canción cantada por los invitados.",
    description:
      "## El karaoke que tu boda merece\n\nUna boda se recuerda por sus emociones, y pocas cosas unen tanto como ver a la familia y los amigos subir a cantar. Nuestro **karaoke para bodas** no es montar un aparato y marcharse: diseñamos una experiencia profesional que encaja con el ritmo de tu día, desde el cóctel hasta la barra libre. Llegamos antes, montamos equipo de sonido, pantallas, microfonía e iluminación, y lo dejamos todo perfecto para que el primer tema suene impecable.\n\nTrabajamos con cobertura en toda España, así que tanto si te casas en una finca de costa como en un cortijo de interior, llevamos el montaje completo donde haga falta. Puedes contratarlo **con o sin técnico**: con técnico presente, alguien controla el sonido, anima y encadena las canciones para que la pista no decaiga; sin técnico, te dejamos todo listo y explicado.\n\n## Para cada momento del día\n\nEl **alquiler de karaoke para bodas** brilla especialmente después del banquete, cuando los invitados ya están en confianza y buscan fiesta. Disponemos de miles de canciones en varios idiomas, desde los clásicos que canta toda la familia hasta lo más actual que piden los amigos. Reservamos vuestra canción para un dueto sorpresa de los novios, montamos un duelo entre las dos familias o dejamos barra libre de temas para quien se anime.\n\n## Animación que se adapta a vosotros\n\nNuestra **animación para bodas** combina la libertad del karaoke con un acompañamiento discreto y profesional. Coordinamos horarios con tu catering y tu sala, cuidamos el volumen según el momento y nos integramos con el resto de proveedores. El objetivo es simple: que cantar sea fácil, que nadie se quede con las ganas y que la pista no se vacíe hasta el final.",
    features: [
      "Montaje completo: sonido, pantallas, microfonía e iluminación de pista",
      "Opción con técnico que anima y encadena canciones, o servicio sin técnico",
      "Miles de canciones en varios idiomas para todas las generaciones de invitados",
      "Vuestra canción reservada para un dueto sorpresa de los novios",
      "Coordinación de horarios con sala y catering para encajar el post-banquete",
      "Cobertura en toda España, incluidas fincas y ubicaciones de difícil acceso",
    ],
    faq: [
      { q: "¿Cuál es el mejor momento de la boda para el karaoke?", a: "Justo después del banquete, al empezar la barra libre, cuando los invitados están animados y con ganas de fiesta. Coordinamos el horario con tu sala." },
      { q: "¿Hay barra libre de canciones para los invitados?", a: "Sí, los invitados pueden pedir los temas que quieran de un repertorio de miles de canciones, y podemos gestionar una cola para que nadie se quede sin cantar." },
      { q: "¿Podemos preparar una canción sorpresa de los novios?", a: "Por supuesto. Reservamos vuestra canción y la dejamos lista para el momento que elijáis, con la letra en pantalla para el dueto." },
      { q: "¿Trabajáis en fincas y ubicaciones rurales?", a: "Sí, llevamos el montaje completo a toda España, incluidas fincas, masías y espacios al aire libre, adaptando el equipo a cada ubicación." },
    ],
    metaTitle: "Karaoke para Bodas | Alquiler Karaoke",
    metaDescription: "Karaoke profesional para bodas en toda España: montaje completo, miles de canciones y técnico opcional. Pide presupuesto sin compromiso.",
  },
  {
    slug: "empresas",
    name: "Eventos de empresa",
    shortDescription: "Karaoke para eventos de empresa y team building, con factura y montaje pro.",
    intro:
      "Karaoke para empresas que rompe el hielo, refuerza el equipo y convierte una reunión en una experiencia que la plantilla recuerda.",
    description:
      "## Karaoke corporativo que une equipos\n\nUn buen evento de empresa no se mide por el catering, sino por lo que la gente cuenta el lunes siguiente. Nuestro **karaoke para empresas** está pensado para eso: romper jerarquías, generar conversación y dejar un recuerdo compartido. Montamos una experiencia profesional con sonido, pantallas, microfonía e iluminación, adaptada al espacio, ya sea una sala de hotel, una azotea, una nave o vuestras propias oficinas.\n\nTrabajamos con cobertura nacional, así que organizamos el evento allí donde esté vuestra sede o el lugar de la celebración. Emitimos **factura** con todos los datos fiscales y firmamos lo necesario para vuestro departamento de compras, sin complicaciones administrativas.\n\n## Team building con micrófono\n\nEl **alquiler de karaoke para empresas** funciona de maravilla como dinámica de team building: retos por equipos, duelos entre departamentos o un ranking de actuaciones generan complicidad sin forzar. Lo combinamos con vuestra cena de empresa, una convención, el cierre de un trimestre o un lanzamiento de producto. Con técnico presente, alguien dinamiza la actividad y mantiene el ritmo; también lo ofrecemos sin técnico si preferís autogestionaros.\n\n## Imagen de marca cuidada\n\nNuestra **animación para eventos de empresa** cuida la imagen: equipo discreto y profesional, volumen controlado según el momento y posibilidad de personalizar pantallas o ambientación con vuestra marca. Disponemos de miles de canciones en varios idiomas, ideal para plantillas internacionales. Coordinamos con vuestro responsable de eventos para que la logística encaje y vosotros solo tengáis que disfrutar.",
    features: [
      "Factura con datos fiscales completos para el departamento de compras",
      "Dinámicas de team building: retos por equipos y duelos entre departamentos",
      "Montaje profesional adaptado a salas, azoteas, naves u oficinas",
      "Técnico opcional que dinamiza la actividad y controla el sonido",
      "Repertorio multilingüe ideal para plantillas internacionales",
      "Posibilidad de personalizar pantallas y ambientación con vuestra marca",
    ],
    faq: [
      { q: "¿Emitís factura para la empresa?", a: "Sí, emitimos factura con todos los datos fiscales y firmamos la documentación que necesite vuestro departamento de compras o administración." },
      { q: "¿Sirve el karaoke como actividad de team building?", a: "Totalmente. Proponemos retos por equipos, duelos entre departamentos y rankings que fomentan la participación y el compañerismo sin forzar a nadie." },
      { q: "¿Podéis montar en nuestras propias oficinas?", a: "Sí, adaptamos el montaje al espacio disponible, ya sean oficinas, una sala de hotel, una azotea o una nave, en cualquier punto de España." },
      { q: "¿Tenéis canciones en otros idiomas para plantillas internacionales?", a: "Disponemos de miles de canciones en varios idiomas, perfecto para equipos multiculturales donde cada quien quiere cantar en su lengua." },
    ],
    metaTitle: "Karaoke para Empresas | Alquiler Karaoke",
    metaDescription: "Karaoke para eventos de empresa y team building en toda España: montaje pro, factura y técnico opcional. Solicita tu presupuesto hoy.",
  },
  {
    slug: "cumpleanos",
    name: "Cumpleaños",
    shortDescription: "Karaoke para cumpleaños en casa o local: monta la fiesta sin complicarte.",
    intro:
      "Karaoke para cumpleaños que convierte cualquier salón, terraza o local en una fiesta donde todos quieren coger el micrófono.",
    description:
      "## El cumpleaños que se canta\n\nApagar las velas está bien, pero lo que de verdad enciende un cumpleaños es la música. Nuestro **karaoke para cumpleaños** transforma tu casa, tu terraza o un local alquilado en una pista donde nadie se queda sentado. Llevamos sonido, pantallas, microfonía e iluminación, montamos todo y lo dejamos listo para que solo tengas que invitar y disfrutar. Tú pones la tarta; nosotros, la banda sonora.\n\nDamos servicio en toda España y nos adaptamos al tamaño de la celebración: desde una reunión íntima en el salón hasta una fiesta grande en un local. Puedes contratar el **alquiler de karaoke para cumpleaños con o sin técnico**: si quieres olvidarte de cables y peticiones, el técnico se encarga de todo y anima al grupo.\n\n## Para todas las edades\n\nUn cumpleaños suele juntar a gente muy distinta, y por eso contamos con miles de canciones en varios idiomas: los éxitos que canta el homenajeado, los clásicos que arrancan a los mayores y lo más viral para los más jóvenes. Preparamos la canción favorita del cumpleañero para un momento especial y montamos retos divertidos para que la fiesta no decaiga.\n\n## Animación sin complicaciones\n\nNuestra **animación para cumpleaños** está pensada para que organizar sea fácil: nos coordinamos contigo por adelantado, llegamos con margen para montar y recogemos al terminar. El equipo es sencillo de usar, así que aunque elijas el servicio sin técnico, cualquiera puede manejarlo. El resultado: una fiesta con energía de principio a fin y un cumpleaños que se recuerda.",
    features: [
      "Montaje listo para usar en casa, terraza o local alquilado",
      "Servicio con o sin técnico, equipo fácil de manejar por cualquiera",
      "Miles de canciones en varios idiomas para todas las edades de invitados",
      "Canción favorita del cumpleañero preparada para un momento especial",
      "Retos y duelos para mantener la energía durante toda la fiesta",
      "Cobertura en toda España y adaptación al tamaño de la celebración",
    ],
    faq: [
      { q: "¿Podéis montar el karaoke en mi casa o en una terraza?", a: "Sí, adaptamos el equipo al espacio disponible, ya sea un salón, una terraza o un local alquilado, en cualquier punto de España." },
      { q: "¿Hace falta contratar técnico para un cumpleaños en casa?", a: "No es imprescindible: el equipo es fácil de usar y lo dejamos listo. El técnico es opcional si prefieres olvidarte de todo y que alguien anime." },
      { q: "¿Hay canciones para todas las edades?", a: "Sí, contamos con miles de canciones en varios idiomas, desde clásicos para los mayores hasta lo más actual y viral para los jóvenes." },
      { q: "¿Cuánto tiempo antes necesitáis para montar?", a: "Llegamos siempre con margen para montar y probar el equipo antes de la hora de inicio, y recogemos una vez terminada la fiesta." },
    ],
    metaTitle: "Karaoke para Cumpleaños | Alquiler Karaoke",
    metaDescription: "Karaoke para cumpleaños en casa o local en toda España: montaje listo, miles de canciones y técnico opcional. Pide presupuesto ya.",
  },
  {
    slug: "fiestas-infantiles",
    name: "Fiestas infantiles",
    shortDescription: "Karaoke infantil seguro y divertido, con canciones para niños y montaje pro.",
    intro:
      "Karaoke para fiestas infantiles diseñado para los más pequeños: canciones que conocen, equipo seguro y mucha diversión sin pantallas a su aire.",
    description:
      "## Diversión a su medida\n\nLos niños cantan sin vergüenza y se lo pasan en grande con un micrófono en la mano. Nuestro **karaoke para fiestas infantiles** está pensado para ellos: repertorio con las canciones de sus películas, series y artistas favoritos, dibujos y letras claras en pantalla, y un ritmo de actividad que los mantiene participando. Montamos sonido, pantalla e iluminación adaptados a un público pequeño, con volumen cuidado para no saturar.\n\nLlevamos el servicio a toda España y nos adaptamos al espacio: el salón de casa, un parque, el cole, un local de cumpleaños o un jardín. El **alquiler de karaoke para fiestas infantiles** puede contratarse con técnico-animador, que guía los juegos y dinamiza al grupo, o sin técnico si los adultos prefieren llevar el ritmo.\n\n## Seguridad lo primero\n\nLa seguridad es prioritaria cuando hay niños cerca. Colocamos el equipo de forma estable, protegemos y recogemos los cables, fijamos los soportes y situamos los altavoces fuera del alcance directo. Nuestros micrófonos son resistentes y fáciles de sujetar para manos pequeñas, y mantenemos un nivel de sonido seguro para sus oídos.\n\n## Animación que engancha\n\nNuestra **animación para fiestas infantiles** combina karaoke con juegos: duelos de canciones, coreografías sencillas, premios simbólicos y turnos para que todos canten. El contenido está filtrado para ser apropiado a su edad, sin sorpresas. El objetivo es que cada niño participe, se ría y se vaya a casa pidiendo repetir, mientras los padres disfrutan de una fiesta tranquila y bien organizada.",
    features: [
      "Repertorio infantil con canciones de películas, series y artistas que conocen",
      "Equipo colocado de forma segura: cables recogidos y soportes fijados",
      "Volumen controlado y micrófonos resistentes para manos pequeñas",
      "Técnico-animador opcional que guía juegos, duelos y coreografías",
      "Contenido filtrado y apropiado a la edad, sin sorpresas",
      "Montaje adaptado a salón, jardín, cole o local, en toda España",
    ],
    faq: [
      { q: "¿El karaoke es seguro para niños pequeños?", a: "Sí, fijamos los soportes, recogemos los cables, situamos los altavoces fuera de su alcance y mantenemos un nivel de sonido seguro para sus oídos." },
      { q: "¿Tenéis canciones específicas para niños?", a: "Contamos con un repertorio infantil con temas de sus películas, series y artistas favoritos, con letras claras y contenido apropiado a su edad." },
      { q: "¿Incluís animación para entretener a los niños?", a: "Sí, el técnico-animador opcional guía duelos de canciones, coreografías sencillas y turnos para que todos los niños participen y se diviertan." },
      { q: "¿Podéis montarlo en un jardín o en el colegio?", a: "Sí, adaptamos el equipo a salones, jardines, colegios o locales de cumpleaños, llevando el montaje a cualquier punto de España." },
    ],
    metaTitle: "Karaoke Infantil para Fiestas | Alquiler Karaoke",
    metaDescription: "Karaoke para fiestas infantiles en toda España: canciones para niños, equipo seguro y animación opcional. Pide presupuesto sin compromiso.",
  },
  {
    slug: "despedidas",
    name: "Despedidas de soltero/a",
    shortDescription: "Karaoke para despedidas de soltero/a: la fiesta que el grupo recordará.",
    intro:
      "Karaoke para despedidas de soltero y soltera que convierte la última noche de soltería en el momentazo que el grupo recordará siempre.",
    description:
      "## La despedida más cantada\n\nUna despedida de soltero o soltera se trata de risas, complicidad y un buen momentazo en grupo. Nuestro **karaoke para despedidas** es justo eso: el plan perfecto para reírse de la futura novia o novio cantando sus temas más vergonzosos, retar al grupo y crear el recuerdo que comentaréis durante años. Montamos sonido, pantallas, microfonía e iluminación de fiesta, listos para que la noche arranque con energía.\n\nDamos servicio en toda España, así que tanto si la despedida es en un apartamento, una casa rural, un local privado o un chalet, llevamos el montaje completo. El **alquiler de karaoke para despedidas** se puede contratar **con o sin técnico**: con técnico, alguien anima, encadena canciones y dirige los retos para que el grupo no pare; sin técnico, lo dejamos todo listo y a vuestro aire.\n\n## Retos y momentos virales\n\nLo divertido de una despedida está en los retos, y el karaoke da mucho juego. Preparamos la canción dedicatoria al protagonista, montamos duelos por equipos, penalizaciones cantadas y un ranking de actuaciones. Con miles de canciones en varios idiomas, hay temas para todos los gustos del grupo, desde los himnos de fiesta hasta las baladas más dramáticas para el momento emotivo.\n\n## Una experiencia, no un trasto\n\nNuestra **animación para despedidas** está pensada para grupos que buscan algo más que una cena. Nos coordinamos contigo, llegamos con margen, montamos rápido y nos adaptamos al ritmo de la noche. El resultado es una experiencia profesional que convierte cualquier espacio en una pista de baile y karaoke, sin que tengáis que preocuparos de nada.",
    features: [
      "Montaje de fiesta: sonido potente, pantallas e iluminación de ambiente",
      "Canción dedicatoria al protagonista preparada para el momentazo",
      "Retos por equipos, penalizaciones cantadas y ranking de actuaciones",
      "Servicio con o sin técnico que anima y dirige los juegos",
      "Miles de canciones en varios idiomas para todos los gustos del grupo",
      "Montaje en apartamentos, casas rurales o locales, en toda España",
    ],
    faq: [
      { q: "¿Podéis preparar una canción dedicada al protagonista?", a: "Sí, dejamos lista la canción dedicatoria al soltero o soltera para el momento que elijáis, con la letra en pantalla para todo el grupo." },
      { q: "¿Montáis en casas rurales o apartamentos turísticos?", a: "Sí, llevamos el montaje completo a apartamentos, casas rurales, chalets y locales privados en cualquier punto de España." },
      { q: "¿Proponéis retos y juegos para el grupo?", a: "Por supuesto: duelos por equipos, penalizaciones cantadas y un ranking de actuaciones. Con técnico, alguien dirige los retos y anima la noche." },
      { q: "¿Hace falta técnico para una despedida?", a: "No es obligatorio. Con técnico la noche fluye y nadie se ocupa de nada; sin técnico dejamos el equipo listo y explicado para llevarlo a vuestro aire." },
    ],
    metaTitle: "Karaoke para Despedidas | Alquiler Karaoke",
    metaDescription: "Karaoke para despedidas de soltero y soltera en toda España: montaje de fiesta, retos y técnico opcional. Reserva tu presupuesto ya.",
  },
  {
    slug: "comuniones",
    name: "Comuniones",
    shortDescription: "Karaoke para comuniones: diversión para niños y mayores tras la celebración.",
    intro:
      "Karaoke para comuniones que entretiene a los niños y anima a los mayores, convirtiendo la sobremesa en la mejor parte del día.",
    description:
      "## La comunión que no se queda en la mesa\n\nEn una comunión, después de la ceremonia y la comida, llega ese rato en que los niños tienen energía de sobra y los mayores buscan que la celebración siga animada. Nuestro **karaoke para comuniones** es la solución perfecta: los pequeños cantan sus temas favoritos mientras los adultos disfrutan de un ambiente alegre y familiar. Montamos sonido, pantallas, microfonía e iluminación, y lo dejamos todo preparado para que la fiesta arranque sin esperas.\n\nDamos servicio en toda España y nos adaptamos al lugar de la celebración: un salón de banquetes, un restaurante, un jardín o la casa familiar. El **alquiler de karaoke para comuniones** puede contratarse **con o sin técnico**: el técnico-animador es ideal para mantener a los niños participando y guiar la actividad, aunque también lo dejamos todo listo si preferís el servicio sin técnico.\n\n## Para los niños y para toda la familia\n\nLa gracia de una comunión es que junta a varias generaciones. Por eso contamos con miles de canciones en varios idiomas: los temas infantiles y de moda que piden los niños, y los clásicos que animan a abuelos, padres y tíos. Preparamos la canción favorita del protagonista para un momento especial y proponemos turnos y duelos sencillos para que todos participen.\n\n## Animación familiar y cuidada\n\nNuestra **animación para comuniones** cuida tanto la diversión como el ambiente. Controlamos el volumen para que sea agradable durante la sobremesa, filtramos el contenido infantil y coordinamos los horarios con el restaurante o la sala. El objetivo es que los niños se desfoguen, los mayores se animen y la familia se lleve un recuerdo redondo del día.",
    features: [
      "Repertorio mixto: canciones infantiles y clásicos para toda la familia",
      "Técnico-animador opcional que mantiene a los niños participando",
      "Canción favorita del protagonista preparada para un momento especial",
      "Volumen cuidado y contenido infantil filtrado para la sobremesa",
      "Coordinación de horarios con el restaurante o salón de banquetes",
      "Montaje en salones, jardines o casas familiares, en toda España",
    ],
    faq: [
      { q: "¿El karaoke entretiene a los niños durante la comunión?", a: "Sí, es ideal para el rato de sobremesa: los niños cantan sus temas favoritos y, con el técnico-animador opcional, alguien los mantiene participando." },
      { q: "¿Hay canciones para los niños y también para los mayores?", a: "Contamos con miles de canciones en varios idiomas, desde los temas infantiles que piden los niños hasta los clásicos que animan a los adultos." },
      { q: "¿Podéis montar en el restaurante donde celebramos?", a: "Sí, nos coordinamos con el salón o restaurante para encajar horarios y montar el equipo en cualquier punto de España." },
      { q: "¿Cuál es el mejor momento para el karaoke en una comunión?", a: "Tras la comida, en la sobremesa, cuando los niños tienen energía y los mayores quieren mantener la celebración animada." },
    ],
    metaTitle: "Karaoke para Comuniones | Alquiler Karaoke",
    metaDescription: "Karaoke para comuniones en toda España: diversión para niños y mayores, montaje pro y técnico opcional. Pide tu presupuesto sin compromiso.",
  },
  {
    slug: "fiestas-navidad",
    name: "Fiestas de Navidad y empresa",
    shortDescription: "Karaoke para fiestas de Navidad y cenas de empresa: el cierre perfecto del año.",
    intro:
      "Karaoke para fiestas de Navidad y cenas de empresa que pone el broche al año: villancicos, éxitos y mucha fiesta para despedir el ejercicio.",
    description:
      "## El mejor final para el año\n\nLas fiestas de Navidad y las cenas de empresa de diciembre piden algo más que un brindis. Nuestro **karaoke para fiestas de Navidad** convierte la celebración de fin de año en una velada memorable: villancicos para arrancar con espíritu navideño y, después, los grandes éxitos para que la pista no pare. Montamos sonido, pantallas, microfonía e iluminación con ambiente festivo, listos para que la fiesta empiece con energía.\n\nTrabajamos en toda España, así que organizamos tu evento navideño donde lo celebréis: un restaurante, un hotel, una sala privada o las oficinas. Si es una cena de empresa, emitimos **factura** con los datos fiscales que necesite vuestro departamento de administración. Puedes contratarlo **con o sin técnico**: con técnico, alguien anima, encadena temas y dinamiza al grupo en el momento más concurrido del año.\n\n## Navidad y empresa en un mismo plan\n\nEn diciembre se mezclan las celebraciones familiares y las corporativas, y el **alquiler de karaoke para fiestas de Navidad** funciona en ambas. Para la cena de empresa, proponemos duelos entre departamentos y un ranking de actuaciones que rompe el hielo; para la fiesta en familia o con amigos, dejamos barra libre de canciones. Contamos con miles de temas en varios idiomas, incluidos los clásicos navideños que todos saben cantar.\n\n## Una experiencia que se recuerda\n\nNuestra **animación para fiestas de Navidad** está pensada para fechas de mucha demanda: nos coordinamos con antelación, llegamos con margen y nos adaptamos al ambiente. Por ser temporada alta, recomendamos reservar con tiempo. El resultado es un cierre de año profesional, divertido y que tu equipo o tus invitados recordarán hasta la próxima Navidad.",
    features: [
      "Repertorio festivo: villancicos para empezar y grandes éxitos para la fiesta",
      "Factura con datos fiscales para cenas de empresa",
      "Duelos entre departamentos y ranking de actuaciones para romper el hielo",
      "Servicio con o sin técnico que dinamiza el momento más concurrido del año",
      "Miles de canciones en varios idiomas, incluidos los clásicos navideños",
      "Montaje en restaurantes, hoteles, salas u oficinas, en toda España",
    ],
    faq: [
      { q: "¿Tenéis villancicos y música navideña en el repertorio?", a: "Sí, contamos con los clásicos navideños que todos saben cantar, además de miles de éxitos en varios idiomas para que la fiesta no pare." },
      { q: "¿Emitís factura para la cena de empresa de Navidad?", a: "Sí, emitimos factura con todos los datos fiscales que necesite vuestro departamento de administración o compras." },
      { q: "¿Con cuánta antelación conviene reservar en diciembre?", a: "Diciembre es temporada alta de fiestas, por lo que recomendamos reservar con la mayor antelación posible para asegurar la fecha." },
      { q: "¿Sirve tanto para fiesta familiar como para cena de empresa?", a: "Sí, adaptamos la experiencia: barra libre de canciones para celebraciones familiares y duelos por departamentos para las cenas corporativas." },
    ],
    metaTitle: "Karaoke Fiestas de Navidad | Alquiler Karaoke",
    metaDescription: "Karaoke para fiestas de Navidad y cenas de empresa en toda España: villancicos, éxitos, factura y técnico opcional. Reserva con antelación.",
  },
  {
    slug: "graduaciones",
    name: "Graduaciones",
    shortDescription: "Karaoke para graduaciones: celebra el fin de etapa con la clase al completo.",
    intro:
      "Karaoke para graduaciones que pone banda sonora al fin de una etapa: la promoción al completo cantando los himnos de su generación.",
    description:
      "## El fin de etapa que se canta a coro\n\nUna graduación es el momento de mirar atrás, celebrar lo conseguido y despedirse de los compañeros. Nuestro **karaoke para graduaciones** convierte esa noche en una experiencia colectiva: la promoción entera cantando los temas que marcaron su etapa, brindando y creando el último recuerdo juntos. Montamos sonido potente, pantallas, microfonía e iluminación de fiesta para que el ambiente esté a la altura de la ocasión.\n\nDamos servicio en toda España, así que llevamos el montaje completo allá donde se celebre: el salón de actos del centro, un hotel, una sala de eventos o un local privado. El **alquiler de karaoke para graduaciones** se contrata **con o sin técnico**: con técnico, alguien anima a la clase, encadena las canciones y dinamiza los momentos de grupo; sin técnico, lo dejamos todo listo para que la comisión de la promoción lo gestione.\n\n## La banda sonora de una generación\n\nCada promoción tiene sus himnos, y con miles de canciones en varios idiomas no falta ninguno: los éxitos del momento, los temas que sonaron durante el curso y los clásicos que une a toda la clase. Preparamos un dúo o un coro general para el momento más emotivo, montamos duelos entre grupos y dejamos barra libre de canciones para que nadie se quede sin su minuto de gloria.\n\n## Animación para grupos grandes\n\nNuestra **animación para graduaciones** está preparada para promociones numerosas: gestionamos los turnos para que todos canten, mantenemos el ritmo alto y nos adaptamos al programa del evento (entrega de orlas, discursos, fiesta). Nos coordinamos con la organización para que el karaoke encaje en el momento justo y la celebración termine por todo lo alto.",
    features: [
      "Montaje de fiesta con sonido potente para grupos grandes",
      "Repertorio con los himnos y éxitos de cada generación",
      "Gestión de turnos para que toda la promoción cante",
      "Coro o dúo general preparado para el momento más emotivo",
      "Servicio con o sin técnico que anima y dinamiza a la clase",
      "Coordinación con el programa del evento, en toda España",
    ],
    faq: [
      { q: "¿Funciona el karaoke con una promoción muy numerosa?", a: "Sí, está preparado para grupos grandes: gestionamos los turnos para que todos canten y mantenemos el ritmo alto durante toda la fiesta." },
      { q: "¿Tenéis los éxitos del momento y los temas del curso?", a: "Contamos con miles de canciones en varios idiomas, incluidos los éxitos actuales y los temas que han marcado la etapa de la promoción." },
      { q: "¿Podéis encajar el karaoke entre la entrega de orlas y la fiesta?", a: "Sí, nos coordinamos con la organización para integrar el karaoke en el momento del programa que mejor encaje, tras los discursos y las orlas." },
      { q: "¿Montáis en el salón de actos del centro?", a: "Sí, llevamos el montaje completo a salones de actos, hoteles, salas de eventos o locales privados en cualquier punto de España." },
    ],
    metaTitle: "Karaoke para Graduaciones | Alquiler Karaoke",
    metaDescription: "Karaoke para graduaciones en toda España: montaje de fiesta, himnos de tu generación y técnico opcional. Pide presupuesto para tu promoción.",
  },
];
