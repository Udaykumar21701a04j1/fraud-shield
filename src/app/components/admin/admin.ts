import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from "@angular/router";
import { UsersService } from '../../services/Users/users-service';
import { Sidebar } from '../sidebar/sidebar';
import { FraudRuleService } from '../../services/FraudRule/fraud-rule-service';
import { CommonModule, NgIf } from '@angular/common';
import { ClaimsService } from '../../services/Claims/claims-service';
import { Observable } from 'rxjs';
import { Claim } from '../../models/Claim';
import { FormsModule } from '@angular/forms';
import { PatternAnalysis } from '../../services/PatternAnalysis/pattern-analysis';
import { CasesService } from '../../services/Cases/cases-services';
import { Case } from '../../models/Case';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [Sidebar, RouterOutlet, CommonModule, FormsModule, NgIf],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class Admin implements OnInit {

  claims$: Observable<Claim[]>;
  cases$: Observable<Case[]>;

  loading = false;
  status = { message: '', type: '' };

  selectedCase: Case | null = null;
  investigatorID: number | null = null;
  resolutionNotes = '';
  isFraud: boolean | null = null;

  constructor(
    private usersService: UsersService,
    private router: Router,
    private fraudRuleService: FraudRuleService,
    private claimsService: ClaimsService,
    private patternAnalysis: PatternAnalysis,
    private casesService: CasesService
  ) {
    this.claims$ = this.claimsService.getClaims();
    this.cases$ = this.casesService.allCases$;
  }

  ngOnInit(): void { }

  /** ----------------------------
   *  EXCEL UPLOAD & RULE ANALYSIS
   * ---------------------------- */
  async onFileSelected(event: any) {
    const file: File = event.target.files?.[0];

    if (!file) {
      this.status = { message: 'Please select a file.', type: 'info' };
      return;
    }

    this.loading = true;
    this.status = { message: '', type: '' };

    try {
      const newClaims = await this.claimsService.parseExcelFile(file);

      // Store new claims in JSON server
      this.claimsService.addClaims(newClaims);

      // --------------------------------------------
      // 🔥 APPLY FRAUD RULES USING AUTO-REFRESH RULES$
      // --------------------------------------------
      this.fraudRuleService.rules$.subscribe(rules => {
        this.fraudRuleService.applyRules(newClaims, rules);
      });

      this.patternAnalysis.analyzePatterns(newClaims);

      this.status = {
        message: `Imported ${newClaims.length} claims successfully.`,
        type: 'success'
      };

    } catch (err) {
      this.status = { message: 'Failed to process Excel file.', type: 'error' };
    } finally {
      this.loading = false;
    }
  }

  /** ----------------------------
   *   CASE OPERATIONS
   * ----------------------------- */

  openAssignModal(c: Case) {
    this.selectedCase = c;
    this.investigatorID = c.investigatorID;
  }

  saveInvestigator() {
    if (this.selectedCase) {
      this.casesService.assignInvestigator(this.selectedCase.id!, this.investigatorID);
      this.selectedCase = null;
    }
  }

  openCompleteModal(c: Case) {
    this.selectedCase = c;
    this.resolutionNotes = c.resolutionNotes || '';
    this.isFraud = c.isFraud;
  }

  completeInvestigation() {
    if (this.selectedCase && this.isFraud !== null) {
      this.casesService.updateCaseAfterInvestigation(
        this.selectedCase.id!,
        this.isFraud,
        this.resolutionNotes
      );

      this.selectedCase = null;
    }
  }

  /** Logout */
  logout() {
    this.usersService.logoutUser();
    this.router.navigateByUrl('/login');
  }
}
