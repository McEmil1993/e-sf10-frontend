import LoginForm from "@/app/components/Login/LoginForm";
import { requireGuest } from "@/app/utils/auth";
import { getUsers } from "@/app/utils/mockData";

export default async function LoginPage() {
  await requireGuest();

  const users = await getUsers();
  const sampleEmails = users
    .filter((user) => user.status === "active")
    .slice(0, 4)
    .map((user) => user.email);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-[400px]">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white">
            ES
          </div>
        </div>
        <div className="rounded-md border border-border bg-white p-6 shadow-sm sm:p-8">
          <LoginForm sampleEmails={sampleEmails} />
        </div>
      </section>
    </main>
  );
}
