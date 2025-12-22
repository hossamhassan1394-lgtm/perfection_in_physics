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

// Styled credits banner in console
try {
  const titleStyle = 'color: #ffffff; background: linear-gradient(90deg,#6b21a8,#8b5cf6); padding: 8px 12px; border-radius: 6px; font-weight: 700; font-size: 14px;';
  const nameStyle = 'color: #1f2937; font-weight: 600; font-size: 12px; padding-top:6px;';
  const infoStyle = 'color: #374151; font-size: 12px;';
  console.log('%cMade by', titleStyle);
  console.log('%cSaif Hegazy %c( Faculty of Computers And Data Science — Alexandria Uni )', nameStyle, infoStyle);
  console.log('%chttps://saifhegazy1.github.io/Portfolio', 'color:#2563eb; font-weight:600;');
  console.log('%c', '');
  console.log('%cHany Ayman %c( Faculty of Engineering — Computer Dept. Alexandria Uni )', nameStyle, infoStyle);
  console.log('%cwww.linkedin.com/in/hany-ayman-71708a357', 'color:#0ea5a4; font-weight:600;');
} catch (e) {
  // ignore console errors in very old browsers
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));