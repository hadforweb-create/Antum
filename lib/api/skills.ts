// Skills API
import { httpClient } from "./http";
import type { Skill } from "@/types";

export async function getSkills(): Promise<Skill[]> {
    return httpClient.get<Skill[]>("/api/skills");
}

export async function getUserSkills(userId: string): Promise<{ skills: Skill[] }> {
    return httpClient.get<{ skills: Skill[] }>(`/api/users/${userId}/skills`);
}

export async function getMySkills(): Promise<{ skills: Skill[] }> {
    return httpClient.get<{ skills: Skill[] }>("/api/users/me/skills");
}

export async function updateMySkills(skillIds: string[]): Promise<{ skills: Skill[] }> {
    return httpClient.put<{ skills: Skill[] }>("/api/users/me/skills", { skillIds });
}
