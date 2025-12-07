import { Injectable } from '@angular/core';
import { Claim } from '../../models/Claim';
import * as XLSX from 'xlsx';
import { BehaviorSubject, Observable, forkJoin, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PatternAnalysis } from '../PatternAnalysis/pattern-analysis';
import { CasesService } from '../Cases/cases-services';
import { CLAIM_STATUS } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class ClaimsService {
  private apiUrl = 'http://localhost:3000/Claims';
  private _claims = new BehaviorSubject<Claim[]>([]);
  public readonly claims$ = this._claims.asObservable();

  /** Dashboard counters */
  public readonly totalClaims$ = this.claims$.pipe(
    map(claims => claims.length)
  );

  public readonly totalPendingClaims$ = this.claims$.pipe(
    map(claims => claims.filter(c => c.Status === CLAIM_STATUS.PENDING).length)
  );

  public readonly totalApprovedClaims$ = this.claims$.pipe(
    map(claims => claims.filter(c => c.Status === CLAIM_STATUS.APPROVED).length)
  );

  public readonly totalRejectedClaims$ = this.claims$.pipe(
    map(claims => claims.filter(c => c.Status === CLAIM_STATUS.REJECTED).length)
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
      next: (res) => this._claims.next(res || []),
      error: (err) => console.error('Failed to load claims:', err),
    });
  }

  /** Add new claims */
  addClaims(newClaims: Claim[]): void {
    const posts = newClaims.map(c => this.http.post<Claim>(this.apiUrl, c));

    forkJoin(posts).subscribe({
      next: (createdClaims) => {
        const existing = this._claims.getValue();
        this._claims.next([...existing, ...createdClaims]);

        /** Pattern analysis */
        this.patternAnalysis.analyzePatterns(createdClaims).subscribe({
          next: (scores) => {
            scores.forEach(rs => {
              const status =
                rs.RiskLevel === 'LOW' || rs.RiskLevel === 'MEDIUM'
                  ? CLAIM_STATUS.APPROVED
                  : CLAIM_STATUS.FRAUD_DETECTED;

              this.updateClaimStatus(rs.ClaimID, status);
            });

            this.casesService.createCasesForHighRisk(scores);
          },
          error: (err) => console.error('Pattern analysis failed', err),
        });
      },
      error: (err) => console.error('Error adding claims', err),
    });
  }

  /** Update claim status */
  updateClaimStatus(claimID: string, status: string): void {
    const claim = this._claims.value.find(c => c.ClaimID === claimID);

    if (!claim) return console.error('Claim not found for update', claimID);
    if (!claim.id) return console.error('Missing JSON Server ID for claim', claim);

    const url = `${this.apiUrl}/${claim.id}`;

    this.http.patch(url, { Status: status }).subscribe({
      next: () => {
        const updated = this._claims.value.map(c =>
          c.ClaimID === claimID ? { ...c, Status: status } : c
        );
        this._claims.next(updated);
      },
      error: (err) => console.error('Status update error', err),
    });
  }

  /** Get claims as observable */
  getClaims(): Observable<Claim[]> {
    return this.claims$;
  }

  /* ======================================
        EXCEL PARSING (UPDATED)
     ====================================== */

  /** Parse Excel file with normalization + dedupe */
  parseExcelFile(file: File): Promise<Claim[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawRows = XLSX.utils.sheet_to_json(sheet);

          /** Normalize & map to claim */
          const normalizedClaims = rawRows.map(row => {
            const normalized = this.normalizeRow(row);
            return this.mapRowToClaim(normalized);
          });

          /** Remove duplicates */
          const uniqueClaims = this.removeDuplicates(normalizedClaims);

          resolve(uniqueClaims);

        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => reject('Unable to read file.');
      reader.readAsArrayBuffer(file);
    });
  }

  /** Normalize Excel row keys: Claim ID → claimid */
  private normalizeRow(row: any): any {
    const normalized: any = {};

    Object.keys(row).forEach(key => {
      const cleanKey = key.replace(/[\s_]/g, '').toLowerCase();
      normalized[cleanKey] = row[key];
    });

    return normalized;
  }

  /** Remove duplicate ClaimID */
  private removeDuplicates(claims: Claim[]): Claim[] {
    const map = new Map<string, Claim>();

    claims.forEach(c => {
      if (!map.has(c.ClaimID)) {
        map.set(c.ClaimID, c);
      }
    });

    return Array.from(map.values());
  }

  /** Convert Excel date to yyyy-mm-dd */
  private convertExcelDate(excel: any): string {
    if (typeof excel !== 'number') return excel;
    const date = new Date((excel - 25569) * 86400000);
    return date.toISOString().split('T')[0];
  }

  /** Convert normalized row → Claim object */
  private mapRowToClaim(row: any): Claim {
    return {
      ClaimID: row.claimid || `CLM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      PolicyID: row.policyid || '',
      PolicyHolderID: String(row.policyholderid || 0),
      Amount: Number(row.claimamount || 0),
      ClaimDate: this.convertExcelDate(row.claimdate),
      HospitalName: row.hospitalname || '',
      Status: CLAIM_STATUS.PENDING,
    };
  }
}
