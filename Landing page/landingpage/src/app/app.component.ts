/**
 * @file Landing page/landingpage/src/app/app.component.ts
 * @description TypeScript module implementation.
 */

import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import * as L from 'leaflet';
import { NanoStoreComponent } from './nano-store/nano-store.component';

type NavSection = {
  id: string;
  label: string;
};

type HeroStat = {
  value: string;
  label: string;
};

type FooterSocial = {
  label: string;
  short: string;
};

type FooterSection = {
  title: string;
  links: string[];
};

type ClinicImage = {
  src: string;
  alt: string;
};

type MapPoint = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  services: PublicService[];
  images: ClinicImage[];
};

type PublicService = {
  id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  precioReferencia: number | null;
  moneda: string | null;
  tiempoEntrega: string | null;
};

type PublicInstitutionResponse = {
  id: number;
  nombre: string;
  tipo: string;
  activo: boolean;
  descripcion: string | null;
  telefono: string | null;
  correo: string | null;
  sitioWeb: string | null;
  direccion: string | null;
  ciudad: string | null;
  departamento: string | null;
  horarioAtencion: string | null;
  latitud: number | null;
  longitud: number | null;
  servicios: PublicService[];
};

type ViewTransition = {
  ready: Promise<void>;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => ViewTransition;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NanoStoreComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly title = 'Nica Prime';
  isDarkMode = this.getInitialTheme();
  isMobileMenuOpen = false;
  private map?: L.Map;
  private pointMarkers?: L.LayerGroup;
  private readonly markersById = new Map<number, L.CircleMarker>();
  private clockTimer?: ReturnType<typeof setInterval>;
  currentNicaraguaTime = '';
  currentNicaraguaDate = '';
  directoryLoading = true;
  directoryError = '';
  mapPoints: MapPoint[] = [];
  selectedGallery: { title: string; images: ClinicImage[] } | null = null;
  selectedGalleryIndex = 0;
  isGalleryZoomed = false;
  private previousBodyOverflow = '';

  constructor(private readonly http: HttpClient) {}

  readonly navSections: NavSection[] = [
    { id: 'sobre-nosotros', label: 'Sobre nosotros' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'caracteristicas', label: 'Funciones' },
    { id: 'app-movil', label: 'App movil' },
    { id: 'mapa', label: 'Mapa de salud' },
    { id: 'nano-biblioteca', label: 'Nano Biblioteca' },
    { id: 'nano-tienda', label: 'Nano Tienda' },
    { id: 'precios', label: 'Planes' },
    { id: 'contacto', label: 'Contacto' },
    { id: 'faq', label: 'Preguntas' },
    { id: 'blog', label: 'Recursos' }
  ];

  readonly heroSignals = ['Expediente seguro', 'Recordatorios', 'Mapa de clinicas', 'Seguimiento preventivo'];

  readonly mobileBenefits = [
    {
      title: 'Agenda medica',
      description: 'Coordina citas, controles y estimaciones medicas con recordatorios para no perderte ninguna prioridad de salud.',
      bullets: ['Recordatorios inteligentes', 'Historial de citas', 'Seguimiento por paciente']
    },
    {
      title: 'Control cronico',
      description: 'Sigue tus indicadores, medicación y rutinas de cuidado con una vista clara y constante del estado.',
      bullets: ['Medicamentos y dosis', 'Indicadores clave', 'Monitoreo continuo']
    },
    {
      title: 'Alertas inteligentes',
      description: 'Recibe avisos utiles para vacunas, rutinas, citas y hábitos esenciales para prevenir problemas antes de que aparezcan.',
      bullets: ['Alertas personalizadas', 'Prevención temprana', 'Ritmos de cuidado']
    },
    {
      title: 'Acceso familiar',
      description: 'Comparte el cuidado con tu familia, organizando seguimientos para adultos mayores, niños y personas dependientes.',
      bullets: ['Cuidado compartido', 'Seguimiento de familiares', 'Toma de decisiones en equipo']
    }
  ];

  selectedBenefit: { title: string; description: string; bullets: string[] } | null = null;

  readonly heroStats: HeroStat[] = [
    { value: '24/7', label: 'acceso al expediente desde cualquier lugar' },
    { value: '+40', label: 'modulos y registros clinicos integrados' },
    { value: '1 app', label: 'para pacientes, familias y seguimiento' }
  ];

  readonly features = [
    {
      title: 'Citas y recordatorios',
      description: 'Programa consultas, vacunas, controles y medicamentos con recordatorios para mantener tu seguimiento al día.'
    },
    {
      title: 'Expediente médico digital',
      description: 'Organiza tu información de salud, antecedentes, alergias, medicamentos y exámenes en un solo lugar.'
    },
    {
      title: 'Seguimiento de hábitos',
      description: 'Registra tu hidratación, alimentación, actividad física, descanso y otros hábitos para avanzar hacia una vida más saludable.'
    },
    {
      title: 'Orientación nutricional con IA',
      description: 'Analiza tus alimentos y recibe recomendaciones personalizadas para mejorar tu alimentación según tus objetivos.'
    },
    {
      title: 'Directorio de servicios de salud',
      description: 'Encuentra clínicas, hospitales, farmacias y otros servicios de salud a través de un mapa interactivo.'
    }
  ];

  readonly pricing = [
    {
      name: 'Nano Gratis',
      image: 'assets/nano-plans/nano-gratis.svg',
      imageAlt: 'Nano del plan gratis',
      badge: '',
      accentClass: 'accent-green',
      price: 'C$0.00',
      priceDetail: 'Gratis',
      detail: 'Para comenzar a cuidar tu salud',
      audience: [],
      bullets: [
        '✓ Registra hasta 3 personas',
        '✓ 1 consulta diaria con la IA de Nano Bienestar',
        '✓ Herramientas esenciales para el seguimiento de tu salud'
      ],
      action: 'Comenzar gratis'
    },
    {
      name: 'Nano Free Premium',
      image: 'assets/nano-plans/nano-free-premium.svg',
      imageAlt: 'Nano del plan Free Premium',
      badge: '🏆 Más elegido',
      accentClass: 'accent-blue',
      price: 'C$130.00',
      priceDetail: 'por usuario',
      detail: 'Para quienes quieren llevar su cuidado al siguiente nivel',
      audience: [],
      bullets: [
        '✓ Registro ilimitado de personas',
        '✓ Acceso a todas las funcionalidades de la aplicación',
        '✓ Uso ilimitado de las opciones de IA disponibles',
        '✓ Sin anuncios publicitarios'
      ],
      action: 'Elegir Premium'
    },
    {
      name: 'Nano Plus',
      image: 'assets/nano-plans/nano-plus.svg',
      imageAlt: 'Nano del plan Plus para profesionales de la salud',
      badge: '',
      accentClass: 'accent-rose',
      price: 'C$150.00',
      priceDetail: 'por profesional',
      detail: 'Para profesionales de la salud',
      audience: [],
      bullets: [
        '✓ Registra y gestiona la información de tus pacientes',
        '✓ Accede a los historiales de salud de tus pacientes',
        '✓ Facilita el seguimiento y organización de la información',
        '✓ Los usuarios pueden agendar citas contigo directamente desde la web'
      ],
      action: 'Soy profesional de salud'
    },
    {
      name: 'Nano Publicidad',
      image: 'assets/nano-plans/nano-publicidad.svg',
      imageAlt: 'Nano del servicio de publicidad',
      badge: '',
      accentClass: 'accent-green',
      price: 'C$450.00',
      priceDetail: 'por servicio publicitario',
      detail: 'Haz crecer tu presencia dentro de Nica Prime',
      audience: [
        '🩺 Médicos y profesionales de la salud',
        '🏥 Clínicas y laboratorios clínicos',
        '🏋️ Gimnasios y marcas deportivas',
        '💊 Tiendas de suplementos médicos y alimenticios',
        '💚 Farmacias y otros negocios relacionados con salud y bienestar'
      ],
      bullets: [
        '✓ Aparece en el mapa de profesionales y servicios de salud de Nica Prime',
        '✓ Publicita tus servicios dentro de Nica Prime',
        '✓ Ofrece tus productos en la Nano Tienda',
        '✓ Conecta tu negocio con personas interesadas en el cuidado de su salud y bienestar',
        '✓ Aumenta la visibilidad de tu marca dentro de la plataforma'
      ],
      action: 'Publicitar mi negocio'
    }
  ];

  readonly faq = [
    {
      question: 'Que resuelve NICAPRIME?',
      answer: 'Centraliza expediente, citas, recordatorios, mapa de servicios y seguimiento clinico en una sola plataforma.'
    },
    {
      question: 'Funciona desde telefono y computadora?',
      answer: 'Si. La experiencia esta pensada para uso movil, pero tambien se adapta a escritorio.'
    },
    {
      question: 'Puede usarse para pacientes y personal de salud?',
      answer: 'Si. El proyecto contempla flujos para pacientes, familiares y profesionales con distintos modulos.'
    }
  ];

  readonly pharmacyProducts = [
    { id: 'tensiometro', name: 'Microlife Tensiómetro de brazo con manguito', category: 'Equipos médicos', price: 995, image: 'tensiometro' },
    { id: 'termometro', name: 'Microlife Termómetro digital MT 600', category: 'Equipos médicos', price: 420, image: 'termometro' },
    { id: 'nebulizador', name: 'Nebulizador Wellpro Compresor Adulto 1U', category: 'Equipos médicos', price: 1100, image: 'nebulizador' },
    { id: 'glucometro', name: 'Sensor Wellpro glucómetro (10 tiras reactivas)', category: 'Equipos médicos', price: 905, image: 'glucometro' },
    { id: 'silla-ruedas', name: 'Silla de ruedas Wellpro estándar WP809B', category: 'Movilidad', price: 5600, image: 'silla-ruedas' },
    { id: 'vitaflenaco', name: 'Vitaflenaco', category: 'Medicamentos', price: 74, image: 'vitaflenaco' }
  ];

  readonly healthGuides = [
    { title: 'Alimentación infantil saludable', file: 'alimentacion-infantil-saludable.pdf', image: 'alimentacion-infantil.svg', imageAlt: 'Nano sobre alimentación infantil saludable' },
    { title: 'Atendiendo enfermedades crónicas', file: 'enfermedades-cronicas.pdf', image: 'enfermedades-cronicas.svg', imageAlt: 'Nano sobre prevención de enfermedades crónicas' },
    { title: 'Cuido y prevención de alergias', file: 'prevencion-alergias.pdf', image: 'alergias.svg', imageAlt: 'Nano sobre prevención de alergias' },
    { title: 'Cuido y prevención de lesiones deportivas', file: 'lesiones-deportivas.pdf', image: 'lesiones-deportivas.svg', imageAlt: 'Nano sobre prevención de lesiones deportivas' },
    { title: 'Cuido y prevención de trastornos del sueño', file: 'trastornos-del-sueno.pdf', image: 'trastornos-del-sueno.svg', imageAlt: 'Nano sobre trastornos del sueño' },
    { title: 'Servicios preventivos para población clave', file: 'servicios-preventivos-poblacion-clave.pdf', image: 'servicios-preventivos.svg', imageAlt: 'Nano sobre servicios preventivos para población clave' },
    { title: 'Embarazo y partos saludables', file: 'embarazo-y-partos-saludables.pdf', image: 'embarazo-y-parto.svg', imageAlt: 'Nano sobre embarazo y parto saludables' },
    { title: 'Higiene para todas y todos', file: 'higiene-para-todas-y-todos.pdf', image: 'higiene.svg', imageAlt: 'Nano sobre higiene' },
    { title: 'Manejo y prevención de migrañas', file: 'prevencion-migranas.pdf', image: 'migranas.svg', imageAlt: 'Nano sobre prevención de migrañas' },
    { title: 'Prevención de enfermedades visuales', file: 'enfermedades-visuales.pdf', image: 'enfermedades-visuales.svg', imageAlt: 'Nano sobre prevención de enfermedades visuales' },
    { title: 'Previniendo depresiones y suicidios', file: 'depresion-y-suicidio.pdf', image: 'depresion-y-suicidio.svg', imageAlt: 'Nano sobre depresión y prevención del suicidio' },
    { title: 'Primeros auxilios', file: 'primeros-auxilios.pdf', image: 'primeros-auxilios.svg', imageAlt: 'Nano de primeros auxilios' },
    { title: 'Retos y desafíos de los adultos mayores', file: 'adultos-mayores.pdf', image: 'adultos-mayores.svg', imageAlt: 'Nano sobre salud de las personas adultas mayores' }
  ];

  readonly articles = [
    'Como digitalizar el seguimiento preventivo sin perder trazabilidad',
    'Buenas practicas para recordatorios medicos y adherencia',
    'Por que un mapa de servicios mejora el acceso a la atencion'
  ];

  readonly footerSocials: FooterSocial[] = [
    { label: 'Facebook', short: 'f' },
    { label: 'TikTok', short: 'tk' },
    { label: 'Instagram', short: 'ig' }
  ];

  readonly facebookUrl = 'https://www.facebook.com/share/1c3PBjZWn8/';
  readonly tiktokUrl = 'https://www.tiktok.com/@nica.primenic?_r=1&_d=f4hje9gg2eiici&sec_uid=MS4wLjABAAAAqpw0K7_GJmYTkt9o3ILzAXcRPvG-I1r3JNdO8XGeKJwjVIXnAeW_EbSktQGav4E9&share_author_id=7684035090063492112&sharer_language=es&source=h5_m&u_code=f5edlaehfbmc12&timestamp=1789164996&user_id=7684035090063492112&sec_user_id=MS4wLjABAAAAqpw0K7_GJmYTkt9o3ILzAXcRPvG-I1r3JNdO8XGeKJwjVIXnAeW_EbSktQGav4E9&item_author_type=1&utm_source=whatsapp&utm_campaign=client_share&utm_medium=android&share_iid=7682951855844181768&share_link_id=273ac7a0-207f-40a3-a67a-a3b12ddf8870&share_app_id=1233&ugbiz_name=ACCOUNT&ug_btm=b8727%2Cb7360&social_share_type=5&enable_checksum=1';
  readonly instagramUrl = 'https://www.instagram.com/nica.prime?stkn=MWtleGgzNWwwZTRnMw==';

  readonly footerSections: FooterSection[] = [
    {
      title: 'NICAPRIME',
      links: ['Inicio', 'Sobre nosotros', 'Servicios', 'App movil', 'Mapa de salud', 'Contacto']
    },
    {
      title: 'Producto',
      links: ['Expediente digital', 'Recordatorios', 'Seguimiento', 'Directorio']
    },
    {
      title: 'Soluciones',
      links: ['Pacientes', 'Familias', 'Profesionales', 'Instituciones']
    },
    {
      title: 'Recursos',
      links: ['Preguntas frecuentes', 'Demo', 'Roadmap', 'Contacto']
    }
  ];

  ngOnInit(): void {
    this.loadPublicDirectory();
  }

  ngAfterViewInit(): void {
    this.updateNicaraguaClock();
    this.clockTimer = setInterval(() => {
      this.updateNicaraguaClock();
    }, 30000);

    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }

    this.map?.remove();
    this.restorePageScroll();
  }

  toggleTheme(event?: MouseEvent): void {
    const nextTheme = !this.isDarkMode;

    if (
      typeof document === 'undefined'
      || typeof window === 'undefined'
      || typeof window.matchMedia !== 'function'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.isDarkMode = nextTheme;
      return;
    }

    const themedDocument = document as DocumentWithViewTransition;
    if (typeof themedDocument.startViewTransition !== 'function') {
      this.isDarkMode = nextTheme;
      return;
    }

    const x = event?.clientX ?? window.innerWidth - 56;
    const y = event?.clientY ?? 56;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    themedDocument.startViewTransition(() => {
      this.isDarkMode = nextTheme;
    }).ready.then(() => {
      const clip = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${radius}px at ${x}px ${y}px)`
      ];

      document.documentElement.animate(
        {
          clipPath: nextTheme ? clip : [...clip].reverse()
        },
        {
          duration: 550,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: nextTheme
            ? '::view-transition-new(root)'
            : '::view-transition-old(root)'
        }
      );
    }).catch(() => {
      this.isDarkMode = nextTheme;
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  openBenefitModal(benefit: { title: string; description: string; bullets: string[] }): void {
    this.selectedBenefit = benefit;
  }

  closeBenefitModal(): void {
    this.selectedBenefit = null;
  }

  openClinicGallery(point: MapPoint, imageIndex: number): void {
    this.selectedGallery = {
      title: point.name,
      images: point.images
    };
    this.selectedGalleryIndex = imageIndex;
    this.isGalleryZoomed = false;

    if (typeof document !== 'undefined') {
      this.previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  }

  closeClinicGallery(): void {
    this.selectedGallery = null;
    this.selectedGalleryIndex = 0;
    this.isGalleryZoomed = false;
    this.restorePageScroll();
  }

  showPreviousClinicImage(): void {
    if (!this.selectedGallery) {
      return;
    }

    this.selectedGalleryIndex = (
      this.selectedGalleryIndex - 1 + this.selectedGallery.images.length
    ) % this.selectedGallery.images.length;
    this.isGalleryZoomed = false;
  }

  showNextClinicImage(): void {
    if (!this.selectedGallery) {
      return;
    }

    this.selectedGalleryIndex = (
      this.selectedGalleryIndex + 1
    ) % this.selectedGallery.images.length;
    this.isGalleryZoomed = false;
  }

  selectClinicImage(index: number): void {
    this.selectedGalleryIndex = index;
    this.isGalleryZoomed = false;
  }

  toggleGalleryZoom(): void {
    this.isGalleryZoomed = !this.isGalleryZoomed;
  }

  @HostListener('document:keydown', ['$event'])
  handleGalleryKeyboard(event: KeyboardEvent): void {
    if (!this.selectedGallery) {
      return;
    }

    if (event.key === 'Escape') {
      this.closeClinicGallery();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.showPreviousClinicImage();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.showNextClinicImage();
    }
  }

  focusMapPoint(point: MapPoint): void {
    if (!this.map || point.lat === null || point.lng === null) {
      return;
    }

    const marker = this.markersById.get(point.id);

    this.map.flyTo([point.lat, point.lng], 10, {
      animate: true,
      duration: 1.2
    });

    marker?.openPopup();
  }

  private restorePageScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.previousBodyOverflow;
    }
  }

  private getInitialTheme(): boolean {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private initMap(): void {
    if (typeof window === 'undefined' || this.map) {
      return;
    }

    this.map = L.map('demo-map', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([12.8654, -85.2072], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.pointMarkers = L.layerGroup().addTo(this.map);

    this.renderDirectoryMarkers();
  }

  private renderDirectoryMarkers(): void {
    if (!this.map || !this.pointMarkers) {
      return;
    }

    this.pointMarkers.clearLayers();
    this.markersById.clear();
    const pointsWithLocation = this.mapPoints.filter(
      (point): point is MapPoint & { lat: number; lng: number } =>
        point.lat !== null && point.lng !== null
    );

    pointsWithLocation.forEach((point) => {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 8,
        weight: 2,
        color: '#ffffff',
        fillColor: this.getPointColor(point.status),
        fillOpacity: 0.95
      });

      marker.bindPopup(this.createPopupContent(point), {
        minWidth: 260,
        maxWidth: 340
      });

      marker.on('click', () => {
        this.map?.flyTo([point.lat, point.lng], 10, {
          animate: true,
          duration: 1
        });
      });

      this.markersById.set(point.id, marker);
      marker.addTo(this.pointMarkers!);
    });

    if (pointsWithLocation.length > 0) {
      const bounds = L.latLngBounds(
        pointsWithLocation.map((point) => [point.lat, point.lng])
      );
      this.map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12 });
    }
  }

  private getPointColor(status: string): string {
    switch (status) {
      case 'Activo':
        return '#4DAF51';
      case 'Inactivo':
        return '#EA5074';
      case 'Revision':
        return '#EA5074';
      case 'Proximamente':
        return '#4DAFE4';
      default:
        return '#4DAFE4';
    }
  }

  private loadPublicDirectory(): void {
    this.directoryLoading = true;
    this.directoryError = '';

    this.http.get<PublicInstitutionResponse[]>(
      `${this.getApiBaseUrl()}/institucionsalud/directorio/publico`
    ).pipe(
      finalize(() => {
        this.directoryLoading = false;
      })
    ).subscribe({
      next: (institutions) => {
        this.mapPoints = institutions.map((institution) => ({
          id: institution.id,
          name: institution.nombre,
          type: institution.tipo,
          description: institution.descripcion,
          address: [institution.direccion, institution.ciudad, institution.departamento]
            .filter(Boolean)
            .join(', '),
          phone: institution.telefono,
          email: institution.correo,
          website: institution.sitioWeb,
          hours: institution.horarioAtencion,
          lat: this.toFiniteNumber(institution.latitud),
          lng: this.toFiniteNumber(institution.longitud),
          status: institution.activo ? 'Activo' : 'Inactivo',
          services: institution.servicios ?? [],
          images: this.getClinicImages(institution.nombre)
        }));
        this.renderDirectoryMarkers();
      },
      error: () => {
        this.directoryError = 'No pudimos cargar el directorio en este momento.';
        this.mapPoints = [];
        this.renderDirectoryMarkers();
      }
    });
  }

  private getApiBaseUrl(): string {
    if (typeof document === 'undefined') {
      return '/api/v1';
    }

    const configuredUrl = document
      .querySelector<HTMLMetaElement>('meta[name="nica-api-base-url"]')
      ?.content.trim();
    return (configuredUrl || '/api/v1').replace(/\/$/, '');
  }

  private toFiniteNumber(value: number | null): number | null {
    if (value === null) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private getClinicImages(name: string): ClinicImage[] {
    const normalizedName = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const imageSet = normalizedName.includes('santiago')
      ? { folder: 'laboratorio-santiago', label: 'Laboratorio Bioanálisis Clínico Santiago' }
      : normalizedName.includes('san luis')
        ? { folder: 'clinica-san-luis', label: 'Clínica San Luis' }
        : null;

    return imageSet
      ? Array.from({ length: 4 }, (_, index) => ({
          src: `assets/clinicas/${imageSet.folder}/${String(index + 1).padStart(2, '0')}.jpeg`,
          alt: `${imageSet.label}, imagen ${index + 1} de 4`
        }))
      : [];
  }

  private createPopupContent(point: MapPoint): HTMLElement {
    const content = document.createElement('div');
    content.className = 'clinic-popup';

    const heading = document.createElement('div');
    heading.className = 'clinic-popup-heading';
    const title = document.createElement('strong');
    title.className = 'clinic-popup-title';
    title.textContent = point.name;
    const status = document.createElement('span');
    status.className = `clinic-popup-status ${point.status === 'Activo' ? 'is-active' : 'is-inactive'}`;
    status.textContent = point.status;
    heading.append(title, status);
    content.append(heading);

    const detail = document.createElement('p');
    detail.className = 'clinic-popup-address';
    detail.textContent = point.address || point.type;
    content.append(detail);

    if (point.description) {
      const description = document.createElement('p');
      description.className = 'clinic-popup-description';
      description.textContent = point.description;
      content.append(description);
    }

    const contactDetails = [
      point.phone ? `Teléfono: ${point.phone}` : null,
      point.email ? `Correo: ${point.email}` : null,
      point.hours ? `Horario: ${point.hours}` : null
    ].filter((item): item is string => Boolean(item));

    if (contactDetails.length > 0) {
      const contactList = document.createElement('ul');
      contactList.className = 'clinic-popup-contact';
      contactDetails.forEach((item) => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        contactList.append(listItem);
      });
      content.append(contactList);
    }

    if (point.images.length > 0) {
      const gallery = document.createElement('div');
      gallery.className = 'clinic-popup-gallery';
      point.images.forEach((clinicImage) => {
        const image = document.createElement('img');
        image.src = clinicImage.src;
        image.alt = clinicImage.alt;
        image.loading = 'lazy';
        gallery.append(image);
      });
      content.append(gallery);
    }

    if (point.services.length > 0) {
      const serviceTitle = document.createElement('strong');
      serviceTitle.className = 'clinic-popup-subtitle';
      serviceTitle.textContent = 'Servicios disponibles';
      const services = document.createElement('ul');
      services.className = 'clinic-popup-services';
      point.services.forEach((service) => {
        const item = document.createElement('li');
        const serviceName = document.createElement('strong');
        serviceName.textContent = service.nombre;
        item.append(serviceName);

        const metadata = [
          service.categoria,
          service.tiempoEntrega,
          service.precioReferencia !== null
            ? `${service.moneda || 'NIO'} ${service.precioReferencia.toLocaleString('es-NI')}`
            : null
        ].filter(Boolean).join(' · ');
        if (metadata) {
          const serviceMeta = document.createElement('span');
          serviceMeta.textContent = metadata;
          item.append(serviceMeta);
        }
        services.append(item);
      });
      content.append(serviceTitle, services);
    }

    return content;
  }

  private updateNicaraguaClock(): void {
    const now = new Date();

    this.currentNicaraguaTime = new Intl.DateTimeFormat('es-NI', {
      timeZone: 'America/Managua',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(now).replace(/\./g, '').toUpperCase();

    this.currentNicaraguaDate = new Intl.DateTimeFormat('es-NI', {
      timeZone: 'America/Managua',
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    }).format(now);
  }
}
