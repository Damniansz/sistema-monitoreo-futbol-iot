import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveLog } from './live-log';

describe('LiveLog', () => {
  let component: LiveLog;
  let fixture: ComponentFixture<LiveLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveLog],
    }).compileComponents();

    fixture = TestBed.createComponent(LiveLog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
