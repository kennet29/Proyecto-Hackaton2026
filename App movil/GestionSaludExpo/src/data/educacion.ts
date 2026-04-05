export type NivelEducativoId = 'ninos' | 'adolescentes' | 'adultos';

export type TemaEducativo = {
  id: string;
  titulo: string;
  descripcion: string;
  actividades: string[];
  recursosVisuales: string[];
  formato: string[];
  recordatorios?: string[];
};

export type NivelEducativo = {
  id: NivelEducativoId;
  nombre: string;
  enfoque: string;
  comoMostrar: string[];
  temas: TemaEducativo[];
};

export const nivelesEducativos: NivelEducativo[] = [
  {
    id: 'ninos',
    nombre: 'Nivel niños',
    enfoque: 'Aprender hábitos básicos de forma simple, visual y divertida.',
    comoMostrar: ['Dibujos e ilustraciones', 'Colores llamativos', 'Videos cortos', 'Juegos o quizzes', 'Recompensas o insignias'],
    temas: [
      {
        id: 'lavado-manos',
        titulo: 'Lavado de manos',
        descripcion: 'Secuencia de 5 pasos con espuma de colores y canciones de 20 segundos.',
        actividades: [
          'Canción “burbujas” para contar hasta 20 mientras se tallan manos y dedos.',
          'Juego de luz negra para descubrir gérmenes imaginarios.',
        ],
        recursosVisuales: ['Póster impermeable para el baño', 'Tarjetas con personajes que recuerdan cada paso'],
        formato: ['video corto', 'infografía', 'juego interactivo'],
        recordatorios: ['Insignia “manos limpias” cada 5 días consecutivos'],
      },
      {
        id: 'cepillado',
        titulo: 'Cepillado de dientes',
        descripcion: 'Explora con dibujos los cuatro cuadrantes de la boca y los tiempos de cepillado.',
        actividades: [
          'Reloj de arena virtual de 2 minutos.',
          'Juego de arrastrar bacterias para reforzar movimientos circulares.',
        ],
        recursosVisuales: ['Calendario con stickers', 'Video animado con veterinario que cuida animales'],
        formato: ['video musical', 'juego de memoria'],
      },
      {
        id: 'frutas-verduras',
        titulo: 'Comer frutas y verduras',
        descripcion: 'Platos arcoíris explican por qué cada color ayuda al cuerpo.',
        actividades: [
          'Reto “3 colores al día” con pegatinas.',
          'Memorama de frutas con sonido.',
        ],
        recursosVisuales: ['Tarjetas de supermercado', 'Póster del refrigerador'],
        formato: ['juego drag & drop', 'infografía imprimible'],
      },
      {
        id: 'tomar-agua',
        titulo: 'Tomar agua',
        descripcion: 'Cuenta gotas digitales y vasos con caritas que cambian de color según consumo.',
        actividades: [
          'Botella virtual que se llena al registrar cada vaso.',
          'Historias cortas donde el agua da súper poderes.',
        ],
        recursosVisuales: ['Gráfica de nubes', 'Stickers de gotas'],
        formato: ['minijuego', 'video de 1 minuto'],
      },
      {
        id: 'dormir-bien',
        titulo: 'Dormir bien',
        descripcion: 'Rutina nocturna con ilustraciones para relajarse antes de dormir.',
        actividades: [
          'Secuencia “apaga las pantallas, respira, cuento”.',
          'Audio con respiraciones guiadas diseñado para niños.',
        ],
        recursosVisuales: ['Checklist magnético', 'Lámpara con colores calmantes'],
        formato: ['podcast corto', 'juego de arrastrar iconos a un tablero'],
      },
      {
        id: 'ejercicio-juego',
        titulo: 'Hacer ejercicio o jugar',
        descripcion: 'Mini misiones con animales que proponen saltos, estiramientos y bailes.',
        actividades: [
          'Reto “sorprende al koala” con alarmas cada 45 minutos.',
          'Baile libre con puntos extra por creatividad.',
        ],
        recursosVisuales: ['Cartas coleccionables', 'Rueda con retos físicos'],
        formato: ['video musical', 'ruleta interactiva'],
      },
      {
        id: 'sentirse-mal',
        titulo: 'Qué hacer si se sienten mal',
        descripcion: 'Historias animadas que enseñan a reconocer fiebre, dolor o tristeza.',
        actividades: [
          'Juego de decisiones “¿le cuento a mamá o respiro?”',
          'Tarjetas con semáforo emocional.',
        ],
        recursosVisuales: ['Semáforo magnético', 'Libro ilustrado'],
        formato: ['cuento interactivo', 'podcast'],
      },
      {
        id: 'ir-medico',
        titulo: 'Ir al médico sin miedo',
        descripcion: 'Recorrido virtual por el consultorio para mostrar instrumentos y pasos.',
        actividades: [
          'Juego “arma tu kit” con estetoscopio, baja lenguas y curitas.',
          'Role play con peluches para simular una revisión.',
        ],
        recursosVisuales: ['Plano del consultorio', 'Cartas de roles'],
        formato: ['video 360º', 'juego de exploración'],
      },
    ],
  },
  {
    id: 'adolescentes',
    nombre: 'Nivel adolescentes',
    enfoque: 'Información clara, útil y realista para su etapa.',
    comoMostrar: ['Diseño moderno', 'Lenguaje cercano', 'Artículos cortos', 'Tests de hábitos', 'Retos semanales'],
    temas: [
      {
        id: 'alimentacion-saludable-ado',
        titulo: 'Alimentación saludable',
        descripcion: 'Guías rápidas sobre macros, porciones y snacks inteligentes para la escuela.',
        actividades: [
          'Calculadora de plato balanceado según horario y actividad física.',
          'Reto “prep lunch” con checklist descargable.',
        ],
        recursosVisuales: ['Infografías minimalistas', 'Videos de 60 segundos'],
        formato: ['artículo corto', 'video vertical', 'quiz'],
      },
      {
        id: 'salud-mental-ado',
        titulo: 'Salud mental y manejo del estrés',
        descripcion: 'Identifica señales de ansiedad y aporta ejercicios de respiración y journaling.',
        actividades: [
          'Test “¿cómo está mi ánimo?” con sugerencias automáticas.',
          'Reto de 7 días escribiendo 3 pensamientos positivos.',
        ],
        recursosVisuales: ['Plantillas descargables', 'Audio guías'],
        formato: ['podcast', 'test interactivo'],
      },
      {
        id: 'sueno-ado',
        titulo: 'Sueño',
        descripcion: 'Tips para desconectarse de pantallas, crear ambientes y entender el ciclo circadiano.',
        actividades: [
          'Gráfico de horas ideales según edad.',
          'Rutina “30-30-30” (pantallas, higiene, lectura).',
        ],
        recursosVisuales: ['Checklists minimalistas'],
        formato: ['artículo', 'recordatorio push'],
      },
      {
        id: 'actividad-fisica-ado',
        titulo: 'Actividad física',
        descripcion: 'Planes rápidos de movilidad que requieren poco espacio y sin equipo.',
        actividades: [
          'Video con rutinas HIIT de 5 minutos.',
          'Reto semanal de pasos con ranking amistoso.',
        ],
        recursosVisuales: ['Gráficos de progreso'],
        formato: ['video', 'seguimiento en app'],
      },
      {
        id: 'cambios-cuerpo',
        titulo: 'Cambios del cuerpo en la adolescencia',
        descripcion: 'Explicaciones claras sobre pubertad, vello, voz y hormonas sin tabúes.',
        actividades: [
          'Glosario interactivo de términos.',
          'Caja de preguntas anónimas respondidas por especialistas.',
        ],
        recursosVisuales: ['Infografías ilustradas'],
        formato: ['artículo', 'foro moderado'],
      },
      {
        id: 'higiene-personal-ado',
        titulo: 'Higiene personal',
        descripcion: 'Recordatorios sobre piel, cabello, ropa deportiva y limpieza dental.',
        actividades: [
          'Checklist imprimible para backpack.',
          'Video rápido sobre desodorantes y bloqueadores.',
        ],
        recursosVisuales: ['Iconografía simple'],
        formato: ['infografía', 'video'],
      },
      {
        id: 'prevencion-ado',
        titulo: 'Prevención de enfermedades',
        descripcion: 'Vacunas, ETS y hábitos que reducen contagios en entornos sociales.',
        actividades: [
          'Mapa de vacunas por edad.',
          'Quiz de “mito vs realidad”.',
        ],
        recursosVisuales: ['Tablas comparativas'],
        formato: ['quiz', 'timeline interactivo'],
      },
      {
        id: 'pantallas-ado',
        titulo: 'Uso saludable de pantallas',
        descripcion: 'Tiempo recomendado, filtros de luz azul y pausas activas.',
        actividades: [
          'Configurador paso a paso de “modo enfoque”.',
          'Reto 20-20-20 (cada 20 minutos mira 20 pies lejos por 20 segundos).',
        ],
        recursosVisuales: ['GIFs explicativos'],
        formato: ['tutorial', 'recordatorio push'],
      },
      {
        id: 'relaciones-autocuidado',
        titulo: 'Relaciones sanas y autocuidado',
        descripcion: 'Límites, consentimiento y señales de alerta en amistades o parejas.',
        actividades: [
          'Escenarios interactivos con diversas respuestas.',
          'Checklist “me siento seguro cuando…”.',
        ],
        recursosVisuales: ['Cartas tipo chat'],
        formato: ['podcast', 'infografía'],
      },
    ],
  },
  {
    id: 'adultos',
    nombre: 'Nivel adultos',
    enfoque: 'Prevención, autocuidado y decisiones informadas.',
    comoMostrar: ['Información completa', 'Consejos aplicables', 'Recordatorios', 'Infografías', 'Evaluaciones de riesgo'],
    temas: [
      {
        id: 'alimentacion-adultos',
        titulo: 'Alimentación balanceada',
        descripcion: 'Plan semanal mediterráneo, control de porciones y etiquetas nutrimentales.',
        actividades: [
          'Plantilla descargable para meal prep.',
          'Comparador de azúcares ocultos en productos comunes.',
        ],
        recursosVisuales: ['Infografías de platos', 'Listas imprimibles'],
        formato: ['artículo detallado', 'planificador'],
      },
      {
        id: 'estres-adultos',
        titulo: 'Control del estrés',
        descripcion: 'Técnicas de respiración, pausas activas y límites laborales.',
        actividades: [
          'Audio de respiración cuadrada.',
          'Checklist para identificar señales de burnout.',
        ],
        recursosVisuales: ['Infografía de sistema nervioso'],
        formato: ['podcast', 'evaluación corta'],
      },
      {
        id: 'sueno-adultos',
        titulo: 'Sueño y descanso',
        descripcion: 'Higiene del sueño, impacto del alcohol y rutinas relajantes.',
        actividades: [
          'Diario de sueño con gráficas.',
          'Recordatorio inteligente para apagar pantallas.',
        ],
        recursosVisuales: ['Dashboard nocturno'],
        formato: ['seguimiento en app', 'artículo'],
      },
      {
        id: 'cardio-adultos',
        titulo: 'Salud cardiovascular',
        descripcion: 'Monitoreo de presión, colesterol y hábitos protectores.',
        actividades: [
          'Evaluación de riesgo Framingham simplificada.',
          'Plan de caminatas progresivas.',
        ],
        recursosVisuales: ['Tablas de valores saludables'],
        formato: ['evaluación', 'plan de ejercicio'],
      },
      {
        id: 'diabetes-hipertension',
        titulo: 'Prevención de diabetes e hipertensión',
        descripcion: 'Factores de riesgo, metas de glucosa y cómo interpretar resultados.',
        actividades: [
          'Checklist de hábitos que impactan glucosa.',
          'Registro de presión arterial con alertas.',
        ],
        recursosVisuales: ['Infografías con semáforos'],
        formato: ['seguimiento', 'artículo'],
      },
      {
        id: 'salud-mental-adultos',
        titulo: 'Salud mental',
        descripcion: 'Señales de depresión o ansiedad y herramientas de autocuidado.',
        actividades: [
          'Escala PHQ-2 autoaplicable.',
          'Plan de acción de 3 pasos (habla, respira, conecta).',
        ],
        recursosVisuales: ['Ficha de recursos locales'],
        formato: ['evaluación', 'podcast'],
      },
      {
        id: 'actividad-fisica-adultos',
        titulo: 'Actividad física',
        descripcion: 'Rutinas adaptadas a niveles de condición y objetivos.',
        actividades: [
          'Calendario de 4 semanas con progresiones.',
          'Video de movilidad para escritorio.',
        ],
        recursosVisuales: ['Calendario interactivo'],
        formato: ['planificador', 'video'],
      },
      {
        id: 'chequeos-medicos',
        titulo: 'Chequeos médicos',
        descripcion: 'Exámenes recomendados por edad, sexo y antecedentes.',
        actividades: [
          'Checklist descargable por década.',
          'Recordatorios sincronizados con el calendario.',
        ],
        recursosVisuales: ['Infografía cronológica'],
        formato: ['artículo', 'recordatorio'],
      },
      {
        id: 'salud-familiar',
        titulo: 'Salud familiar',
        descripcion: 'Organización de vacunas, botiquín y comunicación en casa.',
        actividades: [
          'Inventario de botiquín inteligente.',
          'Plan familiar de emergencias (contactos, alergias).',
        ],
        recursosVisuales: ['Plantillas compartibles'],
        formato: ['lista interactiva', 'infografía'],
      },
      {
        id: 'primeros-auxilios',
        titulo: 'Primeros auxilios básicos',
        descripcion: 'Cómo actuar ante cortaduras, quemaduras, asfixia y RCP básica.',
        actividades: [
          'Simuladores con decisiones rápidas.',
          'Video paso a paso de RCP de manos.',
        ],
        recursosVisuales: ['Tarjetas de emergencia'],
        formato: ['video', 'juego de simulación'],
      },
    ],
  },
];

export function obtenerNivel(nivelId: NivelEducativoId): NivelEducativo {
  return nivelesEducativos.find((nivel) => nivel.id === nivelId) ?? nivelesEducativos[0];
}

export function obtenerTema(nivelId: NivelEducativoId, temaId: string) {
  const nivel = obtenerNivel(nivelId);
  return nivel.temas.find((tema) => tema.id === temaId);
}
