import { Injectable } from '@angular/core';
import { User } from '../../models/Users';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom,Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private users:User[] = [];
  private apiUrl = 'http://localhost:3000/User'; 
  private loggedInUser: User | null = null;

  constructor(private router: Router, private http: HttpClient) {
    this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    try {
      // Use HttpClient and convert the Observable to a Promise
      const usersObservable = this.http.get<User[]>(this.apiUrl);
      this.users = await lastValueFrom(usersObservable);
      console.log('Users loaded:', this.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Handle error (e.g., set a flag or load fallback data)
    }
  }

  validateUser(email: string, password: string): User | null {
    const user = this.users.find(
      u => u.email === email && u.password === password
    );
    return user ? user : null;
  }

  getAllUsers(): User[] {
    return this.users;
  }

  getInvestigators(){
    return this.users.filter(user=>user.role==="investigator");
  }

  addUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  deleteUser(email: string): boolean {
    const index = this.users.findIndex(u => u.email === email);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }

  getLoggedInUser(): User | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userJson = localStorage.getItem('loggedInUser');
      if (userJson) {
        try {
          return JSON.parse(userJson) as User;
        } catch (e) {
          console.error('Failed to parse loggedInUser from storage', e);
          return null;
        }
      }
    }
    return null;
  }



  logoutUser(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('loggedInUser');
    }
    this.router.navigateByUrl('/login');
  }
}
