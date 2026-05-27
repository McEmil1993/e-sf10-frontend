import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/app/types/authTypes";
import type { AdminUser } from "@/app/types/userTypes";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE,
  type AuthSessionCookie,
  createAuthSession,
  fetchCurrentUserWithToken,
  parseAuthSessionCookie,
  serializeAuthSessionCookie,
} from "@/app/utils/api";

export async function createSession({
  token,
  user,
}: {
  token: string;
  user: AdminUser;
}) {
  const cookieStore = await cookies();
  const session = createAuthSession(token, user);

  cookieStore.set(AUTH_COOKIE_NAME, serializeAuthSessionCookie(session), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getSessionData(): Promise<AuthSessionCookie | null> {
  const cookieStore = await cookies();
  return parseAuthSessionCookie(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSessionData();

  if (!session) {
    return null;
  }

  try {
    const matchedUser = await fetchCurrentUserWithToken(session.token);

    if (matchedUser.status !== "active") {
      return null;
    }

    return createAuthSession(session.token, matchedUser).user;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireGuest() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }
}
