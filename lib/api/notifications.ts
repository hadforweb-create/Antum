import { supabase } from "@/lib/supabase";

// ============================================
// TYPES
// ============================================

export interface NotificationItem {
    id: string;
    user_id: string;
    type: string; // 'follow' | 'like' | 'comment' | 'hire_request' | 'message'
    actor_id: string | null;
    target_type: string | null;
    target_id: string | null;
    body: string | null;
    read_at: string | null;
    created_at: string;
}

// ============================================
// API FUNCTIONS
// ============================================

export async function getNotifications(
    limit = 50,
    offset = 0
): Promise<NotificationItem[]> {
    const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data ?? []) as NotificationItem[];
}

export async function getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .is("read_at", null);

    if (error) throw error;
    return count ?? 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId);
    if (error) throw error;
}

export async function markAllRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
    if (error) throw error;
}
