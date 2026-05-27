import { notFound } from "next/navigation";
import StudentDetailView from "@/app/components/Student/StudentDetailView";
import { decodeStudentRouteId } from "@/app/utils/studentRouteToken";

type StudentInformationPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page(props: StudentInformationPageProps) {
  const { id } = await props.params;
  const studentId = decodeStudentRouteId(id);

  if (studentId === null) {
    notFound();
  }

  return <StudentDetailView studentId={studentId} />;
}
