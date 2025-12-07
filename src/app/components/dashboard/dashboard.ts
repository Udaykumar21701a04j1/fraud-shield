import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClaimsService } from '../../services/Claims/claims-service';
import { Claim } from '../../models/Claim';
import { Observable } from 'rxjs';
import { FraudRuleService } from '../../services/FraudRule/fraud-rule-service';
import { FormsModule } from '@angular/forms';

interface StatusModel {
  message: string;
  type: 'success' | 'error' | 'info' | '';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  claims!: Observable<Claim[]>;
  allClaims: Claim[] = [];
  filteredClaims: Claim[] = [];

  searchQuery: string = '';
  selectedStatus: string = '';

  loading = false;
  status: StatusModel = { message: '', type: '' };

  violations: any[] = [];
  violationsCount = 0;

  totalClaims$!: Observable<number>;
  totalPendingClaims$!: Observable<number>
  totalApprovedClaims$!: Observable<number>;
  totalRejectedClaims$!: Observable<number>;

  constructor(
    private claimsService: ClaimsService,
    private fraudRuleService: FraudRuleService,
  ) {}

  ngOnInit() {

    // Load Claims
      this.claimsService.getClaims().subscribe(claims => {
      this.allClaims = claims;
      this.filteredClaims = [...this.allClaims]; // default

    // Load Dashboard Counters
      this.totalClaims$ = this.claimsService.totalClaims$;
      this.totalPendingClaims$ = this.claimsService.totalPendingClaims$;
      this.totalApprovedClaims$ = this.claimsService.totalApprovedClaims$;
      this.totalRejectedClaims$ = this.claimsService.totalRejectedClaims$;
    });

    // Load Violations
    this.fraudRuleService.getRuleViolations().subscribe(data => {
      this.violations = data;
      this.violationsCount = data.length;
    });
  }

  /** MAIN FILTER FUNCTION */
  applyFilters() {
    const query = this.searchQuery.toLowerCase().trim();

    this.filteredClaims = this.allClaims.filter(claim => {

      const matchesSearch =
        claim.ClaimID.toLowerCase().includes(query) ||
        claim.PolicyID.toLowerCase().includes(query) ||
        claim.PolicyHolderID.toLowerCase().includes(query) ||
        claim.HospitalName.toLowerCase().includes(query);

      const matchesStatus =
        !this.selectedStatus || claim.Status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  /** RESET FILTERS */
  resetFilters() {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.filteredClaims = [...this.allClaims];
  }
}
