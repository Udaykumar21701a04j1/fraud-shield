import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, map } from 'rxjs';
import { Case } from '../../models/Case';
import { CasesService } from '../../services/Cases/cases-services';
import { CASE_STATUS } from '../../services/constants';
import { UsersService } from '../../services/Users/users-service';

@Component({
  selector: 'app-cases',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cases.html',
  styleUrls: ['./cases.css'],
})
export class Cases implements OnInit {

  public cases$!: Observable<Case[]>;
  public filteredCases$!: Observable<Case[]>;
  public availableInvestigators: any[] = [];
  public CASE_STATUS = CASE_STATUS;

  public availableStatuses = [
    CASE_STATUS.OPEN,
    CASE_STATUS.PENDING,
    CASE_STATUS.COMPLETED,
  ];

  // Filters
  public selectedInvestigator: number | 'ALL' = 'ALL';
  public selectedStatus: string | 'ALL' = 'ALL';

  // Editable fields
  public editingCaseId: string | null = null;
  public resolutionNotesInput = '';
  public statusInput: Case['status'] = CASE_STATUS.OPEN;
  public investigatorInput: number | null = null;
  public isFraudInput = false;

  constructor(
    public casesService: CasesService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.cases$ = this.casesService.allCases$;
    this.availableInvestigators = this.usersService.getInvestigators() || [];

    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredCases$ = this.cases$.pipe(
      map(cases => cases.filter(c => 
        (this.selectedInvestigator === 'ALL' || c.investigatorID === this.selectedInvestigator) &&
        (this.selectedStatus === 'ALL' || c.status === this.selectedStatus)
      ))
    );
  }

  updateInvestigatorFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedInvestigator = value === 'ALL' ? 'ALL' : Number(value);
    this.applyFilters();
  }

  updateStatusFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedStatus = value === 'ALL' ? 'ALL' : value;
    this.applyFilters();
  }

  startEdit(caseItem: Case): void {
    this.editingCaseId = caseItem.id ?? null;
    this.resolutionNotesInput = caseItem.resolutionNotes ?? '';
    this.statusInput = caseItem.status;
    this.investigatorInput = caseItem.investigatorID ?? null;
    this.isFraudInput = caseItem.isFraud ?? false;
  }

  cancelEdit(): void {
    this.editingCaseId = null;
    this.resetInputs();
  }

  private resetInputs(): void {
    this.resolutionNotesInput = '';
    this.statusInput = CASE_STATUS.OPEN;
    this.investigatorInput = null;
    this.isFraudInput = false;
  }

  saveEdit(): void {
    if (!this.editingCaseId) return;
    const caseId = this.editingCaseId;

    this.casesService.assignInvestigator(caseId, this.investigatorInput);
    this.casesService.updateCase(caseId, { status: this.statusInput });

    this.cancelEdit();
  }

  getInvestigatorName(id: number | null): string {
    
    if (id === null) return 'Unassigned';
    const inv = this.availableInvestigators.find(i => i.id == id);
    return inv ? inv.name : `ID ${id}`;
  }
}
