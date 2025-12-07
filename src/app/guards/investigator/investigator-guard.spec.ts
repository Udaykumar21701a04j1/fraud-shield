import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { investigatorGuard } from './investigator-guard';

describe('investigatorGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => investigatorGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
