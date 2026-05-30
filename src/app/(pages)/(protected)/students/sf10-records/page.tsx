import AcademicCrudPage from "@/app/components/Academic/AcademicCrudPage";
import { academicPageConfigs } from "@/app/config/academicPageConfigs";

export default function StudentsSf10RecordsPage() {
  return <AcademicCrudPage config={academicPageConfigs.sf10Records} />;
}
