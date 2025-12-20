import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, AlertCircle, Home, RefreshCw, ChevronLeft } from 'lucide-angular';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EF4444] via-[#DC2626] to-[#991B1B] relative overflow-hidden">
      <!-- Animated Background -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="error-circle error-circle-1"></div>
        <div class="error-circle error-circle-2"></div>
        <div class="error-circle error-circle-3"></div>
      </div>

      <!-- Main Content -->
      <div class="relative z-10 text-center px-4 max-w-2xl">
        <!-- Error Icon -->
        <div class="mb-8 relative inline-block">
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="error-pulse"></div>
          </div>
          <div class="relative inline-flex items-center justify-center w-32 h-32 bg-white/10 backdrop-blur-xl rounded-full border-4 border-white/30">
            <lucide-angular 
              [img]="AlertCircle" 
              class="w-16 h-16 text-white shake-animation">
            </lucide-angular>
          </div>
        </div>

        <!-- Error Code -->
        <div class="text-9xl font-bold text-white/20 mb-4 animate-fade-in">
          {{ errorCode() }}
        </div>

        <!-- Title -->
        <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-delayed">
          {{ errorTitle() }}
        </h1>

        <!-- Description -->
        <p class="text-lg text-white/80 mb-8 animate-fade-in-delayed-2">
          {{ errorMessage() }}
        </p>

        <!-- Error Details (if any) -->
        <div *ngIf="errorDetails()" class="mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-left animate-fade-in-delayed-3">
          <p class="text-sm text-white/90 font-mono break-all">
            {{ errorDetails() }}
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-delayed-3">
          <button 
            (click)="goBack()"
            class="flex items-center gap-2 px-6 py-3 bg-white text-[#EF4444] rounded-lg font-semibold
                   hover:bg-white/90 transform hover:scale-105 transition-all duration-200">
            <lucide-angular [img]="ChevronLeft" class="w-5 h-5"></lucide-angular>
            Go Back
          </button>

          <button 
            (click)="goHome()"
            class="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold
                   border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-200">
            <lucide-angular [img]="Home" class="w-5 h-5"></lucide-angular>
            Go to Dashboard
          </button>
          
          <button 
            (click)="retry()"
            class="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold
                   border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-200">
            <lucide-angular [img]="RefreshCw" class="w-5 h-5"></lucide-angular>
            Try Again
          </button>
        </div>

        <!-- Help Text -->
       
  `,
  styles: [`
    .error-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      animation: float-error 15s infinite ease-in-out;
    }

    .error-circle-1 {
      width: 250px;
      height: 250px;
      top: -80px;
      left: -80px;
      animation-delay: 0s;
    }

    .error-circle-2 {
      width: 180px;
      height: 180px;
      bottom: -40px;
      right: -40px;
      animation-delay: 3s;
    }

    .error-circle-3 {
      width: 350px;
      height: 350px;
      top: 40%;
      left: 60%;
      animation-delay: 6s;
    }

    .error-pulse {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      animation: pulse-error 2s infinite;
    }

    .shake-animation {
      animation: shake 0.5s infinite;
    }

    @keyframes float-error {
      0%, 100% {
        transform: translate(0, 0) scale(1);
      }
      33% {
        transform: translate(20px, -20px) scale(1.05);
      }
      66% {
        transform: translate(-15px, 15px) scale(0.95);
      }
    }

    @keyframes pulse-error {
      0%, 100% {
        transform: scale(1);
        opacity: 0.8;
      }
      50% {
        transform: scale(1.2);
        opacity: 0;
      }
    }

    @keyframes shake {
      0%, 100% {
        transform: translateX(0);
      }
      25% {
        transform: translateX(-5px);
      }
      75% {
        transform: translateX(5px);
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.6s ease-out;
    }

    .animate-fade-in-delayed {
      animation: fadeIn 0.6s ease-out 0.2s both;
    }

    .animate-fade-in-delayed-2 {
      animation: fadeIn 0.6s ease-out 0.4s both;
    }

    .animate-fade-in-delayed-3 {
      animation: fadeIn 0.6s ease-out 0.6s both;
    }

    .animate-fade-in-delayed-4 {
      animation: fadeIn 0.6s ease-out 0.8s both;
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
export class ErrorPageComponent {
  readonly AlertCircle = AlertCircle;
  readonly Home = Home;
  readonly RefreshCw = RefreshCw;
  readonly ChevronLeft = ChevronLeft;

  errorCode = signal('404');
  errorTitle = signal('Oops! Something went wrong');
  errorMessage = signal('The page you\'re looking for doesn\'t exist or an error occurred.');
  errorDetails = signal('');

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Get error details from route params or query params
    this.route.queryParams.subscribe(params => {
      if (params['code']) this.errorCode.set(params['code']);
      if (params['title']) this.errorTitle.set(params['title']);
      if (params['message']) this.errorMessage.set(params['message']);
      if (params['details']) this.errorDetails.set(params['details']);
    });
  }

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  retry(): void {
    window.location.reload();
  }
}