import { AbstractControl, ValidationErrors } from '@angular/forms';


export function ConfirmPasswordValidator(
  control: AbstractControl,
): ValidationErrors | null  {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (!password || !confirmPassword) {
    return null;
  }
  if(password !== confirmPassword) {
    return {passwordMismatch:true}
  }
  return null
}
