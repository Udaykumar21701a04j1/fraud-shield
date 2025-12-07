import { Component, signal, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
'@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../services/Users/users-service';
import { User } from '../../models/Users';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly router = inject(Router);

  loginForm!: FormGroup;

  authStatus = signal<{ success: boolean; message: string } | null>(null);

  private readonly passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(this.passwordRegex)]]
    });

    // Redirect already logged-in user
    const loggedUser = this.usersService.getLoggedInUser();
    console.log('Logged-in user on init:', loggedUser);

    if (loggedUser) {
      loggedUser.role === 'admin'
        ? this.router.navigateByUrl('/admin')
        : this.router.navigateByUrl('/investigator');
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.authStatus.set({
        success: false,
        message: 'Please resolve the highlighted errors.',
      });
      return;
    }

    const { email, password } = this.loginForm.value;
    const user = this.usersService.validateUser(email, password);

    if (user) {
      this.authStatus.set({
        success: true,
        message: `Logged in successfully as ${user.role}.`,
      });

      localStorage.setItem('loggedInUser', JSON.stringify(user));
      this.loginForm.reset();

      user.role === 'admin'
        ? this.router.navigateByUrl('/admin')
        : this.router.navigateByUrl('/investigator');

    } else {
      this.authStatus.set({
        success: false,
        message: 'Invalid credentials.',
      });
    }
  }
}