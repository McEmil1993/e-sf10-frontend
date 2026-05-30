import AcademicCrudPage from "@/app/components/Academic/AcademicCrudPage";
import { academicPageConfigs } from "@/app/config/academicPageConfigs";

export default function StudentsGradesPage() {
  return <AcademicCrudPage config={academicPageConfigs.grades} />;
}
