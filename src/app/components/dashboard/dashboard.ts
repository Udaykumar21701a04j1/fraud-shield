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

interface ClaimWithFlag extends Claim {
  isNew?: boolean; // flag for new claims
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  claims!: Observable<ClaimWithFlag[]>;
  allClaims: ClaimWithFlag[] = [];
  filteredClaims: ClaimWithFlag[] = [];

  searchQuery: string = '';
  selectedStatus: string = '';

  loading = false;
  status: StatusModel = { message: '', type: '' };

  violations: any[] = [];
  violationsCount = 0;

  totalClaims$!: Observable<number>;
  totalPendingClaims$!: Observable<number>;
  totalApprovedClaims$!: Observable<number>;
  totalRejectedClaims$!: Observable<number>;

  constructor(
    private claimsService: ClaimsService,
    private fraudRuleService: FraudRuleService,
  ) {}

  ngOnInit() {

    // Load Claims
    this.claimsService.getClaims().subscribe(claims => {
      // mark all existing claims as not new
      this.allClaims = claims.map(c => ({ ...c, isNew: false }));
      this.filteredClaims = [...this.allClaims];

      // Dashboard counters
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

    // Subscribe to claims changes to update filtered claims
    this.claimsService.claims$.subscribe((claims) => {
      // merge new claims
      const newClaims: ClaimWithFlag[] = claims.map(c => ({ ...c, isNew: c.isNew ?? false }));

      // prepend newly added claims
      const existingClaims = this.allClaims.filter(c => !c.isNew);
      this.allClaims = [...newClaims.filter(c => c.isNew), ...existingClaims];

      this.applyFilters();

      // Remove highlight after 5 seconds
      setTimeout(() => {
        this.allClaims = this.allClaims.map(c => ({ ...c, isNew: false }));
        this.applyFilters();
      }, 5000);
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
