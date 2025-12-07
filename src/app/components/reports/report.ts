import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FraudMetric } from '../../models/FraudMetrics';
import { FraudReport } from '../../models/FraudReport';
import { Case } from '../../models/Case';
import { Claim } from '../../models/Claim';

import { CasesService } from '../../services/Cases/cases-services';
import { ClaimsService } from '../../services/Claims/claims-service';

@Component({
  selector: 'app-fraud-and-compalince-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report.html',
  styleUrls: ['./report.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FraudAndCompalinceDashboard implements OnInit {

  private casesService = inject(CasesService);
  private claimsService = inject(ClaimsService);

  // ------------------------------
  // AUTH & APP STATE
  // ------------------------------
  userId = signal<string | null>(null);
  isAuthReady = signal<boolean>(false);

  // Report history (saved locally)
  reports = signal<FraudReport[]>([]);
  exportStatus = signal<string | null>(null);

  // ------------------------------
  // RAW DATA
  // ------------------------------
  cases = signal<Case[]>(this.casesService.getCases());
  claims = signal<Claim[]>([]);
  totalClaims = computed(() => this.claims().length);

  constructor() {
    // Subscribe to ClaimsService to keep claims signal updated
    this.claimsService.claims$.subscribe(data => this.claims.set(data));
  }

  // ------------------------------
  // COMPUTED FRAUD METRICS
  // ------------------------------

  // Number of flagged claims
  flaggedClaimsCount = computed(() =>
    this.claims().filter(c => c.Status === 'Rejected').length
  );

  // Fraud cases from rawCases
  fraudCases = computed(() =>
    this.cases().filter(c => c.isFraud).length
  );

  // True Positives, False Positives, False Negatives
  truePositives = computed(() =>
    this.cases().filter(c => c.isFraud && c.isFraud).length
  );

  falsePositives = computed(() =>
    this.cases().filter(c => !c.isFraud && c.isFraud).length
  );

  falseNegatives = computed(() =>
    this.cases().filter(c => c.isFraud && !c.isFraud).length
  );

  // Monthly trend of flagged claims
  monthlyCounts = computed(() => {
    return this.claims()
      .filter(c => c.Status === 'Rejected')
      .reduce((acc, curr) => {
        const month = new Date(curr.ClaimDate).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
  });

  // Detection accuracy (simplified example)
  detectionAccuracy = computed(() => {
    const trueNegatives = this.cases().filter(c => !c.isFraud && !c.isFraud).length;
    const total = this.cases().length;
    if (total === 0) return '0.0';
    const accuracy = ((this.truePositives() + trueNegatives) / total) * 100;
    return accuracy.toFixed(1);
  });

  // ------------------------------
  // FINAL METRICS OBJECT
  // ------------------------------
  metrics = computed<FraudMetric>(() => {
    const totalFraud = this.flaggedClaimsCount();
    const totalClaimsCount = this.totalClaims();

    return {
      FraudRate: ((totalFraud / totalClaimsCount) * 100).toFixed(2) + '%',
      DetectionAccuracy: this.detectionAccuracy() + '%',
      TotalFraudCases: totalFraud,
      TotalClaims: totalClaimsCount,
      MonthlyTrend: this.monthlyCounts(),
      TruePositives: this.truePositives(),
      FalsePositives: this.falsePositives()
    };
  });

  // ------------------------------
  // MONTHLY GRAPH DATA
  // ------------------------------
  monthlyData = computed(() => {
    const order = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = this.metrics().MonthlyTrend;

    return order.map(month => ({
      name: month,
      cases: counts[month] || 0
    }));
  });

  maxCases = computed(() => {
    const arr = this.monthlyData().map(x => x.cases);
    return Math.max(...arr, 1) + 1;
  });

  trendText = computed(() => {
    const data = this.monthlyData();
    if (data.length < 2) return 'stable (not enough data)';

    const firstHalf = data.slice(0, 3).reduce((a, b) => a + b.cases, 0) / 3;
    const secondHalf = data.slice(3).reduce((a, b) => a + b.cases, 0) / 3;

    if (secondHalf > firstHalf * 1.1) return 'increasing significantly';
    if (secondHalf < firstHalf * 0.9) return 'decreasing significantly';
    return 'stable';
  });

  // ------------------------------
  // HELPERS
  // ------------------------------
  getMostFrequent(arr: string[]): string | null {
    if (!arr.length) return null;
    const freq = new Map<string, number>();
    let max = 0;
    let most = arr[0];

    arr.forEach(item => {
      const count = (freq.get(item) || 0) + 1;
      freq.set(item, count);
      if (count > max) {
        max = count;
        most = item;
      }
    });

    return most;
  }

  formatDate(date: any): string {
    if (date?.toDate) return date.toDate().toLocaleString();
    if (date instanceof Date) return date.toLocaleString();
    return 'N/A';
  }

  // ------------------------------
  // LIFECYCLE
  // ------------------------------
  ngOnInit() {
    this.userId.set('local-user');
    this.isAuthReady.set(true);

    // Subscribe to CasesService to keep cases signal updated
    this.cases.set(this.casesService.getCases());
  }
}
