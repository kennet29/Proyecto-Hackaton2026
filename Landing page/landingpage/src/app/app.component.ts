/**
 * @file Landing page/landingpage/src/app/app.component.ts
 * @description TypeScript module implementation.
 */

import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  lat: number;
  lng: number;
  status: string;
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
export class AppComponent implements AfterViewInit, OnDestroy {
  readonly title = 'NICAPRIME';
  isDarkMode = this.getInitialTheme();
  isMobileMenuOpen = false;
  private map?: L.Map;
  private pointMarkers?: L.LayerGroup;
  private readonly markersById = new Map<number, L.CircleMarker>();
  private clockTimer?: ReturnType<typeof setInterval>;
  currentNicaraguaTime = '';
  currentNicaraguaDate = '';

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

  readonly mapPoints: MapPoint[] = this.generateMapPoints();

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
    if (!this.map) {
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

  private generateMapPoints(): MapPoint[] {
    const pointStatuses = ['Activo', 'Revision', 'Proximamente'];
    const pointNames = [
      'Managua Central',
      'Leon Norte',
      'Esteli Red',
      'Matagalpa Clinico',
      'Jinotega Comunitario',
      'Chinandega Integral',
      'Masaya Preventivo',
      'Granada Familiar'
    ];
    const points: MapPoint[] = [];

    for (let index = 0; index < 8; index += 1) {
      const latSeed = this.seededValue(index + 1);
      const lngSeed = this.seededValue(index + 21);

      points.push({
        id: index + 1,
        name: pointNames[index],
        lat: 11.15 + (latSeed * 2.2),
        lng: -87.35 + (lngSeed * 3.25),
        status: pointStatuses[index % pointStatuses.length]
      });
    }

    return points;
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

    this.mapPoints.forEach((point) => {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 8,
        weight: 2,
        color: '#ffffff',
        fillColor: this.getPointColor(point.status),
        fillOpacity: 0.95
      });

      marker.bindPopup(`
        <strong>${point.name}</strong><br />
        Estado: ${point.status}
      `);

      marker.on('click', () => {
        this.map?.flyTo([point.lat, point.lng], 10, {
          animate: true,
          duration: 1
        });
      });

      this.markersById.set(point.id, marker);
      marker.addTo(this.pointMarkers!);
    });
  }

  private getPointColor(status: string): string {
    switch (status) {
      case 'Activo':
        return '#4DAF51';
      case 'Revision':
        return '#EA5074';
      case 'Proximamente':
        return '#4DAFE4';
      default:
        return '#4DAFE4';
    }
  }

  private seededValue(seed: number): number {
    const value = Math.sin(seed * 999) * 10000;
    return value - Math.floor(value);
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
