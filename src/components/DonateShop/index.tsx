import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { Reveal, SectionTitle } from '../ui';

export default function DonateShop() {
  return <Reveal id="donate-shop" className="donate-shop wrap">
    <SectionTitle eyebrow="ПІДТРИМКА ПРОЄКТУ" title="ДОНАТ-МАГАЗИН" accent="PRIME">
      <span className="donate-shop-badge">СКОРО</span>
    </SectionTitle>
    <div className="donate-shop-placeholder">
      <div className="donate-shop-icon"><ShoppingBag size={28}/></div>
      <div><h3>Магазин готується до відкриття</h3><p>Тут з’являться PRIME-бонуси, підписки та інші можливості для підтримки проєкту. Каталог і безпечна оплата будуть додані після запуску магазину.</p></div>
      <a className="text-link" href="#donate-shop">ДІЗНАТИСЯ БІЛЬШЕ<ArrowUpRight size={18}/></a>
    </div>
  </Reveal>;
}
