import { TestBed } from '@angular/core/testing';

import { InvestigatorService } from './investigator-service';

describe('InvestigatorService', () => {
  let service: InvestigatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvestigatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
