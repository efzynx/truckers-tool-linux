export default function GarageEditor() {
  return (
    <div className="animate-fade-in">
      <h3 className="text-xl font-bold text-text-primary mb-1 flex items-center gap-2">
        🏠 Garasi
      </h3>
      <p className="text-text-muted text-sm mb-6">Kelola garasi kamu</p>

      <div className="bg-bg-primary border border-border rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">🚧</div>
        <h4 className="text-text-primary font-semibold mb-2">Coming Soon</h4>
        <p className="text-text-muted text-sm">
          Fitur edit garasi akan tersedia di update selanjutnya.
          <br />
          Termasuk: buka semua garasi, upgrade garasi, dan kelola driver.
        </p>
      </div>
    </div>
  );
}
