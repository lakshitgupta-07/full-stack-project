import { FormControl } from '@angular/forms';
import { ValidatePasswordPatternValidator } from './validate-password-pattern.validator';

describe('ValidatePasswordPatternValidator', () => {
  it('returns null for a valid password', () => {
    expect(ValidatePasswordPatternValidator(new FormControl('Password@123'))).toBeNull();
  });

  it('returns validation errors for an invalid password', () => {
    expect(ValidatePasswordPatternValidator(new FormControl('pass'))).toEqual({
      missingDigit: true,
      missingUpperCase: true,
      missingSpecial: true,
      missingLength: true,
    });
  });
});
