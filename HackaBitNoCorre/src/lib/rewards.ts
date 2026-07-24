import { supabase } from "@/lib/supabase";
import type { Lesson, QuizQuestion } from "@/lib/types";

/** Level curve: level = floor(xp / 100) + 1 */
export function computeLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

/** XP needed to reach the next level from current xp. */
export function xpToNextLevel(xp: number): { current: number; needed: number } {
  const level = computeLevel(xp);
  const base = (level - 1) * 100;
  return { current: xp - base, needed: 100 };
}

type CompleteResult = {
  satsEarned: number;
  xpEarned: number;
  perfect: boolean;
  alreadyCompleted: boolean;
  error?: string;
};

/**
 * Completes a lesson via atomic server-side RPC.
 * All writes happen in a single transaction — or everything succeeds or nothing does.
 */
export async function completeLesson(
  lesson: Lesson,
  answers: number[]
): Promise<CompleteResult> {
  const quiz = lesson.quiz as QuizQuestion[];
  const quizTotal = quiz.length;
  const quizCorrect = answers.reduce(
    (acc, ans, i) => acc + (ans === quiz[i]?.correct ? 1 : 0),
    0
  );

  const { data, error } = await supabase.rpc("complete_lesson", {
    p_lesson_id: lesson.id,
    p_quiz_correct: quizCorrect,
    p_quiz_total: quizTotal,
  });

  if (error) {
    return {
      satsEarned: 0,
      xpEarned: 0,
      perfect: false,
      alreadyCompleted: false,
      error: error.message,
    };
  }

  const result = data as {
    sats_earned: number;
    xp_earned: number;
    perfect: boolean;
    already_completed: boolean;
    error?: string;
  };

  if (result.error) {
    return {
      satsEarned: 0,
      xpEarned: 0,
      perfect: false,
      alreadyCompleted: false,
      error: result.error,
    };
  }

  return {
    satsEarned: result.sats_earned,
    xpEarned: result.xp_earned,
    perfect: result.perfect,
    alreadyCompleted: result.already_completed,
  };
}

/**
 * Claims a completed mission's reward via atomic server-side RPC.
 */
export async function claimMission(
  missionProgressId: string
): Promise<{ satsEarned: number; xpEarned: number; error?: string }> {
  const { data, error } = await supabase.rpc("claim_mission", {
    p_mission_progress_id: missionProgressId,
  });

  if (error) {
    return { satsEarned: 0, xpEarned: 0, error: error.message };
  }

  const result = data as {
    sats_earned: number;
    xp_earned: number;
    error?: string;
  };

  if (result.error) {
    return { satsEarned: 0, xpEarned: 0, error: result.error };
  }

  return {
    satsEarned: result.sats_earned,
    xpEarned: result.xp_earned,
  };
}

/**
 * Records a game score via atomic server-side RPC.
 */
export async function recordGameScore(
  gameId: string,
  score: number
): Promise<{ satsEarned: number; xpEarned: number; error?: string }> {
  const { data, error } = await supabase.rpc("record_game_score", {
    p_game_id: gameId,
    p_score: score,
  });

  if (error) {
    return { satsEarned: 0, xpEarned: 0, error: error.message };
  }

  const result = data as {
    sats_earned: number;
    xp_earned: number;
    score: number;
    error?: string;
  };

  if (result.error) {
    return { satsEarned: 0, xpEarned: 0, error: result.error };
  }

  return {
    satsEarned: result.sats_earned,
    xpEarned: result.xp_earned,
  };
}

/**
 * Verifies age and enables Open Finance via server-side RPC.
 * Returns error if user is under 16 or has no birthdate.
 */
export async function enableOpenFinance(): Promise<{
  success: boolean;
  age?: number;
  error?: string;
}> {
  const { data, error } = await supabase.rpc("verify_age_and_enable_open_finance");
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; age?: number; error?: string };
  if (result.error) return { success: false, error: result.error };
  return { success: true, age: result.age };
}

/**
 * Creates a virtual card via server-side RPC (age-gated).
 */
export async function createVirtualCard(): Promise<{
  success: boolean;
  last4?: string;
  error?: string;
}> {
  const { data, error } = await supabase.rpc("create_virtual_card");
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; last4?: string; error?: string };
  if (result.error) return { success: false, error: result.error };
  return { success: true, last4: result.last4 };
}

/**
 * Generates or retrieves a referral code via server-side RPC.
 * Includes fraud protection: max 10 invites per day.
 */
export async function generateReferralCode(): Promise<{
  code: string;
  created: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.rpc("generate_referral_code");
  if (error) return { code: "", created: false, error: error.message };
  const result = data as { code: string; created: boolean; error?: string };
  if (result.error) return { code: "", created: false, error: result.error };
  return { code: result.code, created: result.created };
}

