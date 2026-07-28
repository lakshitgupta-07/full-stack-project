import { AbstractControl, ValidationErrors } from "@angular/forms";

export function ContainsUsername(
    control: AbstractControl,
): ValidationErrors | null {
    const userName = control.get('userName')?.value || '';
    const password = control.get('password')?.value || '';

    if(userName && password && password.toLowerCase().includes(userName.toLowerCase())){
        return {ContainsUsername: true}
    }
    return null;
}
