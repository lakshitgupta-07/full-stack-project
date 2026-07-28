import { AbstractControl, ValidationErrors } from '@angular/forms';

export function ValidatePasswordPatternValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.value || '';

  const hasUpperCase = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasLength = password.length >= 8;

  const errors: ValidationErrors = {};

  if (!hasDigit) {
    errors['missingDigit'] = true;
  }

  if (!hasUpperCase) {
    errors['missingUpperCase'] = true;
  }

  if (!hasLowerCase) {
    errors['missingLowerCase'] = true;
  }

  if (!hasSpecial) {
    errors['missingSpecial'] = true;
  }

  if (!hasLength) {
    errors['missingLength'] = true;
  }

  return Object.keys(errors).length ? errors : null;
}
