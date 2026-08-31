export function EnConstruccion({ titulo }: { titulo: string }) {
  return (
    <div className="p-6">
      <h1 className="text-[22px] font-semibold text-text">{titulo}</h1>
      <div className="mt-4 rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
        <p className="text-[15px] text-text-muted">Esta sección todavía no está construida.</p>
      </div>
    </div>
  );
}
