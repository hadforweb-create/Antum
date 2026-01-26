// HTTP Client for API requests
import { API_URL } from "../config";
import { getToken } from "./token";

class HttpClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async getHeaders(): Promise<Record<string, string>> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        const token = await getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        return headers;
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: "Request failed" }));
            throw new Error(error.error || error.message || `HTTP ${response.status}`);
        }
        return response.json();
    }

    async get<T>(path: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: "GET",
            headers: await this.getHeaders(),
        });
        return this.handleResponse<T>(response);
    }

    async post<T>(path: string, body?: unknown): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: "POST",
            headers: await this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(response);
    }

    async put<T>(path: string, body?: unknown): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: "PUT",
            headers: await this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(response);
    }

    async delete<T = void>(path: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${path}`, {
            method: "DELETE",
            headers: await this.getHeaders(),
        });
        return this.handleResponse<T>(response);
    }
}

export const httpClient = new HttpClient(API_URL);
