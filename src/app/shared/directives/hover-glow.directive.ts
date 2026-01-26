import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[hoverGlow]',
  standalone: true
})
export class HoverGlowDirective {
  @Input() glowColor = 'rgba(99,102,241,0.6)';

  constructor(private el: ElementRef) {}

  @HostListener('mouseenter')
  onEnter() {
    this.el.nativeElement.style.boxShadow = `0 0 20px ${this.glowColor}`;
  }

  @HostListener('mouseleave')
  onLeave() {
    this.el.nativeElement.style.boxShadow = 'none';
  }
}
