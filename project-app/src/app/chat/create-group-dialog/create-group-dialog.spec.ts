import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateGroupDialog } from './create-group-dialog';

describe('CreateGroupDialog', () => {
  let component: CreateGroupDialog;
  let fixture: ComponentFixture<CreateGroupDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGroupDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateGroupDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
