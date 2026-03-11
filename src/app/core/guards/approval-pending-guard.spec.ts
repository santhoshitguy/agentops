import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { approvalPendingGuard } from './approval-pending-guard';

describe('approvalPendingGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => approvalPendingGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
