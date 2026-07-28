import { FormControl, FormGroup } from '@angular/forms';
import { ConfirmPasswordValidator } from './confirm-password.validator';

describe('ConfirmPasswordValidator', () => {
  it('returns null when passwords match', () => {
    const form = new FormGroup({
      password: new FormControl('Password@123'),
      confirmPassword: new FormControl('Password@123'),
    });

    expect(ConfirmPasswordValidator(form)).toBeNull();
  });

  it('returns passwordMismatch when passwords do not match', () => {
    const form = new FormGroup({
      password: new FormControl('Password@123'),
      confirmPassword: new FormControl('Different@123'),
    });

    expect(ConfirmPasswordValidator(form)).toEqual({ passwordMismatch: true });
  });
});
