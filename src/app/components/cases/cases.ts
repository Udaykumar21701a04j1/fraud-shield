import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
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
  public availableInvestigators: any[] = [];

  public availableStatuses = [
    CASE_STATUS.OPEN,
    CASE_STATUS.PENDING,
    CASE_STATUS.COMPLETED,
  ];

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
    console.log(`Saving edits for case ${caseId}`);

    // 1. Update investigator
    this.casesService.assignInvestigator(caseId, this.investigatorInput);


    // 3. Update status if user changed manually
    this.casesService.updateCase(caseId, {
      status: this.statusInput,
    });

    this.cancelEdit();
  }

  getInvestigatorName(id: number | null): string {
    if (id === null) return 'Unassigned';
    const inv = this.availableInvestigators.find(i => i.id === id);
    return inv ? inv.name : `ID ${id}`;
  }
}
