import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})

export class RazorpayLoaderService {
    load(): Promise<void> {
        return new Promise((resolve) => {
            if((window as any).Razorpay) {
                resolve();
                return
            }
            const script = document.createElement('script')
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            document.body.appendChild(script);
        });
    }
}