// Skills API
import { httpClient } from "./http";
import type { Skill } from "@/types";

export async function getSkills(): Promise<Skill[]> {
    return httpClient.get<Skill[]>("/api/skills");
}
