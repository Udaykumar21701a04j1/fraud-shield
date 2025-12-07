import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RuleManagement } from './rule-management';

describe('RuleManagement', () => {
  let component: RuleManagement;
  let fixture: ComponentFixture<RuleManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuleManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RuleManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
