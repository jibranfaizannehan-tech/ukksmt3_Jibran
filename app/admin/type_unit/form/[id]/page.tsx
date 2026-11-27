import { Suspense } from "react"
import { TypeUnitForm } from "@/app/admin/type_unit/form/type_unit-form"

type EditTypeUnitPageProps = {
  params: Promise<{ id: string }>
}

// Ambil ID dari URL dinamis dan teruskan ke form relasi Type Unit.
async function EditTypeUnitLoader({ params }: EditTypeUnitPageProps) {
  const { id } = await params
  return <TypeUnitForm unitId={id} />
}

// Bungkus loader dengan fallback saat Next.js menyelesaikan parameter route.
export default function EditTypeUnitPage({ params }: EditTypeUnitPageProps) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Memuat form...</div>}>
      <EditTypeUnitLoader params={params} />
    </Suspense>
  )
}