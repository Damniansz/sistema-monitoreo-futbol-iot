import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FootballField } from './football-field';

describe('FootballField', () => {
  let component: FootballField;
  let fixture: ComponentFixture<FootballField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FootballField],
    }).compileComponents();

    fixture = TestBed.createComponent(FootballField);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
