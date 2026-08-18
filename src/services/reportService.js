import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { fileReport as matchmakingReport } from "../matchmaking";

export async function fileSafetyReport(reporterId, reportedId, context, reason) {
  if (!isSupabaseConfigured()) {
    return { success: true };
  }
  return await matchmakingReport(reporterId, reportedId, context, reason);
}
