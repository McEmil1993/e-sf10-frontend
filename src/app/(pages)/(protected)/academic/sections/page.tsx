import AcademicCrudPage from "@/app/components/Academic/AcademicCrudPage";
import { academicPageConfigs } from "@/app/config/academicPageConfigs";

export default function AcademicSectionsPage() {
  return <AcademicCrudPage config={academicPageConfigs.sections} />;
}
