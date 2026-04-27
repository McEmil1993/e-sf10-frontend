import { redirect } from "next/navigation";
import ProfileEditor from "@/app/(pages)/(protected)/profile/profile-editor";
import ProfilePasswordForm from "@/app/(pages)/(protected)/profile/profile-password-form";
import PagePlaceholder from "@/app/components/PagePlaceholder/PagePlaceholder";
import { getSessionData } from "@/app/utils/auth";
import { fetchCurrentUserWithToken } from "@/app/utils/api";

export default async function ProfilePage() {
  const session = await getSessionData();

  if (!session?.token) {
    redirect("/login");
  }

  const user = await fetchCurrentUserWithToken(session.token);

  return (
    <PagePlaceholder
      breadcrumb="Home > Profile"
      sectionLabel="Account panel"
      title="Profile"
    >
      <ProfileEditor
        initialUser={user}
        key={JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          profile_picture: user.profile_picture,
          position: user.position,
          contact_number: user.contact_number,
          address: user.address,
          barangay: user.barangay,
          municipality_city: user.municipality_city,
          province: user.province,
          region: user.region,
          roles: user.roles,
          status: user.status,
        })}
      />
      <ProfilePasswordForm />
    </PagePlaceholder>
  );
}
