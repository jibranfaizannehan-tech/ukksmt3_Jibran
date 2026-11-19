import { redirect } from "next/navigation"
import { getAuthenticatedUser } from "@/lib/auth"

export default async function UserManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  if (!user) redirect("/")
  if (user.role !== "admin") redirect("/admin")

  return children
}
