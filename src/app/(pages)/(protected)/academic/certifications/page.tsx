import AcademicCrudPage from "@/app/components/Academic/AcademicCrudPage";
import { academicPageConfigs } from "@/app/config/academicPageConfigs";

export default function AcademicCertificationsPage() {
  return <AcademicCrudPage config={academicPageConfigs.certifications} />;
}
