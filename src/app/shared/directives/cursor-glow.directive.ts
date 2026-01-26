import {
  Directive,
  Renderer2,
  HostListener,
  OnInit,
  OnDestroy
} from '@angular/core';

@Directive({
  selector: '[appCursorGlow]',
  standalone: true
})
export class CursorGlowDirective implements OnInit, OnDestroy {
  private glow!: HTMLElement;

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    // Create glow element
    this.glow = this.renderer.createElement('div');
    
    // Set styles
    this.renderer.setStyle(this.glow, 'position', 'fixed');
    this.renderer.setStyle(this.glow, 'width', '120px');
    this.renderer.setStyle(this.glow, 'height', '120px');
    this.renderer.setStyle(this.glow, 'borderRadius', '30%');
    this.renderer.setStyle(
      this.glow,
      'background',
      'radial-gradient(circle, rgba(166, 19, 19, 0.97), rgba(231, 125, 20, 0.87), transparent 70%)'
    );
    this.renderer.setStyle(this.glow, 'pointerEvents', 'none');
    this.renderer.setStyle(this.glow, 'filter', 'blur(60px)');
    this.renderer.setStyle(this.glow, 'transform', 'translate(-50%, -50%)');
    this.renderer.setStyle(this.glow, 'opacity', '0');
    this.renderer.setStyle(this.glow, 'transition', 'opacity 300ms ease');
    this.renderer.setStyle(this.glow, 'zIndex', '5');
    this.renderer.setStyle(this.glow, 'mixBlendMode', 'screen');
    
    // Append to body
    this.renderer.appendChild(document.body, this.glow);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    this.renderer.setStyle(this.glow, 'left', `${event.clientX}px`);
    this.renderer.setStyle(this.glow, 'top', `${event.clientY}px`);
    this.renderer.setStyle(this.glow, 'opacity', '1');
  }

  @HostListener('document:mouseleave')
  onMouseLeave() {
    this.renderer.setStyle(this.glow, 'opacity', '0');
  }

  ngOnDestroy() {
    if (this.glow) {
      this.renderer.removeChild(document.body, this.glow);
    }
  }
}