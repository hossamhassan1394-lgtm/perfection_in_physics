import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Suppress development-only browser warnings for cleaner console
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || '';
  
  // List of warnings to suppress (browser security warnings in development)
  const suppressPatterns = [
    'Cookie',
    'SameSite',
    'Partitioned',
    'iframe',
    'sandbox',
    'allow-scripts',
    'allow-same-origin',
    'cross-site',
    'third-party'
  ];
  
  // Check if this warning should be suppressed
  const shouldSuppress = suppressPatterns.some(pattern => 
    message.includes(pattern)
  );
  
  if (shouldSuppress) {
    return; // Don't show these warnings
  }
  
  // Show all other warnings
  originalWarn.apply(console, args);
};

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));