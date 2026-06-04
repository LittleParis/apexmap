export function Footer() {
  return (
    <footer className="relative z-10 px-6 py-4 mt-8 text-center">
      <div className="h-px w-full mb-4" style={{ background: 'linear-gradient(to right, transparent, var(--border-subtle), transparent)' }} />
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>数据来源: apexlegendsstatus.com</span>
        <span className="opacity-30">|</span>
        <span>ApexMap Live v1.0</span>
        <span className="opacity-30">|</span>
        <span>Apex Legends &copy; Respawn Entertainment / EA</span>
      </div>
    </footer>
  );
}
