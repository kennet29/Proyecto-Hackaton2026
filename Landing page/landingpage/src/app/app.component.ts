/**
 * @file Landing page/landingpage/src/app/app.component.ts
 * @description TypeScript module implementation.
 */

import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import * as L from 'leaflet';

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
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly title = 'NICAPRIME';
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

  constructor(private readonly http: HttpClient) {}

  readonly navSections: NavSection[] = [
    { id: 'sobre-nosotros', label: 'Sobre nosotros' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'caracteristicas', label: 'Funciones' },
    { id: 'app-movil', label: 'App movil' },
    { id: 'mapa', label: 'Mapa de salud' },
    { id: 'precios', label: 'Planes' },
    { id: 'contacto', label: 'Contacto' },
    { id: 'faq', label: 'Preguntas' },
    { id: 'blog', label: 'Recursos' }
  ];

  readonly heroSignals = ['Expediente seguro', 'Recordatorios', 'Mapa de clinicas', 'Seguimiento preventivo'];

  readonly mobileBenefits = ['Agenda medica', 'Control cronico', 'Alertas inteligentes', 'Acceso familiar'];

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
      name: 'Piloto',
      price: '-',
      detail: 'Ideal para validar el flujo principal con equipos pequenos.',
      bullets: ['Acceso web', 'Mapa de servicios', 'Demo funcional']
    },
    {
      name: 'Profesional',
      price: '-',
      detail: 'Pensado para atencion individual y seguimiento frecuente.',
      bullets: ['Agenda y recordatorios', 'Expediente digital', 'Reportes de seguimiento']
    },
    {
      name: 'Institucional',
      price: '-',
      detail: 'Para clinicas, programas comunitarios y equipos multidisciplinarios.',
      bullets: ['Usuarios y roles', 'Panel administrativo', 'Implementacion guiada']
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

  readonly articles = [
    'Como digitalizar el seguimiento preventivo sin perder trazabilidad',
    'Buenas practicas para recordatorios medicos y adherencia',
    'Por que un mapa de servicios mejora el acceso a la atencion'
  ];

  readonly footerSocials: FooterSocial[] = [
    { label: 'Facebook', short: 'f' },
    { label: 'Twitter', short: 't' },
    { label: 'Google Plus', short: 'g+' },
    { label: 'YouTube', short: 'yt' },
    { label: 'Instagram', short: 'ig' },
    { label: 'LinkedIn', short: 'in' },
    { label: 'VK', short: 'vk' }
  ];

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
          services: institution.servicios ?? []
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
