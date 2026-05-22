export default function UpdateBanner({ version, notes, onDismiss }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-start justify-between gap-4 px-5 py-3 text-sm"
      style={{ background: 'linear-gradient(135deg,#02005B,#0d0080)', color: '#fff' }}>
      <div className="flex items-start gap-3">
        <span className="text-yellow-300 text-base shrink-0">⚡</span>
        <div>
          <p className="font-semibold">Nueva versión disponible — v{version}</p>
          {notes.length > 0 && (
            <ul className="mt-1 space-y-0.5 opacity-80 text-xs">
              {notes.map((n, i) => <li key={i}>· {n}</li>)}
            </ul>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0 mt-0.5">
        <button
          onClick={() => window.location.reload()}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 border border-white/30 cursor-pointer transition-all">
          Actualizar ahora
        </button>
        <button
          onClick={onDismiss}
          className="text-white/60 hover:text-white bg-transparent border-0 cursor-pointer text-lg leading-none">
          ×
        </button>
      </div>
    </div>
  )
}
