import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environment/envirenment";

@Injectable({
    providedIn: 'root'
})

export class PaymentService {
    private http = inject(HttpClient)

    createOrder(amount: number) {
        return this.http.post<any> (
            `${environment.apiUrl}/payment/create-order`,
            {
                amount,
                currency: "INR"
            },
            {
                withCredentials: true
            }
        )
    }
    verifyPayment(data: any) {
        return this.http.post(
            `${environment.apiUrl}/payment/verify`,
            data,
            {
                withCredentials: true
            }
        )
    }
}