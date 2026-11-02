export default function CatalogLoading() {
  return (
    <div className="container page-shell">
      <div className="skeleton" style={{ width: 280, height: 42, borderRadius: 12, marginBottom: 24 }} />
      <div className="catalog-layout">
        <div className="surface skeleton" style={{ minHeight: 430 }} />
        <div className="catalog-grid">{Array.from({ length: 8 }, (_, index) => <div key={index}><div className="skeleton" style={{ aspectRatio: '3/4.15', borderRadius: 17 }} /><div className="skeleton" style={{ height: 14, marginTop: 12, borderRadius: 6 }} /></div>)}</div>
      </div>
    </div>
  );
}
