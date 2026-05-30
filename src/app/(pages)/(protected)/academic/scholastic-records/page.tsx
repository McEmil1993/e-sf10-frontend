import AcademicCrudPage from "@/app/components/Academic/AcademicCrudPage";
import { academicPageConfigs } from "@/app/config/academicPageConfigs";

export default function AcademicScholasticRecordsPage() {
  return <AcademicCrudPage config={academicPageConfigs.scholasticRecords} />;
}
