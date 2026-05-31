import AcademicCrudPage from "@/app/components/Academic/AcademicCrudPage";
import { academicPageConfigs } from "@/app/config/academicPageConfigs";

export default function AcademicEnrollmentsPage() {
  return <AcademicCrudPage config={academicPageConfigs.enrollments} />;
}
