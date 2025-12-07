import { Injectable } from '@angular/core';
import { Claim } from '../../models/Claim';
import * as XLSX from 'xlsx';
import { BehaviorSubject, Observable, forkJoin, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PatternAnalysis } from '../PatternAnalysis/pattern-analysis';
import { CasesService } from '../Cases/cases-services';
import { CLAIM_STATUS } from '../constants';

export interface ClaimWithFlag extends Claim {
  isNew?: boolean; // optional flag to mark newly added claims
}

@Injectable({
  providedIn: 'root',
})
export class ClaimsService {
  private apiUrl = 'http://localhost:3000/Claims';
  private _claims = new BehaviorSubject<ClaimWithFlag[]>([]);
  public readonly claims$ = this._claims.asObservable();

  /** Dashboard counters */
  public readonly totalClaims$ = this.claims$.pipe(map(claims => claims.length));
  public readonly totalPendingClaims$ = this.claims$.pipe(
    map(claims => claims.filter(c => c.Status === CLAIM_STATUS.PENDING).length)
  );
  public readonly totalApprovedClaims$ = this.claims$.pipe(
    map(claims => claims.filter(c => c.Status === CLAIM_STATUS.APPROVED).length)
  );
  public readonly totalRejectedClaims$ = this.claims$.pipe(
    map(claims => claims.filter(c => c.Status === CLAIM_STATUS.REJECTED).length)
  );
  public readonly totalFraudClaims$ = this.claims$.pipe(
    map(claims => claims.filter(c => c.Status === CLAIM_STATUS.FRAUD_DETECTED).length)
  );

  constructor(
    private http: HttpClient,
    private patternAnalysis: PatternAnalysis,
    private casesService: CasesService
  ) {
    this.loadClaims();
  }

  /** Load all claims */
  loadClaims(): void {
    this.http.get<Claim[]>(this.apiUrl).subscribe({
      next: (res) => this._claims.next(res?.map(c => ({ ...c, isNew: false })) || []),
      error: (err) => console.error('Failed to load claims:', err),
    });
  }

  /** Insert new claims and run pattern analysis */
  addClaims(newClaims: Claim[]): void {
    const existing = this._claims.getValue();

    // Remove duplicates by ClaimID
    const uniqueClaims = newClaims.filter(
      c => !existing.some(e => e.ClaimID === c.ClaimID)
    );

    if (uniqueClaims.length === 0) {
      console.warn('No new unique claims found.');
      return;
    }

    const posts = uniqueClaims.map(c => this.http.post<Claim>(this.apiUrl, c));

    forkJoin(posts).subscribe({
      next: (createdClaims) => {
        // Mark them as new
        const newClaimsWithFlag: ClaimWithFlag[] = createdClaims.map(c => ({ ...c, isNew: true }));

        // Prepend new claims to existing ones
        this._claims.next([...newClaimsWithFlag, ...existing]);

        // Run pattern analysis
        this.patternAnalysis.analyzePatterns(createdClaims).subscribe({
          next: (scores) => {
            scores.forEach(rs => {
              let status: string = CLAIM_STATUS.PENDING;

              if (rs.RiskLevel === 'HIGH') status = CLAIM_STATUS.FRAUD_DETECTED;
              else if (rs.RiskLevel === 'MEDIUM' || rs.RiskLevel === 'LOW') status = CLAIM_STATUS.APPROVED;

              this.updateClaimStatus(rs.ClaimID, status);
            });

            // Only HIGH risk → creates cases
            this.casesService.createCasesForHighRisk(scores);
          },
          error: (err) => console.error('Pattern analysis failed:', err),
        });
      },
      error: (err) => console.error('Error adding claims:', err),
    });
  }

  /** Update a claim status */
  updateClaimStatus(claimID: string, status: string): void {
    const claim = this._claims.value.find(c => c.ClaimID === claimID);

    if (!claim || !claim.id) {
      console.error('Claim not found or missing JSON server ID:', claimID);
      return;
    }

    const url = `${this.apiUrl}/${claim.id}`;
    this.http.patch(url, { Status: status }).subscribe({
      next: () => {
        const updated = this._claims.value.map(c =>
          c.ClaimID === claimID ? { ...c, Status: status } : c
        );
        this._claims.next(updated);
      },
      error: (err) => console.error('Status update failed:', err),
    });
  }

  /** Get claims as observable */
  getClaims(): Observable<ClaimWithFlag[]> {
    return this.claims$;
  }

  /** Excel Parsing */
  parseExcelFile(file: File): Promise<Claim[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet);
          const claims = rows.map(r => this.mapRowToClaim(r));
          resolve(claims);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject('Unable to read file.');
      reader.readAsArrayBuffer(file);
    });
  }

  /** Convert Excel serial date → yyyy-mm-dd */
  private convertExcelDate(excel: any): string {
    if (typeof excel !== 'number') return excel;
    const date = new Date((excel - 25569) * 86400000);
    return date.toISOString().split('T')[0];
  }

  /** Excel row → Claim */
  private mapRowToClaim(row: any): Claim {
    return {
      ClaimID:
        row['ClaimID'] ||
        row['Claim ID'] ||
        `CLM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      PolicyID: row['PolicyID'] || row['Policy ID'] || '',
      PolicyHolderID: row['PolicyholderID'] || row['Policy Holder ID'] || '',
      Amount: Number(row['ClaimAmount'] || row['Claim Amount'] || 0),
      ClaimDate: this.convertExcelDate(row['ClaimDate'] || row['Claim Date']),
      HospitalName: row['HospitalName'] || '',
      Status: CLAIM_STATUS.PENDING, // initial status
    };
  }
}
