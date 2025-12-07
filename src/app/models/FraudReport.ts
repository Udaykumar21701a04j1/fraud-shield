import { FraudMetric } from './FraudMetrics';

export interface FraudReport {
  ReportID: string;
  Metrics: FraudMetric;
  GeneratedDate: any; 
}