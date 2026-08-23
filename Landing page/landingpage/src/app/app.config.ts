/**
 * @file Landing page/landingpage/src/app/app.config.ts
 * @description TypeScript module implementation.
 */

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes) ]
};
