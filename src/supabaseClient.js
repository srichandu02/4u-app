// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const appMode = import.meta.env.VITE_APP_MODE || (import.meta.env.PROD ? "production" : "development");

export const isProductionMode = () => appMode === "production";
export const getAppMode = () => appMode;

export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === "string" &&
    supabaseUrl.length > 10 &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseUrl.includes("your-project") &&
    typeof supabaseAnonKey === "string" &&
    supabaseAnonKey.length > 20 &&
    !supabaseAnonKey.includes("placeholder") &&
    !supabaseAnonKey.includes("your-anon-public-key")
  );
};

if (!isSupabaseConfigured()) {
  if (isProductionMode()) {
    console.error(
      "4U Production Error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or invalid in production mode."
    );
  } else {
    console.info("4U Dev Info: Supabase not configured. Running in interactive demo mode.");
  }
}

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured() ? supabaseAnonKey : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
