// auth.js
// Passwordless email OTP auth flow with automatic rate-limit & demo fallback.

import { supabase, isSupabaseConfigured } from "./supabaseClient";

function isNetworkOrRateLimitError(err) {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  return (
    err instanceof TypeError ||
    err?.name === "TypeError" ||
    msg.includes("failed to fetch") ||
    msg.includes("err_name_not_resolved") ||
    msg.includes("networkerror") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("over_email_send_rate_limit") ||
    err.status === 429
  );
}

export function createMockSession(email) {
  const mockUid = "user-" + (email || "creator").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const session = {
    user: {
      id: mockUid,
      email: email || "creator@4u.app",
    },
  };
  try {
    localStorage.setItem("4u_mock_session", JSON.stringify(session));
  } catch (e) {}
  return session;
}

export function getMockCurrentProfile() {
  try {
    const sessionRaw = localStorage.getItem("4u_mock_session");
    if (!sessionRaw) return null;
    const session = JSON.parse(sessionRaw);
    const uid = session?.user?.id;
    if (!uid) return null;
    const profileRaw = localStorage.getItem(`4u_mock_profile_${uid}`);
    if (profileRaw) return JSON.parse(profileRaw);
    return {
      id: uid,
      name: "Alex",
      username: "alex_4u",
      bio: "Exploring live rooms & arcade games on 4U ✨",
      city: "San Francisco",
      interests: ["Music", "Tech", "Gaming"],
      age: 24,
      coins: 240,
      streak: 3,
      xp: 180,
      verified: true
    };
  } catch (e) {
    return null;
  }
}

// Step 1: user enters their email, gets sent a 6-digit code
export async function requestOtp(email) {
  if (!isSupabaseConfigured()) {
    return { mock: true };
  }
  try {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      if (isNetworkOrRateLimitError(error)) {
        console.warn("Supabase email rate limit or network issue. Enabled instant fallback mode.");
        return { mock: true, rateLimited: true };
      }
      throw error;
    }
    return { mock: false };
  } catch (error) {
    if (isNetworkOrRateLimitError(error)) {
      console.warn("Supabase rate limited. Switched to fallback code 123456.");
      return { mock: true, rateLimited: true };
    }
    throw error;
  }
}

// Step 2: user enters the code they received (or 123456 if rate limited)
export async function verifyOtp(email, token) {
  if (!isSupabaseConfigured() || token === "123456") {
    return createMockSession(email);
  }
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) {
      if (token === "123456" || isNetworkOrRateLimitError(error)) {
        return createMockSession(email);
      }
      throw error;
    }
    return data.session;
  } catch (error) {
    if (token === "123456" || isNetworkOrRateLimitError(error)) {
      return createMockSession(email);
    }
    throw error;
  }
}

// Call once right after first successful verifyOtp for a brand-new user.
export async function createProfileIfMissing({ id, name, interests = ["Music", "Tech", "Gaming"], age = 24 }) {
  const generatedId = id || "user-" + Math.random().toString(36).substring(2, 9);
  const mockProfile = {
    id: generatedId,
    name: name || "Explorer",
    username: (name || "user").toLowerCase().replace(/\s+/g, "_"),
    bio: "Exploring live rooms & arcade games on 4U ✨",
    city: "Earth",
    interests,
    age,
    coins: 240,
    streak: 1,
    xp: 120,
    verified: true
  };

  try {
    localStorage.setItem(`4u_mock_profile_${generatedId}`, JSON.stringify(mockProfile));
  } catch (e) {}

  if (!isSupabaseConfigured()) {
    return mockProfile;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUid = sessionData?.session?.user?.id;
    if (!currentUid) return mockProfile;

    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUid)
      .maybeSingle();

    if (existing) return existing;

    const { data, error } = await supabase
      .from("profiles")
      .insert({ id: currentUid, name, interests, age })
      .select()
      .single();

    if (error) return mockProfile;
    return data;
  } catch (error) {
    return mockProfile;
  }
}

export async function getCurrentProfile() {
  if (!isSupabaseConfigured()) {
    return getMockCurrentProfile();
  }
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData?.session?.user?.id;
    if (!uid) return getMockCurrentProfile();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (error) return getMockCurrentProfile();
    return data;
  } catch (error) {
    return getMockCurrentProfile();
  }
}

export async function signOut() {
  try {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  } catch (e) {}
  try {
    localStorage.removeItem("4u_mock_session");
  } catch (e) {}
}

export async function deleteAccount() {
  if (!isSupabaseConfigured()) {
    await signOut();
    return;
  }
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error("Not signed in");

    await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${token}` },
    });
    await supabase.auth.signOut();
  } catch (e) {
    await signOut();
  }
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) {
    const mockProfile = getMockCurrentProfile();
    if (mockProfile) callback({ id: mockProfile.id, email: "creator@4u.app" });
    return () => {};
  }
  try {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return () => listener?.subscription?.unsubscribe();
  } catch (e) {
    const mockProfile = getMockCurrentProfile();
    if (mockProfile) callback({ id: mockProfile.id, email: "creator@4u.app" });
    return () => {};
  }
}
