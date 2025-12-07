import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Case } from '../../models/Case';
import { RiskScore } from '../../models/RiskScore';
import { CASE_STATUS, CLAIM_STATUS } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class CasesService {
  private casesApi = 'http://localhost:3000/Cases';
  private casesSubject = new BehaviorSubject<Case[]>([]);
  public allCases$ = this.casesSubject.asObservable();

  private nextCaseId = 1000;

  constructor(private http: HttpClient) {
    this.loadCases();
  }

  private loadCases() {
    this.http.get<Case[]>(this.casesApi).subscribe({
      next: (cases) => {
        this.casesSubject.next(cases || []);
        const max = (cases || []).reduce((m, c) => (c.caseID > m ? c.caseID : m), 1000);
        this.nextCaseId = max + 1;
      },
      error: (e) => console.error('Error loading cases:', e),
    });
  }

  /**
   * Create cases for HIGH risk scores.
   * Ensures we don't duplicate cases for same claimID.
   */
  createCasesForHighRisk(riskScores: RiskScore[]) {
    if (!riskScores || riskScores.length === 0) return;

    this.http.get<Case[]>(this.casesApi).subscribe({
      next: (existingCases) => {
        const existingClaimIDs = new Set((existingCases || []).map((c) => c.claimID));

        const posts = [];
        for (const rs of riskScores) {
          if (rs.RiskLevel === 'HIGH' && !existingClaimIDs.has(rs.ClaimID)) {
            const newCase: Case = {
              caseID: this.nextCaseId++,
              claimID: rs.ClaimID,
              investigatorID: null,
              status: CASE_STATUS.OPEN,
              resolutionNotes: '',
              isFraud: true,
            };

            posts.push(this.http.post<Case>(this.casesApi, newCase));
          }
        }

        if (posts.length === 0) return;

        Promise.all(posts.map((obs) => obs.toPromise()))
          .then((createdCases) => {
            const updated = [
              ...(existingCases || []),
              ...createdCases.filter(c => c !== undefined) as Case[]
            ];
            this.casesSubject.next(updated);
            console.log('Created cases for high risk claims:', createdCases);
          })
          .catch((err) => console.error('Error creating cases:', err));
      },
      error: (err) => console.error('Error fetching cases before create:', err),
    });
  }

  /** Assign investigator (sets case status to Pending) */
  assignInvestigator(caseId: string, investigatorID: number | null) {
    console.log(`Assigning investigator ${investigatorID} to case ${caseId}`);
    const patch: any = { investigatorID, status: CASE_STATUS.PENDING };
    this.http.patch<Case>(`${this.casesApi}/${caseId}`, patch).subscribe({
      next: (updated) => {
        const list = this.casesSubject.value.map((c) => (c.id === caseId ? updated : c));
        this.casesSubject.next(list);
        console.log(`Case ${caseId} assigned to investigator ${investigatorID}.`);
      },
      error: (e) => console.error('Error assigning investigator:', e),
    });
  }

  updateCaseAfterInvestigation(caseId: string, isFraud: boolean, resolutionNotes?: string) {
    const patch: any = { isFraud };
    if (resolutionNotes !== undefined) patch.resolutionNotes = resolutionNotes;
    patch.status = isFraud && CASE_STATUS.COMPLETED;

    this.http.patch<Case>(`${this.casesApi}/${caseId}`, patch).subscribe({
      next: (updatedCase) => {
        const list = this.casesSubject.value.map((c) =>
          c.id === caseId ? updatedCase : c
        );
        this.casesSubject.next(list);
        console.log(`Case ${caseId} updated after investigation:`, updatedCase);

        const claimApi = `http://localhost:3000/Claims/${updatedCase.claimID}`;
        const claimStatus = !resolutionNotes || !resolutionNotes.trim()
                ? CLAIM_STATUS.PENDING
                : isFraud
                ? CLAIM_STATUS.REJECTED
                : CLAIM_STATUS.APPROVED;


        this.http.patch(claimApi, { Status: claimStatus }).subscribe({
          next: (updatedClaim) => {
            console.log(`Claim ${updatedCase.claimID} status set to ${claimStatus}`);
          },
          error: (err) => console.error('Error updating claim after case investigation:', err),
        });
      },
      error: (err) => console.error('Error updating case after investigation:', err),
    });
  }

  /** Generic case update (patch) */
  updateCase(caseId: string, patch: Partial<Case>) {
    this.http.patch<Case>(`${this.casesApi}/${caseId}`, patch).subscribe({
      next: (updated) => {
        const list = this.casesSubject.value.map((c) => (c.id === caseId ? updated : c));
        this.casesSubject.next(list);
      },
      error: (e) => console.error('Error updating case:', e),
    });
  }

  getCases(): Case[] {
    return this.casesSubject.value;
  }

  getInvestigatorCases(investigatorId: number) {
    return this.http.get<Case[]>(`${this.casesApi}?investigatorID=${investigatorId}`);
  }
}
