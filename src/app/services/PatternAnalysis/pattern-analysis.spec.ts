import { TestBed } from '@angular/core/testing';

import { PatternAnalysis } from './pattern-analysis';

describe('PatternAnalysis', () => {
  let service: PatternAnalysis;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PatternAnalysis);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});


// [{
// 	"resource": "/c:/Users/2457295/FraudShield/Frontend/src/app/services/PatternAnalysis/pattern-analysis.ts",
// 	"owner": "typescript",
// 	"code": "2352",
// 	"severity": 8,
// 	"message": "Conversion of type '{ ClaimID: string; PolicyHolderID: string; ClaimDate: string; Amount: number; Status: string; PolicyID: string; HospitalName: string; }[][]' to type 'Claim[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.\n  Type '{ ClaimID: string; PolicyHolderID: string; ClaimDate: string; Amount: number; Status: string; PolicyID: string; HospitalName: string; }[]' is missing the following properties from type 'Claim': ClaimID, PolicyID, PolicyHolderID, Amount, and 3 more.",
// 	"source": "ts",
// 	"startLineNumber": 14,
// 	"startColumn": 32,
// 	"endLineNumber": 14,
// 	"endColumn": 56,
// 	"origin": "extHost1"
// }]
