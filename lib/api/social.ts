import { supabase } from "@/lib/supabase";

// ============================================
// FOLLOWS
// ============================================

export async function toggleFollow(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: existing } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

    if (existing) {
        await supabase
            .from("follows")
            .delete()
            .eq("follower_id", user.id)
            .eq("following_id", targetUserId);
        return false; // unfollowed
    } else {
        await supabase.from("follows").insert({
            follower_id: user.id,
            following_id: targetUserId,
        });
        // Create notification for the followed user
        await supabase.from("notifications").insert({
            user_id: targetUserId,
            type: "follow",
            actor_id: user.id,
            body: "started following you",
        });
        return true; // followed
    }
}

export async function checkIsFollowing(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

    return !!data;
}

export async function getFollowerCount(userId: string): Promise<number> {
    const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);
    return count ?? 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
    const { count } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);
    return count ?? 0;
}

// ============================================
// LIKES
// ============================================

export type LikeTargetType = "service" | "reel";

export async function toggleLike(
    targetType: LikeTargetType,
    targetId: string
): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: existing } = await supabase
        .from("likes")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .maybeSingle();

    if (existing) {
        await supabase
            .from("likes")
            .delete()
            .eq("user_id", user.id)
            .eq("target_type", targetType)
            .eq("target_id", targetId);
        return false; // unliked
    } else {
        await supabase.from("likes").insert({
            user_id: user.id,
            target_type: targetType,
            target_id: targetId,
        });
        return true; // liked
    }
}

export async function checkIsLiked(
    targetType: LikeTargetType,
    targetId: string
): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
        .from("likes")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .maybeSingle();

    return !!data;
}

export async function getLikeCount(
    targetType: LikeTargetType,
    targetId: string
): Promise<number> {
    const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("target_type", targetType)
        .eq("target_id", targetId);
    return count ?? 0;
}

// ============================================
// COMMENTS
// ============================================

export interface CommentItem {
    id: string;
    user_id: string;
    target_type: string;
    target_id: string;
    body: string;
    created_at: string;
}

export async function getComments(
    targetType: LikeTargetType,
    targetId: string,
    limit = 50,
    offset = 0
): Promise<CommentItem[]> {
    const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data ?? []) as CommentItem[];
}

export async function getCommentCount(
    targetType: LikeTargetType,
    targetId: string
): Promise<number> {
    const { count } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("target_type", targetType)
        .eq("target_id", targetId);
    return count ?? 0;
}

export async function addComment(
    targetType: LikeTargetType,
    targetId: string,
    body: string
): Promise<CommentItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("comments")
        .insert({
            user_id: user.id,
            target_type: targetType,
            target_id: targetId,
            body,
        })
        .select()
        .single();

    if (error) throw error;
    return data as CommentItem;
}

export async function deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);
    if (error) throw error;
}

// ============================================
// SERVICE REQUESTS
// ============================================

export interface ServiceRequest {
    id: string;
    service_id: string;
    client_id: string;
    freelancer_id: string;
    status: string;
    message: string | null;
    conversation_id: string | null;
    created_at: string;
    updated_at: string;
}

export async function createServiceRequest(
    serviceId: string,
    freelancerId: string,
    message?: string
): Promise<ServiceRequest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("service_requests")
        .insert({
            service_id: serviceId,
            client_id: user.id,
            freelancer_id: freelancerId,
            message: message ?? null,
        })
        .select()
        .single();

    if (error) throw error;

    // Notify the freelancer
    await supabase.from("notifications").insert({
        user_id: freelancerId,
        type: "hire_request",
        actor_id: user.id,
        target_type: "service",
        target_id: serviceId,
        body: "wants to hire you",
    });

    return data as ServiceRequest;
}

export async function getMyServiceRequests(): Promise<ServiceRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .or(`client_id.eq.${user.id},freelancer_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ServiceRequest[];
}

export async function updateServiceRequestStatus(
    requestId: string,
    status: string,
    conversationId?: string
): Promise<ServiceRequest> {
    const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
    };
    if (conversationId) updateData.conversation_id = conversationId;

    const { data, error } = await supabase
        .from("service_requests")
        .update(updateData)
        .eq("id", requestId)
        .select()
        .single();

    if (error) throw error;
    return data as ServiceRequest;
}
