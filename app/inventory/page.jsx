'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Grid3x3, List } from 'lucide-react';
import { CARS, CATEGORIES, categoryOf, headlineStats } from '@/lib/cars';

// Short context line shown above the results for the active category.
const CATEGORY_INTRO = {
  '': 'Everything in stock right now: electric vehicles, plus the solar, battery and charging products that power them.',
  Vehicles: 'All-electric sedans, SUVs and trucks, from the everyday Model 3 to the tri-motor Model X Plaid. Every vehicle listed is ready for immediate delivery.',
  Solar: 'Generate your own clean electricity with low-profile panels or a full glass-tile roof. Installation is included.',
  Battery: 'Store solar energy for the evening and keep the lights on through outages with Powerwall. Installation is included.',
  Charging: 'Charge at home with the Wall Connector, or bring Supercharging to your business property. Installation is included.',
};

export default function InventoryPage() {
  const [category, setCategory] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [range, setRange] = useState('');
  const [list, setList] = useState(false);

  const inCategory = CARS.filter((c) => !category || categoryOf(c) === category);
  const models = [...new Set(inCategory.map((c) => c.model))].sort();
  const years = [...new Set(inCategory.map((c) => String(c.year)))].sort().reverse();
  const counts = Object.fromEntries(CATEGORIES.map((k) => [k, CARS.filter((c) => categoryOf(c) === k).length]));
  const pickCategory = (k) => { setCategory(k); setModel(''); setYear(''); };
  const resetFilters = () => { setModel(''); setYear(''); setRange(''); };

  const filtered = inCategory.filter((c) => {
    if (model && c.model !== model) return false;
    if (year && String(c.year) !== year) return false;
    if (range) {
      if (range === '150000+') { if (c.price < 150000) return false; }
      else {
        const [lo, hi] = range.split('-').map(Number);
        if (c.price < lo || c.price > hi) return false;
      }
    }
    return true;
  });

  return (
    <>
      {/* Hero: the interior shot is shown whole (object-contain), never cropped */}
      <section className="panel mb-8 overflow-hidden">
        <div className="grid items-center gap-0 lg:grid-cols-5">
          <div className="order-2 p-6 sm:p-10 lg:order-1 lg:col-span-2">
            <p className="mb-3 text-sm font-medium mut">Inventory</p>
            <h1 className="text-3xl font-semibold hi sm:text-4xl">Browse Inventory</h1>
            <p className="mt-4 text-base mut">
              Explore premium electric vehicles, solar, home batteries and charging, ready for immediate delivery.
              Every listing includes a full description, headline specs and pricing.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {CATEGORIES.map((k) => (
                <button
                  key={k}
                  onClick={() => pickCategory(k)}
                  className="rounded-lg border px-3 py-2 text-left transition hover-tx"
                  style={{ borderColor: 'var(--hairline-strong)' }}
                >
                  <span className="block text-xs faint">{k}</span>
                  <span className="block text-lg font-medium hi">{counts[k]} <span className="text-xs font-normal mut">in stock</span></span>
                </button>
              ))}
            </div>
          </div>
          <figure className="order-1 lg:order-2 lg:col-span-3">
            <img
              src="/assets/inventory/interior.avif"
              alt="Model Y cabin with light seats in three rows beneath an all-glass roof"
              width={1920}
              height={960}
              decoding="async"
              className="block h-auto w-full object-contain"
            />
            <figcaption className="px-6 py-3 text-xs faint lg:px-4">
              Model Y cabin: seating for up to seven under an expansive glass roof.
            </figcaption>
          </figure>
        </div>
      </section>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters */}
        <div className="lg:w-1/4">
          <div className="panel p-6 lg:sticky lg:top-24">
            <h2 className="mb-6 text-lg font-medium hi">Filters</h2>
            <div className="space-y-4">
              <Field label="Model">
                <select value={model} onChange={(e) => setModel(e.target.value)} className="inp">
                  <option value="">All Models</option>
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Year">
                <select value={year} onChange={(e) => setYear(e.target.value)} className="inp">
                  <option value="">All Years</option>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </Field>
              <Field label="Price Range">
                <select value={range} onChange={(e) => setRange(e.target.value)} className="inp">
                  <option value="">All Prices</option>
                  <option value="0-50000">Under $50,000</option>
                  <option value="50000-75000">$50,000 - $75,000</option>
                  <option value="75000-100000">$75,000 - $100,000</option>
                  <option value="100000-150000">$100,000 - $150,000</option>
                  <option value="150000+">$150,000+</option>
                </select>
              </Field>
              <button className="btn btn-pri w-full" onClick={resetFilters}>Reset All</button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:w-3/4">
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product category">
            {['', ...CATEGORIES].map((k) => (
              <button
                key={k || 'all'}
                role="tab"
                aria-selected={category === k}
                onClick={() => pickCategory(k)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${category === k ? 'bg-white text-black' : 'mut hover-tx'}`}
                style={{ borderColor: category === k ? 'transparent' : 'var(--hairline-strong)' }}
              >
                {k || 'All'} <span className="ml-1 text-xs opacity-60">{k ? counts[k] : CARS.length}</span>
              </button>
            ))}
          </div>

          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="mb-1 text-2xl font-light hi">{category === 'Vehicles' ? 'Available Vehicles' : category ? `${category} Products` : 'All Products'}</h2>
              <p className="max-w-2xl text-sm mut">{CATEGORY_INTRO[category]}</p>
              <p className="mt-2 text-xs faint">Showing {filtered.length} of {inCategory.length} {category === 'Vehicles' ? 'vehicles' : 'products'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button onClick={() => setList(false)} aria-label="Grid view" className={`rounded-lg p-2 ${!list ? 'hi' : 'mut'}`}><Grid3x3 size={20} /></button>
              <button onClick={() => setList(true)} aria-label="List view" className={`rounded-lg p-2 ${list ? 'hi' : 'mut'}`}><List size={20} /></button>
            </div>
          </div>

          <div className={list ? 'flex flex-col gap-6' : 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'}>
            {filtered.map((c) => (
              <article key={c.slug} className={`card flex overflow-hidden ${list ? 'flex-col md:flex-row' : 'flex-col'}`}>
                {/* Images are shrunk to fit the frame (object-contain), never cropped */}
                <Link
                  href={`/inventory/${c.slug}`}
                  className={`relative flex items-center justify-center ${list ? 'aspect-[16/9] md:aspect-auto md:w-2/5' : 'aspect-[16/9]'}`}
                  style={{ background: 'var(--panel-2)' }}
                >
                  <img src={c.image} alt={c.name} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                  {c.badge && <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-black">{c.badge}</span>}
                </Link>
                <div className={`flex flex-1 flex-col p-5 ${list ? 'md:w-3/5' : ''}`}>
                  <p className="text-xs faint">{c.year} {c.model} · {categoryOf(c)}</p>
                  <Link href={`/inventory/${c.slug}`}>
                    <h3 className="mt-1 text-lg font-medium hi">{c.name}</h3>
                  </Link>
                  {c.tagline && <p className="mt-1 text-sm font-medium hi opacity-80">{c.tagline}</p>}
                  {c.description && (
                    <p className={`mt-2 text-sm mut ${list ? '' : 'line-clamp-4'}`}>{c.description}</p>
                  )}
                  <div className="mb-4 mt-4 grid grid-cols-3 gap-3 border-y py-3 text-xs" style={{ borderColor: 'var(--hairline)' }}>
                    {headlineStats(c).map((s) => (
                      <div key={s.label}><span className="font-medium blut">{s.value}</span><span className="block text-[10px] faint">{s.label}</span></div>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium grn">Starting at {c.priceLabel}*</p>
                      <p className="text-xs mut">{categoryOf(c) === 'Vehicles' ? 'After Est. Gas Savings' : 'Installation included'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/inventory/${c.slug}`} className="rounded border px-3 py-1.5 text-xs font-medium hi" style={{ borderColor: 'var(--hairline-strong)' }}>Learn</Link>
                      <Link href={`/inventory/${c.slug}/checkout`} className="btn btn-pri" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Order</Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="panel p-10 text-center">
              <p className="text-sm mut">No products match these filters.</p>
              <button onClick={resetFilters} className="mt-3 text-sm font-medium hi underline">Clear filters</button>
            </div>
          )}
        </div>
      </div>

      {/* Context: the rest of the photography, shown whole */}
      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <ContextCard
          image="/assets/inventory/model-y-fleet.avif"
          width={3370}
          height={1430}
          alt="Three Model Y vehicles driving along a city waterfront at sunset"
          title="In stock, ready to go"
          text="Every vehicle on this page is available for immediate delivery. Open any model to compare its full specs, from battery and drive to seating, towing and cargo, before you order."
          action={{ label: 'See vehicles', onClick: () => pickCategory('Vehicles') }}
        />
        <ContextCard
          image="/assets/inventory/model-3-road.avif"
          width={3370}
          height={1430}
          alt="Silver Model 3 driving on a desert highway"
          title="Power the drive at home"
          text="Pair your vehicle with a Wall Connector for fast home charging, then add Solar and Powerwall to run it on energy you generate yourself."
          action={{ label: 'See charging', onClick: () => pickCategory('Charging') }}
        />
      </section>
    </>
  );
}

function ContextCard({ image, width, height, alt, title, text, action }) {
  return (
    <article className="panel flex flex-col overflow-hidden">
      <img src={image} alt={alt} width={width} height={height} loading="lazy" decoding="async" className="block h-auto w-full object-contain" />
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-lg font-medium hi">{title}</h3>
        <p className="mt-2 text-sm mut">{text}</p>
        <button
          onClick={() => { action.onClick(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="mt-4 self-start text-sm font-medium hi underline"
        >
          {action.label}
        </button>
      </div>
    </article>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium mut">{label}</h3>
      {children}
    </div>
  );
}
