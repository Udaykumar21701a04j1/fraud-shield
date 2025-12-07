import { TestBed } from '@angular/core/testing';

import { CasesService } from './cases-services';

describe('CasesServices', () => {
  let service: CasesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CasesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
