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

// Styled credits banner in console — high-contrast for both light and dark DevTools themes
try {
  const titleStyle = 'color: #ffffff; background: linear-gradient(90deg,#6b21a8,#8b5cf6); padding: 8px 12px; border-radius: 6px; font-weight: 800; font-size: 13px;';
  const pillStyle = 'background: #f3f4f6; color: #0f172a; padding: 6px 10px; border-radius: 6px; font-weight: 700; font-size: 12px;';
  const pillStyleDarkFallback = 'background: #0b1220; color: #e6eef8; padding: 6px 10px; border-radius: 6px; font-weight: 700; font-size: 12px;';
  const infoStyle = 'color: #94a3b8; font-size: 12px;';
  const linkBlue = 'color:#2563eb; font-weight:700; text-decoration: underline;';
  const linkTeal = 'color:#0ea5a4; font-weight:700; text-decoration: underline;';

  // Title
  console.log('%cMade by', titleStyle);

  // Saif
  // try light pill first then plain text fallback (some consoles ignore background in dark theme)
  console.log('%c Saif Hegazy %c ( Faculty of Computers And Data Science — Alexandria Uni )', pillStyle, infoStyle);
  console.log('%chttps://saifhegazy1.github.io/Portfolio', linkBlue);

  // Spacer
  console.log('%c', '');

  // Hany
  console.log('%c Hany Ayman %c ( Faculty of Engineering — Computer Dept. Alexandria Uni )', pillStyle, infoStyle);
  console.log('%chttps://www.linkedin.com/in/hany-ayman-71708a357', linkTeal);
} catch (e) {
  // ignore console styling errors in old or restricted consoles
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));