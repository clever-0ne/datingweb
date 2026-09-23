'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Grid3x3, List } from 'lucide-react';
import { CARS, CATEGORIES, categoryOf, headlineStats } from '@/lib/cars';

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
      {/* Hero */}
      <div className="panel relative mb-8 p-6 text-center sm:p-10">
        <p className="mb-3 text-sm font-medium mut">Inventory</p>
        <h1 className="text-3xl font-semibold hi sm:text-4xl">Browse Inventory</h1>
        <p className="mx-auto mt-4 max-w-3xl text-base mut">
          Explore premium electric vehicles, solar, home batteries and charging, ready for immediate delivery.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters */}
        <div className="lg:w-1/4">
          <div className="panel p-6">
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
              <button className="btn btn-pri w-full" onClick={() => { setModel(''); setYear(''); setRange(''); }}>Reset All</button>
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

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="mb-1 text-2xl font-light hi">{category === 'Vehicles' ? 'Available Vehicles' : category ? `${category} Products` : 'All Products'}</h2>
              <p className="text-sm mut">Showing {filtered.length} of {inCategory.length} {category === 'Vehicles' ? 'vehicles' : 'products'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setList(false)} className={`rounded-lg p-2 ${!list ? 'hi' : 'mut'}`}><Grid3x3 size={20} /></button>
              <button onClick={() => setList(true)} className={`rounded-lg p-2 ${list ? 'hi' : 'mut'}`}><List size={20} /></button>
            </div>
          </div>

          <div className={list ? 'flex flex-col gap-6' : 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'}>
            {filtered.map((c) => (
              <article key={c.slug} className={`card overflow-hidden ${list ? 'flex md:flex-row' : ''}`}>
                <Link href={`/inventory/${c.slug}`} className={`relative overflow-hidden ${list ? 'md:w-2/5' : 'aspect-[16/9]'}`}>
                  <img src={c.image} alt={c.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                  {c.badge && <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-black">{c.badge}</span>}
                </Link>
                <div className="p-4">
                  <Link href={`/inventory/${c.slug}`}>
                    <h3 className="mb-1 text-base font-medium hi">{c.name}</h3>
                  </Link>
                  <p className="text-sm mut">{c.year} {c.model} · {categoryOf(c)}</p>
                  <div className="mb-3 mt-3 flex items-center gap-6 text-xs">
                    {headlineStats(c).map((s) => (
                      <div key={s.label}><span className="font-medium blut">{s.value}</span><span className="block text-[10px] faint">{s.label}</span></div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
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
              <button onClick={() => { setModel(''); setYear(''); setRange(''); }} className="mt-3 text-sm font-medium hi underline">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </>
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
