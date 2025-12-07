import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";
import { UsersService } from '../../services/Users/users-service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  isCollapsed: boolean = false;

  constructor(private usersService: UsersService) {}

  

  logout(){
    this.usersService.logoutUser();
    window.location.reload();
  }

}
