import { Component, signal } from '@angular/core';
import { Login } from './components/login/login';
import { RouterOutlet } from '@angular/router';
import { Register } from './components/register/register';
import { Sidebar, } from './components/sidebar/sidebar';
import { RuleManagement } from './components/rule-management/rule-management';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet,RuleManagement],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('FraudShield');
}
