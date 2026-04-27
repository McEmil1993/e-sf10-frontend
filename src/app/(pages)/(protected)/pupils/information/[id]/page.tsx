import { notFound } from "next/navigation";
import PupilDetailView from "@/app/components/Pupil/PupilDetailView";

export default async function Page(props: PageProps<"/pupils/information/[id]">) {
  const { id } = await props.params;
  const pupilId = Number(id);

  if (!Number.isInteger(pupilId) || pupilId <= 0) {
    notFound();
  }

  return <PupilDetailView pupilId={pupilId} />;
}
