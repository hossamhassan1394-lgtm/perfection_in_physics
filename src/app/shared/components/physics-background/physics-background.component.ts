import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: 'electron' | 'wave' | 'spark';
  color: string;
  opacity: number;
}

@Component({
  selector: 'app-physics-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <canvas 
      #canvas
      class="absolute inset-0 w-full h-full pointer-events-none"
      [attr.width]="width"
      [attr.height]="height">
    </canvas>
  `,
  styles: []
})
export class PhysicsBackgroundComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationId: number | null = null;
  
  width = 0;
  height = 0;

  private colors = {
    electron: ['#667EEA', '#4FD1C5', '#9F7AEA'],
    wave: ['#ED64A6', '#F6AD55'],
    spark: ['#68D391', '#FBBF24']
  };

  ngOnInit(): void {
    this.initCanvas();
    this.createParticles();
    this.animate();
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.handleResize);
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.updateCanvasSize();
  }

  private handleResize = (): void => {
    this.updateCanvasSize();
    this.createParticles();
  };

  private updateCanvasSize(): void {
    const canvas = this.canvasRef.nativeElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    canvas.width = this.width;
    canvas.height = this.height;
  }

  private createParticles(): void {
    this.particles = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const types: Array<'electron' | 'wave' | 'spark'> = ['electron', 'wave', 'spark'];
      const type = types[Math.floor(Math.random() * types.length)];
      const colorArray = this.colors[type];
      
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        type,
        color: colorArray[Math.floor(Math.random() * colorArray.length)],
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  }

  private animate = (): void => {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Update and draw particles
    this.particles.forEach(particle => {
      this.updateParticle(particle);
      this.drawParticle(particle);
    });

    // Draw connections between nearby particles
    this.drawConnections();

    this.animationId = requestAnimationFrame(this.animate);
  };

  private updateParticle(particle: Particle): void {
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Wrap around screen edges
    if (particle.x < 0) particle.x = this.width;
    if (particle.x > this.width) particle.x = 0;
    if (particle.y < 0) particle.y = this.height;
    if (particle.y > this.height) particle.y = 0;
  }

  private drawParticle(particle: Particle): void {
    this.ctx.save();
    this.ctx.globalAlpha = particle.opacity;
    this.ctx.fillStyle = particle.color;

    switch (particle.type) {
      case 'electron':
        // Draw glowing circle
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.globalAlpha = particle.opacity * 0.3;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'wave':
        // Draw sine wave trail
        this.ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const x = particle.x - i * 2;
          const y = particle.y + Math.sin(i * 0.5) * particle.size;
          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = particle.size * 0.5;
        this.ctx.stroke();
        break;

      case 'spark':
        // Draw square particle
        this.ctx.fillRect(
          particle.x - particle.size / 2,
          particle.y - particle.size / 2,
          particle.size,
          particle.size
        );
        break;
    }

    this.ctx.restore();
  }

  private drawConnections(): void {
    const maxDistance = 150;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const p1 = this.particles[i];
        const p2 = this.particles[j];

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.15;
          
          this.ctx.save();
          this.ctx.globalAlpha = opacity;
          this.ctx.strokeStyle = '#4FD1C5';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
    }
  }
}