/**
 * Gets referral statistics via server-side RPC.
 */
export async function getReferralStats(): Promise<{
  total: number;
  pending: number;
  completed: number;
  rewardSats: number;
}> {
  const { data, error } = await supabase.rpc("get_referral_stats");
  if (error) return { total: 0, pending: 0, completed: 0, rewardSats: 0 };
  const result = data as {
    total: number;
    pending: number;
    completed: number;
    reward_sats: number;
  };
  return {
    total: result.total,
    pending: result.pending,
    completed: result.completed,
    rewardSats: result.reward_sats,
  };
}

/**
 * Updates profile via server-side RPC.
 */
export async function updateProfile(params: {
  name?: string;
  avatarEmoji?: string;
  birthdate?: string;
  bio?: string;
}): Promise<{ success: boolean; error?: string }> {
  const rpcParams: Record<string, string> = {};
  if (params.name !== undefined) rpcParams.p_name = params.name;
  if (params.avatarEmoji !== undefined) rpcParams.p_avatar_emoji = params.avatarEmoji;
  if (params.birthdate !== undefined) rpcParams.p_birthdate = params.birthdate;
  if (params.bio !== undefined) rpcParams.p_bio = params.bio;

  const { data, error } = await supabase.rpc("update_profile", rpcParams);
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; error?: string };
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}

/**
 * Deletes account via server-side RPC.
 */
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc("delete_account");
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Updates extended profile fields via server-side RPC.
 */
export async function updateProfileExtended(params: {
  name: string;
  username?: string;
  avatarEmoji?: string;
  bannerColor?: string;
  birthdate?: string;
  bio?: string;
  city?: string;
  country?: string;
  school?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("update_profile_extended", {
    p_name: params.name,
    p_username: params.username ?? null,
    p_avatar_emoji: params.avatarEmoji ?? null,
    p_banner_color: params.bannerColor ?? null,
    p_birthdate: params.birthdate ?? null,
    p_bio: params.bio ?? null,
    p_city: params.city ?? null,
    p_country: params.country ?? null,
    p_school: params.school ?? null,
    p_github_url: params.githubUrl ?? null,
    p_linkedin_url: params.linkedinUrl ?? null,
    p_website_url: params.websiteUrl ?? null,
  });
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; error?: string };
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}

/**
 * Sends a friend request via server-side RPC.
 */
export async function sendFriendRequest(
  friendCode: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("send_friend_request", {
    p_friend_code: friendCode,
  });
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; error?: string };
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}

/**
 * Accepts a friend request via server-side RPC.
 */
export async function acceptFriendRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("accept_friend_request", {
    p_request_id: requestId,
  });
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; error?: string };
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}

/**
 * Rejects a friend request via server-side RPC.
 */
export async function rejectFriendRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("reject_friend_request", {
    p_request_id: requestId,
  });
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; error?: string };
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}

/**
 * Becomes a supporter of the cause.
 */
export async function becomeSupporter(
  displayName?: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("become_supporter", {
    p_display_name: displayName ?? null,
  });
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; error?: string };
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}

/**
 * Records a donation to the cause.
 */
export async function recordDonation(
  amountSats: number,
  message?: string,
  anonymous?: boolean
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("record_donation", {
    p_amount_sats: amountSats,
    p_message: message ?? null,
    p_anonymous: anonymous ?? false,
  });
  if (error) return { success: false, error: error.message };
  const result = data as { success?: boolean; error?: string };
  if (result.error) return { success: false, error: result.error };
  return { success: true };
}

/**
 * Gets transparency stats (aggregate metrics).
 */
export async function getTransparencyStats(): Promise<{
  totalSatsRaised: number;
  totalSupporters: number;
  totalYouthImpacted: number;
  totalHoursSponsored: number;
  totalProjectsFunded: number;
}> {
  const { data, error } = await supabase.rpc("get_transparency_stats");
  if (error || !data) {
    return {
      totalSatsRaised: 0,
      totalSupporters: 0,
      totalYouthImpacted: 0,
      totalHoursSponsored: 0,
      totalProjectsFunded: 0,
    };
  }
  const result = data as {
    total_sats_raised: number;
    total_supporters: number;
    total_youth_impacted: number;
    total_hours_sponsored: number;
    total_projects_funded: number;
  };
  return {
    totalSatsRaised: result.total_sats_raised,
    totalSupporters: result.total_supporters,
    totalYouthImpacted: result.total_youth_impacted,
    totalHoursSponsored: result.total_hours_sponsored,
    totalProjectsFunded: result.total_projects_funded,
  };
}
