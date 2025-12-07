export interface FraudMetric {
  FraudRate: string;
  DetectionAccuracy: string;
  TotalFraudCases: number;
  TotalClaims: number;
  MonthlyTrend: Record<string, number>;
}