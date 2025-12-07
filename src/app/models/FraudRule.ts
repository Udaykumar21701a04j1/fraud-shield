export interface FraudRule {
    id?: string;
    ruleID: string;
    ruleName: string;
    description: string;
    thresholdValue?: number;
    blockedHospitals?: string[];
}