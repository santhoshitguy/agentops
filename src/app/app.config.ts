import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { AgentStore } from './core/store/agent.store';

export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Core Performance (Zoneless Optimization)
    // provideZoneChangeDetection({ eventCoalescing: true }),
    // 2. Global Error Listeners
    provideBrowserGlobalErrorListeners(),
    //3.  Optimized HTTP (Using Fetch API for streaming)
    provideHttpClient(withFetch()),
    // 4. Global State (AgentStore available everywhere)
    AgentStore,
    // 5. Modern Routing (Enables smooth AI-dashboard transitions)
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),

    // 6. Animations (Required by ngx-charts)
    provideAnimationsAsync()
  ]
};
