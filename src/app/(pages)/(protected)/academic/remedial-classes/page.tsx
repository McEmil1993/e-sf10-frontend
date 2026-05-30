import AcademicCrudPage from "@/app/components/Academic/AcademicCrudPage";
import { academicPageConfigs } from "@/app/config/academicPageConfigs";

export default function AcademicRemedialClassesPage() {
  return <AcademicCrudPage config={academicPageConfigs.remedialClasses} />;
}
