import AcademicCrudPage from "@/app/components/Academic/AcademicCrudPage";
import { academicPageConfigs } from "@/app/config/academicPageConfigs";

export default function AcademicSchoolYearsPage() {
  return <AcademicCrudPage config={academicPageConfigs.schoolYears} />;
}
