import { Component, signal, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../services/Users/users-service';
import { RouterLink } from "@angular/router";
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register implements OnInit {

  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private router = inject(Router);

  registerForm!: FormGroup;
  registerStatus = signal<{ success: boolean; message: string } | null>(null);

  private readonly passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  ngOnInit() {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      password: ['', [Validators.required, Validators.pattern(this.passwordRegex)]],
    });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.registerStatus.set({
        success: false,
        message: 'Please resolve the highlighted errors.',
      });
      return;
    }

    const newUser = this.registerForm.value;
   
    this.usersService.addUser({
      id: Date.now(),
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role
    }).subscribe({
      next: (res) => {
        console.log("User added:", res);
      },
      error: (err) => {
        console.error("Error adding user:", err);
      }
    });


    this.registerStatus.set({
      success: true,
      message: `Registration successful! Welcome ${newUser.name} (${newUser.role}).`,
    });
    this.router.navigate(['/login']);

    this.registerForm.reset();
  }

  logout() {
    this.usersService.logoutUser();
  }
  
}
