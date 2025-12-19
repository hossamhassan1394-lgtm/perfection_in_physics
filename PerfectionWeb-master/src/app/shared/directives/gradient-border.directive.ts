import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[gradientBorder]',
  standalone: true
})
export class GradientBorderDirective implements OnInit {
  @Input() borderRadius = '12px';
  @Input() borderWidth = '2px';

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    const el = this.el.nativeElement;
    el.style.position = 'relative';
    el.style.borderRadius = this.borderRadius;
    el.style.padding = `calc(${this.borderWidth} + 1px)`;
    el.style.background =
      'linear-gradient(135deg, #6ee7ff, #a855f7, #22c55e)';
  }
}
