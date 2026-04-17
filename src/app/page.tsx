import { redirect } from "next/navigation";
import { getSessionUser } from "@/app/utils/auth";

export default async function HomePage() {
  const user = await getSessionUser();
  redirect(user ? "/dashboard" : "/login");
}
