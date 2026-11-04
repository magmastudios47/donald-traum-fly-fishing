import { TraumStoreData } from "@/types/traum";

export const initialTraumData: TraumStoreData = {
  settings: {
    brandName: "TRAUM",
    brandSubtitle: "FLY CAST PATAGONIA",
    tagline: "Donde la pesca se hace realidad.",
    secondaryTagline: "Capturando sueños en los ríos y lagos del Neuquén.",
    locationGeneral:
      "Junín de los Andes, Provincia del Neuquén — Patagonia Argentina",
    whatsappNumber: "+54 9 2972 40-0000",
    email: "contacto@traumflycast.com",
    instagramHandle: "@traum.flycast",
    instagramUrl: "https://instagram.com",
    showDemoDepartures: true,
    showReferenceNoticeOnDestinations: false,
    adminPin: "traum2026",
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
    title: "Medios de Pago y Confirmación de Salidas",
    subtitle:
      "Flexibilidad y transparencia para asegurar tu fecha en la Patagonia",
    depositPercentage: 30,
    acceptedMethods: [
      "Transferencia Bancaria (Pesos ARS / USD)",
      "Mercado Pago (Tarjetas de crédito, débito y dinero en cuenta)",
      "Efectivo presencial en Junín de los Andes",
      "Pagos internacionales (PayPal / Wise / Dólar billete)",
    ],
    bankName: "Banco Provincia del Neuquén / Banco Galicia",
    bankAlias: "TRAUM.FLY.PATAGONIA",
    bankCbu: "0070000000000000000000",
    bankHolder: "TRAUM FLY CAST PATAGONIA",
    mercadoPagoLink: "",
    internationalPaymentLink: "",
    cancellationNotice:
      "Las reservas se bloquean en el calendario mediante una seña porcentual y el saldo restante se abona previo al inicio de la salida. Reprogramación sin cargo sujeta a condiciones hidrometeorológicas extremas.",
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
      // 8. Experience 01: Pescador lanzando con mosca en río cristalino
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/0/06/Flyfishing.jpg",
      highlights: [
        "Acceso a correderas, pozones y bancos de arena seleccionados según la época",
        "Lectura detallada de aguas, entomología local y selección de moscas",
        "Ritmo pausado y personalizado adaptado a la técnica del pescador",
      ],
      durationPlaceholder: "Jornada completa o media jornada",
      capacityPlaceholder: "1 a 2 pescadores por guía",
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
      // 9. Experience 02: Embarcación de deriva (drift boat) pescando con mosca
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/f/f3/ParksFlyShopDriftBoat.jpg",
      highlights: [
        "Balsas equipadas con marcos de remo profesionales y asientos ergonómicos",
        "Alcance a tramos exclusivos lejos de los accesos públicos convencionales",
        "Combinación dinámica de pesca desde la balsa y vadeo en puntos clave",
      ],
      durationPlaceholder: "Jornada completa según tramo y caudal",
      capacityPlaceholder: "Hasta 2 pescadores por embarcación",
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
      // 10. Experience 03: Pesca con mosca en río amplio de montaña
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/6/6d/Fly_fishing_on_White_River_near_Cotter%2C_AR.jpg",
      highlights: [
        "Clínicas de iniciación al lanzamiento y lectura de aguas en terreno real",
        "Programas de múltiples días combinando distintos ambientes del Neuquén",
        "Salidas privadas individuales, para dos personas o grupos a medida",
      ],
      durationPlaceholder: "1 o más jornadas a medida",
      capacityPlaceholder: "Individual, Dúo o Grupal",
      paymentLink: "",
    },
  ],
  destinations: [
    {
      id: "dest-malleo",
      name: "Río Malleo",
      location: "Junín de los Andes, Neuquén",
      // 11. Destination 01: Río Malleo real
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/6/65/Malleo_River.JPG",
      description:
        "Un clásico mundial del vadeo patagónico. Nace en el Lago Tromen y serpentea entre sauces, estepa y vistas imponentes al Volcán Lanín, ofreciendo aguas cristalinas ideales para la pesca con mosca seca y ninfas.",
      modalities: ["Pesca de vadeo", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.7765,
      lng: -71.2248,
      distanceFromJunin: "28 km al norte de Junín de los Andes",
      waterType: "Río",
    },
    {
      id: "dest-chimehuin",
      name: "Río Chimehuín",
      location: "Junín de los Andes, Neuquén",
      // 12. Destination 02: Río Chimehuín real en verano
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/9/9e/R%C3%ADo_Chimehuin_Neuquen_-_Argentina.jpg",
      description:
        "Cuna histórica de la pesca con mosca en Argentina. Sus aguas verde esmeralda, sus correderas profundas y su célebre Boca y Garganta del Diablo albergan truchas marrones y arcoíris de carácter inolvidable.",
      modalities: ["Pesca de vadeo", "Pesca en balsa", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.9182,
      lng: -71.0775,
      distanceFromJunin: "Atraviesa Junín de los Andes (0 a 25 km)",
      waterType: "Río",
    },
    {
      id: "dest-collon-cura",
      name: "Río Collón Curá",
      location: "Sur del Neuquén, Patagonia",
      // 13. Destination 03: Río Collón Curá real
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/2/21/RioCollonCura.jpg",
      description:
        "Ancho, generoso y rodeado de formaciones rocosas y estepa infinita. Sus múltiples brazos e islas lo convierten en un escenario extraordinario para flotadas en balsa y jornadas de gran actividad.",
      modalities: ["Pesca en balsa", "Pesca de vadeo", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -40.2335,
      lng: -70.6652,
      distanceFromJunin: "45 km al sureste de Junín de los Andes",
      waterType: "Río",
    },
    {
      id: "dest-alumine",
      name: "Río Aluminé",
      location: "Corredor Cordillerano, Neuquén",
      // 14. Destination 04: Río Aluminé real con araucarias
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/e/e9/Rio_alumine_en_invierno.jpg",
      description:
        "Aguas de montaña rodeadas de araucarias milenarias y cañadones de piedra. Sus correderas ágiles y pozones profundos brindan jornadas memorables de flotada.",
      modalities: ["Pesca en balsa", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.5521,
      lng: -70.9314,
      distanceFromJunin: "55 km hacia el norte por RP 23",
      waterType: "Río",
    },
    {
      id: "dest-huechulafquen",
      name: "Lago Huechulafquen y Boca del Chimehuín",
      location: "Parque Nacional Lanín, Neuquén",
      // 15. Destination 05: Boca del Río Chimehuín / Lago Huechulafquen real
      imageUrl:
        "https://upload.wikimedia.org/wikipedia/commons/b/b8/RIO_CHIMEHUIN_100_METROS.JPG",
      description:
        "Uno de los espejos lacustres más imponentes de la Patagonia al pie del Volcán Lanín, donde nace el mítico Río Chimehuín en un entorno de bosque andino patagónico.",
      modalities: ["Pesca de vadeo", "Pesca en balsa", "Salida personalizada"],
      isReferenceDemo: false,
      lat: -39.7938,
      lng: -71.2094,
      distanceFromJunin: "24 km de Junín de los Andes por RP 61",
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
    },
    {
      id: "srv-tecnico",
      title: "Asesoramiento técnico",
      description:
        "Perfeccionamiento de lanzamiento (cast), elección de líderes, lectura de eclosiones y presentación de moscas secas, ninfas y streamers.",
      iconName: "Award",
      enabled: true,
      note: "Adaptado a tu búsqueda técnica",
    },
    {
      id: "srv-planificacion",
      title: "Planificación de jornadas",
      description:
        "Selección estratégica de los mejores tramos, horarios y ambientes según condiciones climáticas, caudales y época de la temporada.",
      iconName: "Map",
      enabled: true,
      note: "Diseño previo a cada salida",
    },
    {
      id: "srv-balsa",
      title: "Navegación y logística para salidas en balsa",
      description:
        "Embarcaciones preparadas para fly fishing, coordinación de ingresos y egresos del río, y seguridad náutica en todo el recorrido.",
      iconName: "Anchor",
      enabled: true,
      note: "Específico para modalidad en balsa",
    },
    {
      id: "srv-nivel",
      title: "Experiencias adaptadas al nivel del pescador",
      description:
        "Paciencia pedagógica para quienes dan sus primeros pasos con la caña mosquera y exigencia táctica para pescadores experimentados.",
      iconName: "Sliders",
      enabled: true,
      note: "Iniciación, intermedio y avanzado",
    },
    {
      id: "srv-equipo",
      title: "Equipamiento de pesca",
      description:
        "Posibilidad de coordinar cañas, reels, líneas y selección de moscas patagónicas en caso de requerirlo para la salida.",
      iconName: "Briefcase",
      enabled: true,
      note: "Consultar según programa",
    },
  ],
  departures: [
    {
      id: "dep-1",
      date: "2026-11-12",
      destination: "Río Malleo — Sector Medio",
      experienceType: "Pesca de vadeo",
      serviceGroupType: "Salida para dos personas",
      maxParticipants: 2,
      availableSpots: 2,
      duration: "Jornada completa",
      additionalInfo:
        "Jornada enfocada en pesca con mosca seca y ninfas livianas en aguas bajas y cristalinas.",
      isDemo: false,
    },
    {
      id: "dep-2",
      date: "2026-11-18",
      destination: "Río Chimehuín — Flotada Clásica",
      experienceType: "Pesca en balsa",
      serviceGroupType: "Salida para dos personas",
      maxParticipants: 2,
      availableSpots: 2,
      duration: "Jornada completa",
      additionalInfo:
        "Recorrido en balsa combinando deriva sobre barrancas y paradas de vadeo en correderas.",
      isDemo: false,
    },
    {
      id: "dep-3",
      date: "2026-11-24",
      destination: "Río Collón Curá",
      experienceType: "Pesca en balsa",
      serviceGroupType: "Salida grupal",
      maxParticipants: 4,
      availableSpots: 4,
      duration: "Jornada completa",
      additionalInfo:
        "Salida coordinada con dos embarcaciones por los brazos e islas del Collón Curá.",
      isDemo: false,
    },
    {
      id: "dep-4",
      date: "2026-12-05",
      destination: "Junín de los Andes — Cuenca del Neuquén",
      experienceType: "Salida personalizada",
      serviceGroupType: "Salida privada o personalizada",
      maxParticipants: 2,
      availableSpots: 2,
      duration: "Programa a medida",
      additionalInfo:
        "Fecha programada para diseñar una experiencia a medida según nivel y preferencias del pescador.",
      isDemo: false,
    },
  ],
  reviews: [
    {
      id: "rev-1",
      authorName: "Santiago Mendizábal",
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
      authorLocation: "Bariloche / Múnich",
      experienceModality: "Salida personalizada · Río Collón Curá",
      rating: 5,
      comment:
        "Traum hace honor a su nombre.Tres días combinando vadeo técnico y balsa en rincones silenciosos de Junín de los Andes. El respeto por el recurso y el Catch & Release es ejemplar.",
      createdAt: "2026-01-14T11:15:00.000Z",
    },
  ],
  inquiries: [],
};
