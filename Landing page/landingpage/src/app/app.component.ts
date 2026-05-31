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
    { id: 'sobre-nosotros', label: 'Lorem ipsum' },
    { id: 'servicios', label: 'Dolor sit' },
    { id: 'caracteristicas', label: 'Amet elit' },
    { id: 'app-movil', label: 'Consectetur' },
    { id: 'mapa', label: 'Adipiscing' },
    { id: 'precios', label: 'Tempor' },
    { id: 'contacto', label: 'Incididunt' },
    { id: 'faq', label: 'Quis autem' },
    { id: 'blog', label: 'Voluptatem' }
  ];

  readonly heroSignals = ['Lorem ipsum', 'Dolor sit', 'Amet elit', 'Sed do'];

  readonly mobileBenefits = ['Lorem ipsum', 'Dolor sit amet', 'Consectetur elit', 'Sed do eiusmod'];

  readonly heroStats: HeroStat[] = [
    { value: '24h', label: 'lorem ipsum dolor sit amet' },
    { value: '+42%', label: 'consectetur adipiscing elit' },
    { value: '3x', label: 'sed do eiusmod tempor' }
  ];

  readonly features = [
    {
      title: 'Agenda centralizada',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
    },
    {
      title: 'Lorem ipsum',
      description: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      title: 'Dolor sit amet',
      description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'
    }
  ];

  readonly mapPoints: MapPoint[] = this.generateMapPoints();

  readonly pricing = [
    {
      name: 'Basico',
      price: '$19',
      detail: 'Lorem ipsum dolor sit amet.',
      bullets: ['Lorem ipsum dolor', 'Sit amet elit', 'Consectetur adipiscing']
    },
    {
      name: 'Lorem',
      price: '$49',
      detail: 'Consectetur adipiscing elit sed do.',
      bullets: ['Eiusmod tempor', 'Incididunt ut labore', 'Magna aliqua']
    },
    {
      name: 'Ipsum',
      price: '$99',
      detail: 'Ut enim ad minim veniam.',
      bullets: ['Quis nostrud', 'Exercitation ullamco', 'Laboris nisi']
    }
  ];

  readonly faq = [
    {
      question: 'Lorem ipsum dolor sit amet?',
      answer: 'Consectetur adipiscing elit, sed do eiusmod tempor incididunt.'
    },
    {
      question: 'Quis autem vel eum iure?',
      answer: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco.'
    },
    {
      question: 'Sed ut perspiciatis unde?',
      answer: 'Duis aute irure dolor in reprehenderit in voluptate velit.'
    }
  ];

  readonly articles = [
    'Lorem ipsum dolor sit amet',
    'Consectetur adipiscing elit sed do',
    'Eiusmod tempor incididunt ut labore'
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
      links: ['Lorem ipsum', 'Dolor sit amet', 'Consectetur', 'Adipiscing elit', 'Sed do', 'Tempor']
    },
    {
      title: 'Lorem',
      links: ['Ipsum', 'Dolor', 'Amet']
    },
    {
      title: 'Ipsum',
      links: ['Consectetur', 'Adipiscing', 'Voluptatem', 'Accusantium']
    },
    {
      title: 'Dolor',
      links: ['Perspiciatis', 'Omnis iste', 'Natus error', 'Sit voluptatem', 'Aperiam']
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
    const pointStatuses = ['Lorem', 'Ipsum', 'Dolor'];
    const points: MapPoint[] = [];

    for (let index = 0; index < 8; index += 1) {
      const latSeed = this.seededValue(index + 1);
      const lngSeed = this.seededValue(index + 21);

      points.push({
        id: index + 1,
        name: `Lorem ${String(index + 1).padStart(2, '0')}`,
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
        return '#ff4d73';
      case 'Revision':
        return '#f49708';
      default:
        return '#2986bf';
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
