import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewChatDialog } from './new-chat-dialog';

describe('NewChatDialog', () => {
  let component: NewChatDialog;
  let fixture: ComponentFixture<NewChatDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewChatDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewChatDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
