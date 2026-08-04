import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environment/envirenment";
import { Observable } from "rxjs";
import { ApiResponse, chatImage } from "../models/upload.model";

@Injectable({
    providedIn: "root",
})

export class UploadService {
    private http = inject(HttpClient)

    uploadImage(file: File): Observable<ApiResponse<chatImage>> {
        const formData = new FormData();
        formData.append("image", file)
        return this.http.post<ApiResponse<chatImage>> (
            `${environment.apiUrl}/user/chat`,
            formData
        )
    }
}
