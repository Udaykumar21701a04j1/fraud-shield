export interface FraudRule {
    ruleID: string;
    ruleName: string;
    description: string;
    thresholdValue?: number;
    blockedHospitals?: string[];
}