import { TraumStoreData } from "@/types/traum";

export const initialTraumData: TraumStoreData = {
  version: 1,
  updatedAt: "2026-11-04T14:00:00.000Z",
  settings: {
    brandName: "TRAUM",
    brandSubtitle: "FLY CAST PATAGONIA",
    tagline: "Donde la pesca se hace realidad.",
    secondaryTagline: "Capturando sueños en los ríos y lagos del Neuquén.",
    locationGeneral:
      "Junín de los Andes, Provincia del Neuquén — Patagonia Argentina",
    whatsappNumber: "+54 9 2972 40-0000",
    email: "traumflyfishing9@gmail.com",
    notificationEmail: "traumflyfishing9@gmail.com",
    instagramHandle: "@traum.flycast",
    instagramUrl: "https://instagram.com",
    showDemoDepartures: true,
    showReferenceNoticeOnDestinations: false,
    adminPin: "traum2026",
    legalOwnerName: "Donald Traum — TRAUM Fly Cast Patagonia",
    legalTaxId: "CUIT / Reg. Fiscal en trámite — Provincia del Neuquén",
    legalAddress: "Junín de los Andes (CP 8371), Provincia del Neuquén, República Argentina",
    guideLicenseNumber: "Guía de Pesca Deportiva Habilitado — Reglamento Continental Patagónico",
    googleClientId: "",
    web3FormsAccessKey: "fa183ece-13f6-4360-8085-ff84ba3ea870",
    smtpUser: "traumflyfishing9@gmail.com",
    smtpAppPassword: "",
    resendApiKey: "",
  },
  siteImages: {
    // 1. Hero Background: Lago Huechulafquen & Volcán Lanín north face
    heroBg:
      "https://upload.wikimedia.org/wikipedia/commons/a/a9/Lago_Huechulafquen_e_lado_norte_do_Vulc%C3%A3o_Lanin_-_panoramio.jpg",
    // 2. Philosophy Main: Río Chimehuín en Junín de los Andes
    philosophyMain:
      "https://upload.wikimedia.org/wikipedia/commons/8/8f/R%C3%ADo_Chimehu%C3%ADn_en_Jun%C3%ADn_de_los_Andes.JPG",
    // 3. Pillar I (El sueño de la captura): Trucha arcoíris en mano en el arroyo
    pillarCapture:
      "https://upload.wikimedia.org/wikipedia/commons/a/a5/Rainbow_Trout_in_Hand_at_Gechiak_Creek_-_DPLA_-_5df2fdd6c9e572be8b3b79b5a2450eca.jpg",
    // 4. Pillar II (El sueño de desconectar): Lanín reflejado en el lago al amanecer
    pillarDisconnect:
      "https://upload.wikimedia.org/wikipedia/commons/0/0c/Lanin_Huechulafquen.jpg",
    // 5. Pillar III (El sueño de compartir): Pescadores vadeando juntos en el río
    pillarShare:
      "https://upload.wikimedia.org/wikipedia/commons/5/5f/Fly_fishing_on_the_Ramapo_River_on_opening_day_of_NY_2013_trout_season.jpg",
    // 6. Conservation Main (Pesca Responsable Catch & Release): Trucha arcoíris hembra en el agua
    conservationMain:
      "https://upload.wikimedia.org/wikipedia/commons/1/1d/Female_Rainbow_Trout_in_hand.JPG",
    // 7. Thoreau Quote Background: Lago Tromen y cordillera patagónica
    thoreauQuoteBg:
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/LagoTromen.jpg",
  },
  paymentConfig: {
    enabled: true,
    title: "Medios de Pago y Reserva con Seña",
    subtitle:
      "Transparencia y respaldo comercial para asegurar tu fecha en la Patagonia",
    depositPercentage: 30,
    acceptedMethods: [
      "Transferencia Bancaria (Pesos ARS / USD)",
      "Mercado Pago (Tarjetas de crédito, débito y dinero en cuenta)",
      "Efectivo presencial en Junín de los Andes",
      "Pagos internacionales (PayPal / Wise / Dólar billete)",
    ],
    bankName: "Banco Provincia del Neuquén / Banco Galicia",
    bankAlias: "TRAUM.FLY.PATAGONIA",
    bankCbu: "",
    bankHolder: "DONALD TRAUM — TRAUM FLY FISHING",
    mercadoPagoLink: "",
    internationalPaymentLink: "",
    cancellationNotice:
      "Las reservas se bloquean en el calendario mediante la integración del porcentaje de seña indicado y el saldo restante se abona previo al inicio de la salida. Los datos bancarios (Alias y Titular) y links de pago se habilitan automáticamente al contratar cualquiera de los servicios cargados en la página.",
  },
  experiences: [
    {
      id: "exp-vadeo",
      number: "01",
      title: "Pesca de vadeo",
      subtitle: "Lectura íntima del agua y conexión directa con el río",
      description:
        "Una experiencia de pesca caminando por las orillas y dentro de los ríos, explorando sectores cuidadosamente seleccionados.",
      extendedDescription:
        "Transmitimos una experiencia cercana al agua, donde el pescador puede leer las corrientes, observar el comportamiento de los peces y disfrutar de la naturaleza desde otra perspectiva. Ideal para quienes disfrutan del acecho técnico, la precisión en el lanzamiento y el silencio de las correderas patagónicas.",
      modality: "Pesca de vadeo",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/0/06/Flyfishing.jpg",
      highlights: [
        "Acceso a correderas, pozones y bancos de arena seleccionados según la época",
        "Lectura detallada de aguas, entomología local y selección de moscas",
        "Ritmo pausado y personalizado adaptado a la técnica del pescador",
      ],
      durationPlaceholder: "Jornada completa o media jornada",
      capacityPlaceholder: "1 a 2 pescadores por guía",
      priceLabel: "Tarifa según cantidad de jornadas y participantes",
      paymentLink: "",
    },
    {
      id: "exp-balsa",
      number: "02",
      title: "Pesca en balsa",
      subtitle: "Navegación silenciosa hacia sectores vírgenes de la cordillera",
      description:
        "Recorridos por ríos patagónicos a bordo de balsas preparadas para jornadas de pesca.",
      extendedDescription:
        "Una experiencia que combina navegación, paisajes únicos y oportunidades de pesca en sectores de difícil acceso. Flotar un río patagónico permite cubrir kilómetros de agua prístina, alternando deriva desde la embarcación con paradas estratégicas de vadeo en islas y barrancas.",
      modality: "Pesca en balsa",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/f/f3/ParksFlyShopDriftBoat.jpg",
      highlights: [
        "Balsas equipadas con marcos de remo profesionales y asientos ergonómicos",
        "Alcance a tramos exclusivos lejos de los accesos públicos convencionales",
        "Combinación dinámica de pesca desde la balsa y vadeo en puntos clave",
      ],
      durationPlaceholder: "Jornada completa según tramo y caudal",
      capacityPlaceholder: "Hasta 2 pescadores por embarcación",
      priceLabel: "Flotada guiada · Consultar tarifa vigente por balsa",
      paymentLink: "",
    },
    {
      id: "exp-personalizada",
      number: "03",
      title: "Salidas personalizadas",
      subtitle: "Un itinerario diseñado a la medida de tu propio sueño",
      description:
        "Experiencias diseñadas según el nivel, los objetivos y las preferencias de cada pescador.",
      extendedDescription:
        "Desde quienes quieren iniciarse en la pesca con mosca hasta pescadores experimentados que buscan nuevos desafíos. Diseñamos la propuesta contemplando tus expectativas técnicas, el ritmo de viaje deseado y la compañía con quien elijas compartir el río.",
      modality: "Salida personalizada",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/6/6d/Fly_fishing_on_White_River_near_Cotter%2C_AR.jpg",
      highlights: [
        "Clínicas de iniciación al lanzamiento y lectura de aguas en terreno real",
        "Programas de múltiples días combinando distintos ambientes del Neuquén",
        "Salidas privadas individuales, para dos personas o grupos a medida",
      ],
      durationPlaceholder: "1 o más jornadas a medida",
      capacityPlaceholder: "Individual, Dúo o Grupal",
      priceLabel: "Cotización personalizada según itinerario",
      paymentLink: "",
    },
  ],
  destinations: [
    {
      id: "dest-malleo",
      name: "Río Malleo",
      location: "Parque Nacional Lanín · Ruta Prov. 23, Neuquén",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/6/65/Malleo_River.JPG",
      description:
        "Un clásico mundial del vadeo patagónico. Nace en el Lago Tromen y serpentea por el valle entre sauces, estepa y vistas imponentes al Volcán Lanín, ofreciendo aguas cristalinas ideales para la pesca con mosca seca y ninfas.",
      modalities: ["Pesca de vadeo", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.670011,
      lng: -71.202812,
      distanceFromJunin: "35 km al norte de Junín de los Andes por RP 60 / RP 23",
      waterType: "Río",
    },
    {
      id: "dest-chimehuin",
      name: "Río Chimehuín",
      location: "Junín de los Andes · Garganta del Diablo, Neuquén",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/9/9e/R%C3%ADo_Chimehuin_Neuquen_-_Argentina.jpg",
      description:
        "Cuna histórica de la pesca con mosca en Argentina. Sus aguas verde esmeralda, sus correderas profundas y su célebre Boca y Garganta del Diablo albergan truchas marrones y arcoíris de carácter inolvidable.",
      modalities: ["Pesca de vadeo", "Pesca en balsa", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.913791,
      lng: -71.085848,
      distanceFromJunin: "Atraviesa Junín de los Andes (0 a 25 km)",
      waterType: "Río",
    },
    {
      id: "dest-collon-cura",
      name: "Río Collón Curá",
      location: "Valle del Collón Curá · Ruta Nac. 234, Neuquén",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/2/21/RioCollonCura.jpg",
      description:
        "Ancho, generoso y rodeado de formaciones rocosas y estepa infinita. Sus múltiples brazos e islas lo convierten en un escenario extraordinario para flotadas en balsa y jornadas de gran actividad.",
      modalities: ["Pesca en balsa", "Pesca de vadeo", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -40.115193,
      lng: -70.751264,
      distanceFromJunin: "45 km al sureste de Junín de los Andes",
      waterType: "Río",
    },
    {
      id: "dest-alumine",
      name: "Río Aluminé",
      location: "Corredor Cordillerano · Sector Pilolil / Rahue, Neuquén",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/e/e9/Rio_alumine_en_invierno.jpg",
      description:
        "Aguas de montaña rodeadas de araucarias milenarias y cañadones de piedra. Sus correderas ágiles y pozones profundos brindan jornadas memorables de flotada.",
      modalities: ["Pesca en balsa", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.399372,
      lng: -70.931402,
      distanceFromJunin: "55 km hacia el norte por RP 23",
      waterType: "Río",
    },
    {
      id: "dest-huechulafquen",
      name: "Lago Huechulafquen y Boca del Chimehuín",
      location: "Parque Nacional Lanín · Ruta Prov. 61, Neuquén",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/b/b8/RIO_CHIMEHUIN_100_METROS.JPG",
      description:
        "Uno de los espejos lacustres más imponentes de la Patagonia al pie del Volcán Lanín, donde nace el mítico Río Chimehuín en un entorno de bosque andino patagónico.",
      modalities: ["Pesca de vadeo", "Pesca en balsa", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.776375,
      lng: -71.348736,
      distanceFromJunin: "24 km al noroeste de Junín de los Andes por RP 61",
      waterType: "Lago",
    },
    {
      id: "dest-caleufu",
      name: "Río Caleufú",
      location: "Valle del Caleufú · Cuenca Sur, Neuquén",
      imageUrl:
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=85",
      description:
        "Formado por la confluencia de los ríos Meliquina y Filo Hua Hum, el Caleufú recorre un cañadón patagónico solitario de aguas puras, ideal para flotadas silenciosas en busca de marrones y arcoíris.",
      modalities: ["Pesca en balsa", "Pesca de vadeo", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -40.398872,
      lng: -70.982634,
      distanceFromJunin: "52 km al sur de Junín de los Andes por RN 40 / RP 63",
      waterType: "Río",
    },
    {
      id: "dest-quenquentreu",
      name: "Río Quenquentreu",
      location: "Cuenca Lácar / Collón Curá, Neuquén",
      imageUrl:
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=85",
      description:
        "Curso cordillerano de aguas frías y oxigenadas que serpentea entre sauces y mallines patagónicos, excelente para pesca técnica de vadeo con equipos livianos.",
      modalities: ["Pesca de vadeo", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -40.222585,
      lng: -70.975758,
      distanceFromJunin: "38 km al sur de Junín de los Andes por RN 40",
      waterType: "Río",
    },
    {
      id: "dest-currue",
      name: "Río Curruhué",
      location: "Parque Nacional Lanín · Ruta Prov. 62, Neuquén",
      imageUrl:
        "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1400&q=85",
      description:
        "Río íntimo y técnico que nace en el Lago Curruhué Chico y desciende entre coihues y juncales hasta el Chimehuín. Sus pozones transparentes premian el acecho y la presentación delicada.",
      modalities: ["Pesca de vadeo", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.939642,
      lng: -71.253204,
      distanceFromJunin: "28 km al oeste de Junín de los Andes por RP 62",
      waterType: "Río",
    },
    {
      id: "dest-epulafquen",
      name: "Lago Epulafquen",
      location: "Parque Nacional Lanín · Ruta Prov. 61, Neuquén",
      imageUrl:
        "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1400&q=85",
      description:
        "Unido al Huechulafquen en el corazón del Parque Nacional Lanín, sus bahías protegidas, veriles profundos y escoriales volcánicos ofrecen pesca embarcada y de costa frente a la cordillera.",
      modalities: ["Pesca en balsa", "Pesca de vadeo", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.801988,
      lng: -71.568575,
      distanceFromJunin: "52 km al noroeste de Junín de los Andes por RP 61",
      waterType: "Lago",
    },
    {
      id: "dest-paimun",
      name: "Lago Paimún",
      location: "Parque Nacional Lanín · Pie del Volcán Lanín, Neuquén",
      imageUrl:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85",
      description:
        "Espejo de agua rodeado de bosques centenarios de araucarias y coihues a los pies del glaciar del Volcán Lanín. Sus desembocaduras de arroyos y juncales albergan truchas de gran porte.",
      modalities: ["Pesca en balsa", "Pesca de vadeo", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.729062,
      lng: -71.533847,
      distanceFromJunin: "58 km al noroeste de Junín de los Andes por RP 61",
      waterType: "Lago",
    },
    {
      id: "dest-curruhue-chico",
      name: "Lago Curruhué Chico",
      location: "Parque Nacional Lanín · Ruta Prov. 62, Neuquén",
      imageUrl:
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=85",
      description:
        "Primer lago de la cuenca Curruhué sobre la RP 62. Sus costas de juncos y bahías calmas ofrecen excelentes eclosiones de libélulas y mayflies para pescar desde balsa o vadeando sus veriles.",
      modalities: ["Pesca de vadeo", "Pesca en balsa", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.907623,
      lng: -71.342429,
      distanceFromJunin: "30 km al oeste de Junín de los Andes por RP 62",
      waterType: "Lago",
    },
    {
      id: "dest-curruhue-grande",
      name: "Lago Curruhué Grande",
      location: "Parque Nacional Lanín · Ruta Prov. 62, Neuquén",
      imageUrl:
        "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1400&q=85",
      description:
        "Lago glaciario extenso y salvaje enmarcado por bosques de pehuenes y montañas escarpadas camino a Lahuen Co. Ideal para recorrer en balsa buscando grandes marrones y arcoíris cerca de los arroyos tributarios.",
      modalities: ["Pesca en balsa", "Pesca de vadeo", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.859902,
      lng: -71.452692,
      distanceFromJunin: "45 km al oeste de Junín de los Andes por RP 62",
      waterType: "Lago",
    },
  ],
  services: [
    {
      id: "srv-guia",
      title: "Acompañamiento y guía de pesca",
      description:
        "Conducción profesional durante toda la jornada, lectura de aguas en tiempo real y asistencia permanente en cada situación de pesca.",
      iconName: "Compass",
      enabled: true,
      note: "Incluido en todas las modalidades",
      priceLabel: "Servicio base de guiada",
    },
    {
      id: "srv-tecnico",
      title: "Asesoramiento técnico y clínica de cast",
      description:
        "Perfeccionamiento de lanzamiento (cast), elección de líderes, lectura de eclosiones y presentación de moscas secas, ninfas y streamers.",
      iconName: "Award",
      enabled: true,
      note: "Adaptado a tu búsqueda técnica",
      priceLabel: "Clínica personalizada / Guiada técnica",
    },
    {
      id: "srv-planificacion",
      title: "Planificación integral de jornadas",
      description:
        "Selección estratégica de los mejores tramos, horarios y ambientes según condiciones climáticas, caudales y época de la temporada.",
      iconName: "Map",
      enabled: true,
      note: "Diseño previo a cada salida",
      priceLabel: "Itinerario multirrío a medida",
    },
    {
      id: "srv-balsa",
      title: "Navegación y logística en balsa",
      description:
        "Embarcaciones preparadas para fly fishing, coordinación de ingresos y egresos del río, y seguridad náutica en todo el recorrido.",
      iconName: "Anchor",
      enabled: true,
      note: "Específico para modalidad en balsa",
      priceLabel: "Jornada completa de flotada",
    },
    {
      id: "srv-nivel",
      title: "Salidas de iniciación y perfeccionamiento",
      description:
        "Paciencia pedagógica para quienes dan sus primeros pasos con la caña mosquera y exigencia táctica para pescadores experimentados.",
      iconName: "Sliders",
      enabled: true,
      note: "Iniciación, intermedio y avanzado",
      priceLabel: "Bautismo mosquero / Perfeccionamiento",
    },
    {
      id: "srv-equipo",
      title: "Provisión de equipamiento de pesca",
      description:
        "Posibilidad de coordinar cañas, reels, líneas y selección de moscas patagónicas en caso de requerirlo para la salida.",
      iconName: "Briefcase",
      enabled: true,
      note: "Consultar según programa",
      priceLabel: "Adicional o incluido según paquete",
    },
  ],
  departures: [
    {
      id: "dep-1",
      date: "2026-11-12",
      startTime: "08:00",
      endTime: "17:00",
      destination: "Río Malleo — Sector Medio",
      experienceType: "Pesca de vadeo",
      serviceGroupType: "Salida para dos personas",
      maxParticipants: 2,
      availableSpots: 2,
      duration: "Jornada completa",
      additionalInfo:
        "Jornada enfocada en pesca con mosca seca y ninfas livianas en aguas bajas y cristalinas.",
      status: "activa",
      isDemo: false,
    },
    {
      id: "dep-2",
      date: "2026-11-18",
      startTime: "07:30",
      endTime: "18:00",
      destination: "Río Chimehuín — Flotada Clásica",
      experienceType: "Pesca en balsa",
      serviceGroupType: "Salida para dos personas",
      maxParticipants: 4,
      availableSpots: 4,
      duration: "Jornada completa",
      additionalInfo:
        "Recorrido en balsa combinando deriva sobre barrancas y paradas de vadeo en correderas.",
      status: "activa",
      isDemo: false,
    },
    {
      id: "dep-3",
      date: "2026-11-24",
      startTime: "08:00",
      endTime: "17:30",
      destination: "Río Collón Curá",
      experienceType: "Pesca en balsa",
      serviceGroupType: "Salida grupal",
      maxParticipants: 4,
      availableSpots: 4,
      duration: "Jornada completa",
      additionalInfo:
        "Salida coordinada con dos embarcaciones por los brazos e islas del Collón Curá.",
      status: "activa",
      isDemo: false,
    },
    {
      id: "dep-4",
      date: "2026-12-05",
      startTime: "08:30",
      endTime: "17:30",
      destination: "Junín de los Andes — Cuenca del Neuquén",
      experienceType: "Salida personalizada",
      serviceGroupType: "Salida privada o personalizada",
      maxParticipants: 2,
      availableSpots: 2,
      duration: "Programa a medida",
      additionalInfo:
        "Fecha programada para diseñar una experiencia a medida según nivel y preferencias del pescador.",
      status: "activa",
      isDemo: false,
    },
  ],
  enrollments: [],
  customRequests: [],
  blockedDays: [],
  waitlistAlerts: [],
  reviews: [
    {
      id: "rev-1",
      authorName: "Santiago Mendizábal",
      authorEmail: "s.mendizabal@gmail.com",
      verifiedGoogle: true,
      authorLocation: "Buenos Aires, Argentina",
      experienceModality: "Pesca de vadeo · Río Malleo",
      rating: 5,
      comment:
        "Vadeamos el Malleo temprano con el Lanín de fondo. La lectura del agua, la paciencia para esperar la subida de las marrones a la mosca seca y la tranquilidad de toda la jornada superaron cualquier expectativa.",
      createdAt: "2026-03-18T14:00:00.000Z",
    },
    {
      id: "rev-2",
      authorName: "Hernán & Lucas Pellegrini",
      authorEmail: "hpellegrini.fly@gmail.com",
      verifiedGoogle: true,
      authorLocation: "Rosario, Santa Fe",
      experienceModality: "Pesca en balsa · Río Chimehuín",
      rating: 5,
      comment:
        "Hicimos nuestra primera flotada padre e hijo en el Chimehuín. La logística impecable, las paradas en las correderas justas y una calidez humana que te hace sentir pescando con amigos de toda la vida.",
      createdAt: "2026-02-25T18:30:00.000Z",
    },
    {
      id: "rev-3",
      authorName: "Matías K. Weber",
      authorEmail: "matias.weber.patagonia@gmail.com",
      verifiedGoogle: true,
      authorLocation: "Bariloche / Múnich",
      experienceModality: "Salida personalizada · Río Collón Curá",
      rating: 5,
      comment:
        "Traum hace honor a su nombre. Tres días combinando vadeo técnico y balsa en rincones silenciosos de Junín de los Andes. El respeto por el recurso y el Catch & Release es ejemplar.",
      createdAt: "2026-01-14T11:15:00.000Z",
    },
  ],
  gallery: [
    {
      id: "gal-1",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/9/9e/R%C3%ADo_Chimehuin_Neuquen_-_Argentina.jpg",
      caption: "Aguas cristalinas del Río Chimehuín en Junín de los Andes",
      order: 0,
      createdAt: "2026-03-01T10:00:00.000Z",
    },
    {
      id: "gal-2",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/6/65/Malleo_River.JPG",
      caption: "Vadeo técnico en el Río Malleo con vista al Volcán Lanín",
      order: 1,
      createdAt: "2026-03-02T10:00:00.000Z",
    },
    {
      id: "gal-3",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/2/21/RioCollonCura.jpg",
      caption: "Flotada por los brazos y cañadones del Río Collón Curá",
      order: 2,
      createdAt: "2026-03-03T10:00:00.000Z",
    },
    {
      id: "gal-4",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/b/b8/RIO_CHIMEHUIN_100_METROS.JPG",
      caption: "Boca del Chimehuín y Lago Huechulafquen al amanecer",
      order: 3,
      createdAt: "2026-03-04T10:00:00.000Z",
    },
    {
      id: "gal-5",
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/e/e9/Rio_alumine_en_invierno.jpg",
      caption: "Corredor cordillerano del Río Aluminé en el Neuquén",
      order: 4,
      createdAt: "2026-03-05T10:00:00.000Z",
    },
    {
      id: "gal-6",
      imageUrl:
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1400&q=85",
      caption: "Pesca con mosca y devolución responsable en Patagonia",
      order: 5,
      createdAt: "2026-03-06T10:00:00.000Z",
    },
  ],
  emailLogs: [],
  inquiries: [],
  cookieConsents: [],
  regretRequests: [],
};
