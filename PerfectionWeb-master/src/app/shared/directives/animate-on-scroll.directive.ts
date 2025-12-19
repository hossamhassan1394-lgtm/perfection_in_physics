import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[animateOnScroll]',
  standalone: true
})
export class AnimateOnScrollDirective implements OnInit {
  @Input() animationClass = 'animate-in';
  @Input() threshold = 0.2;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.el.nativeElement.classList.add(this.animationClass);
          observer.unobserve(this.el.nativeElement);
        }
      });
    }, { threshold: this.threshold });

    observer.observe(this.el.nativeElement);
  }
}
