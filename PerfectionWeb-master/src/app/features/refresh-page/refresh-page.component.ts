import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, RefreshCw, Home } from 'lucide-angular';

@Component({
  selector: 'app-refresh-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667EEA] via-[#6B46C1] to-[#319795] relative overflow-hidden">
      <!-- Animated Background Circles -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>

      <!-- Main Content -->
      <div class="relative z-10 text-center px-4">
        <!-- Animated Refresh Icon -->
        <div class="mb-8 relative">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="pulse-ring"></div>
          </div>
          <div class="relative inline-flex items-center justify-center w-32 h-32 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
            <lucide-angular 
              [img]="RefreshCw" 
              class="w-16 h-16 text-white spin-animation">
            </lucide-angular>
          </div>
        </div>

        <!-- Title -->
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
          {{ isRefreshing() ? 'Refreshing...' : 'Page Refreshed' }}
        </h1>

        <!-- Description -->
        <p class="text-lg text-white/80 mb-8 animate-fade-in-delayed">
          {{ isRefreshing() ? 'Updating your data...' : 'Your data has been updated successfully' }}
        </p>

        <!-- Progress Bar -->
        <div *ngIf="isRefreshing()" class="w-full max-w-md mx-auto mb-8">
          <div class="h-2 bg-white/20 rounded-full overflow-hidden">
            <div class="h-full bg-white/80 animate-progress"></div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delayed-2">
          <button 
            (click)="goHome()"
            class="flex items-center gap-2 px-6 py-3 bg-white text-[#667EEA] rounded-lg font-semibold
                   hover:bg-white/90 transform hover:scale-105 transition-all duration-200">
            <lucide-angular [img]="Home" class="w-5 h-5"></lucide-angular>
            Go to Dashboard
          </button>
          
          <button 
            (click)="refreshAgain()"
            [disabled]="isRefreshing()"
            class="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold
                   border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            <lucide-angular [img]="RefreshCw" class="w-5 h-5"></lucide-angular>
            Refresh Again
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 20s infinite ease-in-out;
    }

    .circle-1 {
      width: 300px;
      height: 300px;
      top: -100px;
      left: -100px;
      animation-delay: 0s;
    }

    .circle-2 {
      width: 200px;
      height: 200px;
      bottom: -50px;
      right: -50px;
      animation-delay: 5s;
    }

    .circle-3 {
      width: 400px;
      height: 400px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: 10s;
    }

    .pulse-ring {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      animation: pulse 2s infinite;
    }

    .spin-animation {
      animation: spin 2s linear infinite;
    }

    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) scale(1);
      }
      33% {
        transform: translate(30px, -30px) scale(1.1);
      }
      66% {
        transform: translate(-20px, 20px) scale(0.9);
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.3);
        opacity: 0;
      }
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes progress {
      0% {
        width: 0%;
      }
      100% {
        width: 100%;
      }
    }

    .animate-progress {
      animation: progress 3s ease-out forwards;
    }

    .animate-fade-in {
      animation: fadeIn 0.6s ease-out;
    }

    .animate-fade-in-delayed {
      animation: fadeIn 0.6s ease-out 0.3s both;
    }

    .animate-fade-in-delayed-2 {
      animation: fadeIn 0.6s ease-out 0.6s both;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class RefreshPageComponent implements OnInit {
  readonly RefreshCw = RefreshCw;
  readonly Home = Home;

  isRefreshing = signal(true);

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Simulate refresh completion after 3 seconds
    setTimeout(() => {
      this.isRefreshing.set(false);
    }, 3000);
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  refreshAgain(): void {
    this.isRefreshing.set(true);
    window.location.reload();
  }
}