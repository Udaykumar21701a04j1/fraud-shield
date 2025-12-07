import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Admin } from './components/admin/admin';
import { Investigator } from './components/investigator/investigator';
import { Register } from './components/register/register';
import { FraudAndCompalinceDashboard } from './components/reports/report';
import { adminGuard } from './guards/admin/admin-guard';
import { investigatorGuard } from './guards/investigator/investigator-guard';
import { Dashboard } from './components/dashboard/dashboard';
import { RuleManagement } from './components/rule-management/rule-management';
import { Cases } from './components/cases/cases';

export const routes: Routes = [
    {
        path:'', component:Login
    },
    {
        path:'login', component:Login
    },
    {
        path:'register', component:Register
    },
    {
        path:'admin',component:Admin,
        children: [
            {path: '', component: Dashboard},
            {path:'report',component:FraudAndCompalinceDashboard},
            {path:'rule-management',component:RuleManagement},
            {path:'cases',component:Cases}
        ],
        canActivate: [adminGuard]

    },
    {
        path:'investigator',component:Investigator,
        canActivate:[investigatorGuard]
    },
    {
        path:'fraud-dashboard',component:FraudAndCompalinceDashboard
    }
];