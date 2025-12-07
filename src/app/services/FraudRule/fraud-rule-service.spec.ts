import { TestBed } from '@angular/core/testing';

import { FraudRuleService } from './fraud-rule-service';

describe('FraudRuleService', () => {
  let service: FraudRuleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FraudRuleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
