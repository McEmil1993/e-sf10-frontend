import { notFound } from "next/navigation";
import PupilDetailView from "@/app/components/Pupil/PupilDetailView";
import { decodePupilRouteId } from "@/app/utils/pupilRouteToken";

export default async function Page(props: PageProps<"/pupils/information/[id]">) {
  const { id } = await props.params;
  const pupilId = decodePupilRouteId(id);

  if (pupilId === null) {
    notFound();
  }

  return <PupilDetailView pupilId={pupilId} />;
}
