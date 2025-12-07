import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CasesService } from '../../services/Cases/cases-services';
import { InvestigatorService } from '../../services/Investigator/investigator-service';
import { Case } from '../../models/Case';
import { CASE_STATUS } from '../../services/constants';

@Component({
  selector: 'app-investigator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investigator.html',
  styleUrls: ['./investigator.css'],
})
export class Investigator implements OnInit, OnDestroy {

  allInvestigatorCases: Case[] = [];
  filteredCases: Case[] = [];

  selectedFilter: string = 'all';

  totalCases = 0;
  openCases = 0;
  pendingCases = 0;
  completedCases = 0;

    formData = {
    caseId: null as string | null,
    resolutionNotes: '',
    isFraud: false
    };


  logoutLabel = 'Logout';
  public CASE_STATUS = CASE_STATUS;

  private destroy$ = new Subject<void>();
  private casesService = inject(CasesService);
  private investigatorService = inject(InvestigatorService);

  constructor() {}

  ngOnInit(): void {
    this.investigatorService.getAssignedCases()
      .pipe(takeUntil(this.destroy$))
      .subscribe(cases => {
        this.allInvestigatorCases = cases;
        this.updateCounts();
        this.applyFilter(this.selectedFilter);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateCounts(): void {
    this.totalCases = this.allInvestigatorCases.length;
    this.openCases = this.allInvestigatorCases.filter(c => c.status === CASE_STATUS.OPEN).length;
    this.pendingCases = this.allInvestigatorCases.filter(c => c.status === CASE_STATUS.PENDING).length;
    this.completedCases = this.allInvestigatorCases.filter(c => c.status === CASE_STATUS.COMPLETED).length;
  }

  applyFilter(status: string): void {
    this.selectedFilter = status;
    this.filteredCases =
      status === 'all' ? this.allInvestigatorCases : this.allInvestigatorCases.filter(c => c.status === status);
  }

  acceptCase(caseId: string): void {
    this.casesService.updateCase(caseId, { status: CASE_STATUS.PENDING });
  }

  editCase(caseId: string): void {
    const caseItem = this.allInvestigatorCases.find(c => c.id === caseId);
    if (caseItem) {
      this.formData.caseId = caseItem.id ?? null;
      this.formData.resolutionNotes = caseItem.resolutionNotes ?? '';
      this.formData.isFraud = caseItem.isFraud ?? false;
    }
  }

  submitCase(): void {
    if (!this.formData.caseId) return;

    this.casesService.updateCaseAfterInvestigation(
      this.formData.caseId,
      this.formData.isFraud,
      this.formData.resolutionNotes
    );

    this.formData = { caseId: null, resolutionNotes: '', isFraud: false };
  }

  logout(): void {
    localStorage.removeItem('loggedInUser');
    window.location.href = '/login';
  }
}
