import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <Link href="/" className="brand" style={{ fontSize: 16 }}><span className="brand-mark" style={{ width: 30, height: 30, borderRadius: 11 }}><Sparkles size={15} /></span><span>avitary</span></Link>
          <div className="footer-copy" style={{ marginTop: 9 }}>Личное пространство для любимых историй. Собирайте коллекцию, делитесь впечатлениями и возвращайтесь к тому, что вдохновляет.</div>
        </div>
        <div className="footer-links">
          <Link href="/catalog">Каталог</Link>
          <Link href="/library">Коллекция</Link>
          <Link href="/register">Создать профиль</Link>
        </div>
        <div className="footer-copy">© {new Date().getFullYear()} Avitary · Сделано с любовью к историям</div>
      </div>
    </footer>
  );
}
