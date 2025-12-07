import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CasesService } from '../Cases/cases-services';
import { Case } from '../../models/Case';

@Injectable({
  providedIn: 'root',
})
export class InvestigatorService {

  constructor(private casesService: CasesService) {}

  private getActiveUserId(): number | null {
    const activeUser = localStorage.getItem('loggedInUser');
    if (!activeUser) return null;
    try {
      return JSON.parse(activeUser).id;
    } catch {
      return null;
    }
  }

  // Return assigned cases reactively from the CasesService BehaviorSubject.
  // This ensures updates made through CasesService.patch(...) are emitted
  // immediately to subscribers (no page refresh required).
  getAssignedCases(): Observable<Case[]> {
    return this.casesService.allCases$.pipe(
      map((cases) => {
        const userId = this.getActiveUserId();
        if (!userId) return [] as Case[];
        return (cases || []).filter((c) => c.investigatorID === userId);
      })
    );
  }
}
