import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
    LucideAngularModule,
    LogOut,
    Settings
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-top-nav',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './top-nav.component.html',
    styleUrls: ['./top-nav.component.scss']
})
export class TopNavComponent {

    // Icons
    LogOut = LogOut;
    Settings = Settings;

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}