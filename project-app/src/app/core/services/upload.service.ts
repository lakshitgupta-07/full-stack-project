import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environment/envirenment";
import { Observable } from "rxjs";
import { ApiResponse, ChatMedia } from "../models/upload.model";

@Injectable({
    providedIn: "root",
})

export class UploadService {
    private http = inject(HttpClient)

    uploadImage(file: File): Observable<ApiResponse<ChatMedia>> {
        const formData = new FormData();
        formData.append("image", file)
        return this.http.post<ApiResponse<ChatMedia>> (
            `${environment.apiUrl}/user/image`,
            formData
        )
    }
    uploadVideo(file: File): Observable<ApiResponse<ChatMedia>> {
        const formData = new FormData();
        formData.append("video", file)
        return this.http.post<ApiResponse<ChatMedia>> (
            `${environment.apiUrl}/user/video`,
            formData
        )
    }
}
