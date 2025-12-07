import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Investigator } from './investigator';

describe('Investigator', () => {
  let component: Investigator;
  let fixture: ComponentFixture<Investigator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Investigator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Investigator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
