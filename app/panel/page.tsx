import { redirect } from "next/navigation";

export default function PaginaPanel() {
  // Agenda del día es la vista por defecto del panel (§8.2). El guard de
  // sesión vive en (protegido)/layout.tsx, que corre después de este redirect.
  redirect("/panel/agenda");
}
