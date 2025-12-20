import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Database, RefreshCw } from 'lucide-angular';

@Component({
  selector: 'app-no-data',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-col items-center justify-center py-16 px-4">
      <!-- Icon -->
      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-32 h-32 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-2xl"></div>
        </div>
        <div class="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
          <lucide-angular [img]="Database" class="w-12 h-12 text-purple-500"></lucide-angular>
        </div>
      </div>

      <!-- Title -->
      <h3 class="text-2xl font-bold text-gray-800 mb-2">
        {{ title }}
      </h3>

      <!-- Message -->
      <p class="text-gray-600 text-center max-w-md mb-6">
        {{ message }}
      </p>

      <!-- Action Button (optional) -->
      <button 
        *ngIf="showRefreshButton"
        (click)="onRefresh()"
        class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold
               hover:shadow-lg transform hover:scale-105 transition-all duration-200">
        <lucide-angular [img]="RefreshCw" class="w-5 h-5"></lucide-angular>
        Refresh Data
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class NoDataComponent {
  readonly Database = Database;
  readonly RefreshCw = RefreshCw;

  @Input() title = 'No Data Available';
  @Input() message = 'There is no data to display at the moment. Please check back later or refresh the page.';
  @Input() showRefreshButton = true;
  @Input() onRefreshCallback?: () => void;

  onRefresh(): void {
    if (this.onRefreshCallback) {
      this.onRefreshCallback();
    } else {
      window.location.reload();
    }
  }
}