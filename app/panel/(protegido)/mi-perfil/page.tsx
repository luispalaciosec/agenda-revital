import { obtenerMiPerfil } from "@/lib/usuarios/mi-perfil";
import { VistaMiPerfil } from "./_componentes/vista-mi-perfil";

export default async function PaginaMiPerfil() {
  const perfil = await obtenerMiPerfil();

  return (
    <div className="mx-auto max-w-lg p-4 sm:p-6">
      <h1 className="mb-1 text-[22px] font-semibold text-text">Mi perfil</h1>
      <p className="mb-5 text-sm text-text-muted">Tu nombre, foto, correo y contraseña. Solo tú puedes editarlos.</p>
      <VistaMiPerfil perfil={perfil} />
    </div>
  );
}
