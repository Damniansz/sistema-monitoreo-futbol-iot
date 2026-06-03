import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerTable } from './player-table';

describe('PlayerTable', () => {
  let component: PlayerTable;
  let fixture: ComponentFixture<PlayerTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerTable],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
