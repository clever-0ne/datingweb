'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Grid3x3, List } from 'lucide-react';
import { CARS } from '@/lib/cars';

export default function InventoryPage() {
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [range, setRange] = useState('');
  const [list, setList] = useState(false);

  const filtered = CARS.filter((c) => {
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
        <p className="mb-3 text-sm font-medium text-slate-400">Inventory</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Browse Inventory</h1>
        <p className="mx-auto mt-4 max-w-3xl text-base text-slate-400">
          Explore premium electric vehicles ready for immediate delivery.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters */}
        <div className="lg:w-1/4">
          <div className="panel p-6">
            <h2 className="mb-6 text-lg font-medium text-white">Filters</h2>
            <div className="space-y-4">
              <Field label="Model">
                <select value={model} onChange={(e) => setModel(e.target.value)} className="inp">
                  <option value="">All Models</option>
                  {['Cybertruck', 'Model 3', 'Model S', 'Model X', 'Model Y'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Year">
                <select value={year} onChange={(e) => setYear(e.target.value)} className="inp">
                  <option value="">All Years</option>
                  {['2024', '2022', '2021', '2020'].map((y) => <option key={y} value={y}>{y}</option>)}
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="mb-1 text-2xl font-light text-white">Available Vehicles</h2>
              <p className="text-sm mut">Showing {filtered.length} of {CARS.length} vehicles</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setList(false)} className={`rounded-lg p-2 ${!list ? 'text-white' : 'text-slate-400'}`}><Grid3x3 size={20} /></button>
              <button onClick={() => setList(true)} className={`rounded-lg p-2 ${list ? 'text-white' : 'text-slate-400'}`}><List size={20} /></button>
            </div>
          </div>

          <div className={list ? 'flex flex-col gap-6' : 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'}>
            {filtered.map((c) => (
              <article key={c.slug} className={`card overflow-hidden ${list ? 'flex md:flex-row' : ''}`}>
                <Link href={`/inventory/${c.slug}`} className={`relative overflow-hidden ${list ? 'md:w-2/5' : 'aspect-[16/9]'}`}>
                  <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                  {c.badge && <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-xs font-medium text-black">{c.badge}</span>}
                </Link>
                <div className="p-4">
                  <Link href={`/inventory/${c.slug}`}>
                    <h3 className="mb-1 text-base font-medium text-white">{c.name}</h3>
                  </Link>
                  <p className="text-sm mut">{c.year} {c.model}</p>
                  <div className="mb-3 mt-3 flex items-center gap-6 text-xs">
                    <div><span className="font-medium blut">{c.range}</span><span className="block text-[10px] faint">Range</span></div>
                    <div><span className="font-medium blut">{c.accel}</span><span className="block text-[10px] faint">0-60 mph</span></div>
                    <div><span className="font-medium blut">{c.topSpeed}</span><span className="block text-[10px] faint">Top Speed</span></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium grn">Starting at {c.priceLabel}*</p>
                      <p className="text-xs mut">After Est. Gas Savings</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/inventory/${c.slug}`} className="rounded border px-3 py-1.5 text-xs font-medium text-white" style={{ borderColor: 'rgba(148,163,184,.3)' }}>Learn</Link>
                      <Link href={`/inventory/${c.slug}/checkout`} className="btn btn-pri" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>Order</Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-400">{label}</h3>
      {children}
    </div>
  );
}
