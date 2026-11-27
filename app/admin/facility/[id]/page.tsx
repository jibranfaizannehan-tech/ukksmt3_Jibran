import { FacilityForm } from "../facility-form";

type EditFacilityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditFacilityPage({
  params,
}: EditFacilityPageProps) {
  const { id } = await params;
  return <FacilityForm facilityId={id} />;
}
