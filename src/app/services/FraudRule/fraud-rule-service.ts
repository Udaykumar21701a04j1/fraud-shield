import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FraudRule } from '../../models/FraudRule';
import { RuleViolation } from '../../models/RuleViolation';
import { Claim } from '../../models/Claim';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FraudRuleService {

  private apiRules = "http://localhost:3000/FraudRule";
  private apiViolations = "http://localhost:3000/RuleViolation";

  constructor(private http: HttpClient) {}

  /** GET ALL RULES FROM JSON SERVER **/
  getFraudRules(): Observable<FraudRule[]> {
    return this.http.get<FraudRule[]>(this.apiRules);
  }

  /** UPDATE RULE IN JSON SERVER **/
  editRule(updatedRule: FraudRule): Observable<FraudRule> {
    return this.http.put<FraudRule>(`${this.apiRules}/${updatedRule.ruleID}`, updatedRule);
  }

  /** GET VIOLATIONS FROM JSON SERVER **/
  getRuleViolations(): Observable<RuleViolation[]> {
    return this.http.get<RuleViolation[]>(this.apiViolations);
  }

  /** ADD NEW VIOLATION INTO JSON SERVER **/
  private recordViolation(claimID: string, ruleID: string): void {
    const violation: RuleViolation = {
      violationID: this.generateUniqueId(),
      claimID,
      ruleID,
      violationDate: new Date().toISOString(),
    };

    this.http.post(this.apiViolations, violation)
      .subscribe(() => console.log("Violation saved:", violation));
  }

  /** APPLY ALL RULES **/
  applyRules(claims: Claim[], rules: FraudRule[]): void {
    this.applyExcessiveClaimAmountRule(claims, rules);
    this.applyBlockedHospitalsRule(claims, rules);
  }

  /** Rule 1 - Excessive Claim Amount **/
  private applyExcessiveClaimAmountRule(claims: Claim[], rules: FraudRule[]): void {
    const rule = rules.find(r => r.ruleName === 'Exclusive Claim Amount');
    if (!rule || !rule.thresholdValue) return;

    claims.forEach(claim => {
      if (claim.Amount > rule.thresholdValue!) {
        this.recordViolation(claim.ClaimID, rule.ruleID);
      }
    });
  }

  /** Rule 2 - Blocked Hospital Rule **/
  private applyBlockedHospitalsRule(claims: Claim[], rules: FraudRule[]): void {
    const rule = rules.find(r => r.ruleName === 'Blocked Hospitals');
    if (!rule || !rule.blockedHospitals) return;

    claims.forEach(claim => {
      if (rule.blockedHospitals!.includes(claim.HospitalName)) {
        this.recordViolation(claim.ClaimID, rule.ruleID);
      }
    });
  }

  /** UPDATE STATUS **/
  public updateClaimStatusForViolations(claims: Claim[], violations: RuleViolation[]): void {
    const violatingIDs = new Set(violations.map(v => v.claimID));
    claims.forEach(c => {
      if (violatingIDs.has(c.ClaimID)) {
        c.Status = 'Fraud Detected';
      }
    });
  }

  private generateUniqueId(): string {
    return 'VIOL-' + Math.random().toString(36).substr(2, 9);
  }
}
