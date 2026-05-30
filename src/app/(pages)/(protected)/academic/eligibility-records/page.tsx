import AcademicCrudPage from "@/app/components/Academic/AcademicCrudPage";
import { academicPageConfigs } from "@/app/config/academicPageConfigs";

export default function AcademicEligibilityRecordsPage() {
  return <AcademicCrudPage config={academicPageConfigs.eligibilityRecords} />;
}
