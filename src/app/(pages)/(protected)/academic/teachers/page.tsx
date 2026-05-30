import AcademicCrudPage from "@/app/components/Academic/AcademicCrudPage";
import { academicPageConfigs } from "@/app/config/academicPageConfigs";

export default function AcademicTeachersPage() {
  return <AcademicCrudPage config={academicPageConfigs.teachers} />;
}
