import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FraudAndCompalinceDashboard } from './report';

describe('FraudAndCompalinceDashboard', () => {
  let component: FraudAndCompalinceDashboard;
  let fixture: ComponentFixture<FraudAndCompalinceDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FraudAndCompalinceDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FraudAndCompalinceDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
