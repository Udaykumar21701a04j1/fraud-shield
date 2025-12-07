import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app'; 
import 'zone.js';

// Pass the single, complete configuration object (appConfig)
bootstrapApplication(App, appConfig) 
  .catch((err) => console.error(err));