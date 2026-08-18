// auth.js
// Passwordless email OTP auth flow with built-in offline/demo fallback.

import { supabase, isSupabaseConfigured } from "./supabaseClient";

function isNetworkError(err) {
  if (!err) return false;
  return (
    err instanceof TypeError ||
    err?.name === "TypeError" ||
    (typeof err?.message === "string" &&
      (err.message.includes("Failed to fetch") ||
       err.message.includes("ERR_NAME_NOT_RESOLVED") ||
       err.message.includes("NetworkError")))
  );
}

function createMockSession(email) {
  const mockUid = "demo-user-" + (email || "user").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const session = {
    user: {
      id: mockUid,
      email: email || "demo@4u.app",
    },
  };
  try {
    localStorage.setItem("4u_mock_session", JSON.stringify(session));
  } catch (e) {}
  return session;
}

function getMockCurrentProfile() {
  try {
    const sessionRaw = localStorage.getItem("4u_mock_session");
    if (!sessionRaw) return null;
    const session = JSON.parse(sessionRaw);
    const uid = session?.user?.id;
    if (!uid) return null;
    const profileRaw = localStorage.getItem(`4u_mock_profile_${uid}`);
    if (profileRaw) return JSON.parse(profileRaw);
    return { id: uid, name: "Demo User", interests: ["Music", "Tech"], age: 24, coins: 240, streak: 1 };
  } catch (e) {
    return null;
  }
}

// Step 1: user enters their email, gets sent a 6-digit code
export async function requestOtp(email) {
  if (!isSupabaseConfigured()) {
    console.info("Supabase not configured. Using Mock OTP mode.");
    return { mock: true };
  }
  try {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn("Supabase unreachable. Falling back to Mock OTP mode.");
      return { mock: true };
    }
    throw error;
  }
}

// Step 2: user enters the code they received
export async function verifyOtp(email, token) {
  if (!isSupabaseConfigured()) {
    return createMockSession(email);
  }
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) throw error;
    return data.session;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn("Supabase unreachable. Creating local demo session.");
      return createMockSession(email);
    }
    throw error;
  }
}

// Call once right after first successful verifyOtp for a brand-new user.
export async function createProfileIfMissing({ id, name, interests = [], age = null }) {
  if (!isSupabaseConfigured()) {
    const mockProfile = { id, name, interests, age, coins: 240, streak: 1 };
    try {
      localStorage.setItem(`4u_mock_profile_${id}`, JSON.stringify(mockProfile));
    } catch (e) {}
    return mockProfile;
  }
  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existing) return existing;

    const { data, error } = await supabase
      .from("profiles")
      .insert({ id, name, interests, age })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    if (isNetworkError(error)) {
      const mockProfile = { id, name, interests, age, coins: 240, streak: 1 };
      try {
        localStorage.setItem(`4u_mock_profile_${id}`, JSON.stringify(mockProfile));
      } catch (e) {}
      return mockProfile;
    }
    throw error;
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

    const { error } = await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (error) throw error;
    await supabase.auth.signOut();
  } catch (e) {
    await signOut();
  }
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) {
    const mockProfile = getMockCurrentProfile();
    if (mockProfile) callback({ id: mockProfile.id, email: "demo@4u.app" });
    return () => {};
  }
  try {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return () => listener?.subscription?.unsubscribe();
  } catch (e) {
    const mockProfile = getMockCurrentProfile();
    if (mockProfile) callback({ id: mockProfile.id, email: "demo@4u.app" });
    return () => {};
  }
}

