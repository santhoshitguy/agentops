import { CanActivateFn } from '@angular/router';

export const approvalPendingGuard: CanActivateFn = (route, state) => {
  return true;
};
