"use server";

import { redirect } from "next/navigation";
import type { LoginState } from "@/app/types/authTypes";
import { clearSession, createSession } from "@/app/utils/auth";
import { getUserByEmail } from "@/app/utils/mockData";

export async function loginAction(
  previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? previousState.email)
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? previousState.password).trim();

  if (!email) {
    return {
      error: "Email is required.",
      email: "",
      password,
    };
  }

  if (!password) {
    return {
      error: "Password is required.",
      email,
      password: "",
    };
  }

  const user = await getUserByEmail(email);

  if (!user) {
    return {
      error: "No account found for that email.",
      email,
      password,
    };
  }

  if (user.status !== "active") {
    return {
      error: "Only active users can sign in.",
      email,
      password,
    };
  }

  if ((user.password ?? "") !== password) {
    return {
      error: "Incorrect password.",
      email,
      password: "",
    };
  }

  await createSession(user);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
