import { requestOtp as authRequestOtp, verifyOtp as authVerifyOtp, createProfileIfMissing, getCurrentProfile, signOut as authSignOut, deleteAccount as authDeleteAccount, onAuthStateChange } from "../auth";

export async function requestOtp(email) {
  return await authRequestOtp(email);
}

export async function verifyOtp(email, token) {
  return await authVerifyOtp(email, token);
}

export async function createProfile({ id, name, username, interests = [], favoriteGames = [], age = null }) {
  return await createProfileIfMissing({ id, name, username, interests, favoriteGames, age });
}

export async function getProfile() {
  return await getCurrentProfile();
}

export async function signOut() {
  return await authSignOut();
}

export async function deleteAccount() {
  return await authDeleteAccount();
}

export { onAuthStateChange };
