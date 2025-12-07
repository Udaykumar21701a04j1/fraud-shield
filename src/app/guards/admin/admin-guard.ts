import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { UsersService } from '../../services/Users/users-service'; 
import { User } from '../../models/Users'; 

export const adminGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean | UrlTree => {
  const usersService = inject(UsersService);
  const router = inject(Router);

  const user: User | null = usersService.getLoggedInUser();
  

  // Not logged in ➜ redirect to login
  if (!user) {
    return router.createUrlTree(['/login']); 
  }

  // Logged in but not admin ➜ redirect to investigator
  if (user.role === 'investigator') {
    return router.createUrlTree(['/investigator']); 
  }

  // Admin ➜ allow
  return true;
};
