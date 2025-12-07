import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Claim } from '../../models/Claim';
import { RiskScore } from '../../models/RiskScore';

@Injectable({
  providedIn: 'root',
})
export class PatternAnalysis {
  private claimsApi = 'http://localhost:3000/Claims';
  private riskScoreApi = 'http://localhost:3000/RiskScore';

  private riskScoresSubject = new BehaviorSubject<RiskScore[]>([]);
  public riskScores$ = this.riskScoresSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Main Method — Perform pattern analysis + save output to API.
   * IMPORTANT: This method does NOT change claim statuses. It returns the saved RiskScore[]
   * so the caller (ClaimsService) can update claims and trigger case creation.
   */
  public analyzePatterns(newClaims: Claim[]): Observable<RiskScore[]> {
    console.log('--- Starting Pattern Analysis With API ---');

    // load all claims to consider history
    return this.http.get<Claim[]>(this.claimsApi).pipe(
      switchMap((existingClaims) => {
        // Exclude claims already rejected by rules
        const cleanClaims = (existingClaims || []).filter((c) => c.Status !== 'Rejected');

        const allClaims = [...cleanClaims, ...newClaims.filter(c => c.Status !== 'Rejected')];

        const riskScores: RiskScore[] = [];
        const policyHolderIDs = Array.from(new Set(newClaims.map((c) => c.PolicyHolderID)));

        for (const policyHolderID of policyHolderIDs) {
          const holderClaims = allClaims.filter((c) => c.PolicyHolderID === policyHolderID);

          const fraudHistoryPoints = this.calculateFraudHistoryPoints(policyHolderID, allClaims);
          const claimFrequencyPoints = this.calculateClaimFrequencyPoints(holderClaims);

          const scoreValue = fraudHistoryPoints + claimFrequencyPoints;
          const riskLevel = this.mapScoreToRiskLevel(scoreValue);

          const newHolderClaims = newClaims.filter(
            (c) => c.PolicyHolderID === policyHolderID && c.Status !== 'Rejected'
          );

          for (const claim of newHolderClaims) {
            riskScores.push({
              ScoreID: `RISK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              ClaimID: claim.id,
              ScoreValue: scoreValue,
              RiskLevel: riskLevel,
              AnalysisDate: new Date().toISOString(),
            } as RiskScore);
          }
        }

        if (riskScores.length === 0) {
          return of([] as RiskScore[]);
        }

        // Save all risk scores to API (multiple POSTs)
        const posts = riskScores.map((rs) => this.http.post<RiskScore>(this.riskScoreApi, rs));
        return forkJoin(posts).pipe(
          map((savedScores) => {
            const current = this.riskScoresSubject.value;
            this.riskScoresSubject.next([...current, ...savedScores]);
            console.log('--- Pattern Analysis Complete, saved risk scores ---');
            return savedScores;
          })
        );
      })
    );
  }

  private calculateFraudHistoryPoints(policyHolderID: string | number, allClaims: Claim[]): number {
    const holderClaims = allClaims.filter((c) => c.PolicyHolderID === policyHolderID);
    const rejected = holderClaims.filter((c) => c.Status === 'Rejected' || c.Status === 'Fraud Detected').length;

    if (rejected >= 3) return 60;
    if (rejected >= 1) return 30;
    return 0;
  }

  private calculateClaimFrequencyPoints(holderClaims: Claim[]): number {
    if (!holderClaims || holderClaims.length === 0) return 0;

    const sorted = [...holderClaims].sort(
      (a, b) => new Date(a.ClaimDate).getTime() - new Date(b.ClaimDate).getTime()
    );

    const first = new Date(sorted[0].ClaimDate).getTime();
    const last = new Date(sorted[sorted.length - 1].ClaimDate).getTime();

    const MS_YEAR = 1000 * 60 * 60 * 24 * 365.25;
    const span = (last - first) / MS_YEAR;

    let perYear =
      span <= 0.5 || holderClaims.length === 1
        ? holderClaims.length
        : holderClaims.length / span;

    if (perYear >= 7) return 40;
    if (perYear >= 4) return 20;
    return 0;
  }

  private mapScoreToRiskLevel(value: number): string {
    if (value >= 71) return 'HIGH';
    if (value >= 31) return 'MEDIUM';
    return 'LOW';
  }
}
