import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/app/types/authTypes";
import type { AdminUser } from "@/app/types/userTypes";
import { getUserByEmail } from "@/app/utils/mockData";

export const AUTH_COOKIE_NAME = "tmc-itclub-session";

function toSessionUser(user: AdminUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    status: user.status,
    created_at: user.created_at,
  };
}

export async function createSession(user: AdminUser) {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, JSON.stringify(toSessionUser(user)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!cookieValue) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(cookieValue) as SessionUser;
    const matchedUser = await getUserByEmail(parsedUser.email);

    if (!matchedUser || matchedUser.status !== "active") {
      return null;
    }

    return toSessionUser(matchedUser);
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
