/**
 * @file Landing page/landingpage/src/app/app.component.spec.ts
 * @description TypeScript module implementation.
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [AppComponent],
    providers: [provideHttpClient(), provideHttpClientTesting()]
  }));

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  function flushDirectory(): void {
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/institucionsalud/directorio/publico')
      .flush([]);
  }

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    flushDirectory();
    expect(app).toBeTruthy();
  });

  it(`should have the 'NICAPRIME' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    flushDirectory();
    expect(app.title).toEqual('NICAPRIME');
  });

  it('should render the main heading', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    flushDirectory();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Cuida tu salud hoy');
  });
});
