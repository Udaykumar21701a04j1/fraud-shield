import { CanActivateFn,Router } from '@angular/router';
import { inject } from '@angular/core';
import { UsersService } from '../../services/Users/users-service'; 
import { User } from '../../models/Users'; 

export const investigatorGuard: CanActivateFn = (route, state) => {
  const usersService = inject(UsersService);
  const router = inject(Router);

  const user: User | null = usersService.getLoggedInUser();
  


  if (!user) {
    return router.createUrlTree(['/login']); 
  }

  
  if (user.role === 'admin') {
    return router.createUrlTree(['/investigator']); 
  }

  return true;
};
