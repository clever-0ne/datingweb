'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { findCar, CAR_COLORS } from '@/lib/cars';

export default function CarOrderPage() {
  const { slug } = useParams();
  const car = findCar(slug);
  const [color, setColor] = useState('Pearl White');

  useEffect(() => {
    try { const c = localStorage.getItem('carColor'); if (c) setColor(c); } catch (e) {}
  }, []);

  const pickColor = (name) => {
    setColor(name);
    try { localStorage.setItem('carColor', name); } catch (e) {}
  };

  return (
    <>
      {/* Breadcrumb */}
      <Link href="/inventory" className="mb-4 inline-flex items-center text-xs font-medium mut hover-tx">
        <ArrowLeft size={14} className="mr-1" /> Back to Inventory
      </Link>

      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-[#0a0e18]">
        <img src={car.image} alt={car.name} className="h-72 w-full object-cover sm:h-96" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e18]/90 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 sm:p-8">
          {car.badge && <span className="mb-2 inline-flex rounded-full bg-white px-2 py-0.5 text-xs font-medium text-black">{car.badge}</span>}
          <h1 className="text-3xl font-light hi">{car.name}</h1>
          <p className="mt-1 text-sm mut">{car.tagline}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Headline specs */}
          <div className="grid grid-cols-3 gap-4">
            <Spec label="Range" value={car.range} />
            <Spec label="0-60 mph" value={car.accel} />
            <Spec label="Top Speed" value={car.topSpeed} />
          </div>

          {/* Overview */}
          <div className="panel p-6">
            <h2 className="mb-3 text-lg font-semibold hi">Overview</h2>
            <p className="text-sm leading-relaxed mut">{car.description}</p>
          </div>

          {/* Full specifications */}
          <div className="panel p-6">
            <h2 className="mb-4 text-lg font-semibold hi">Full Specifications</h2>
            <div className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
              {car.specs.map((s) => (
                <div key={s.label} className="flex items-baseline justify-between gap-4 border-b py-2.5" style={{ borderColor: 'var(--soft)' }}>
                  <span className="text-xs mut">{s.label}</span>
                  <span className="text-sm font-medium text-right hi">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="panel p-6 lg:sticky lg:top-4">
            <h2 className="mb-1 text-lg font-semibold hi">Order Summary</h2>
            <p className="mb-4 text-sm mut">{car.year} {car.name}</p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="mut">Starting price</span>
                <span className="font-medium grn">{car.priceLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="mut">After Est. Gas Savings</span>
                <span className="mut">Included</span>
              </div>
              <div className="flex justify-between border-t pt-3 font-medium hi" style={{ borderColor: 'var(--hairline)' }}>
                <span>Total</span>
                <span>{car.priceLabel}</span>
              </div>
            </div>

            {/* Color selector */}
            <div className="mt-6">
              <p className="mb-3 text-sm mut">Exterior Color</p>
              <div className="flex flex-wrap gap-2">
                {CAR_COLORS.map((c) => (
                  <button
                    key={c.name}
                    title={c.name}
                    aria-label={c.name}
                    onClick={() => pickColor(c.name)}
                    className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${color === c.name ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0e18]' : 'border-gray-500'}`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs mut">{color}</p>
            </div>

            <Link href={`/inventory/${car.slug}/checkout`} className="btn btn-pri mt-6 w-full py-3">
              Continue to Checkout
            </Link>
            <p className="mt-3 text-center text-[11px] faint">Purchases are completed from your main balance</p>
          </div>
        </div>
      </div>
    </>
  );
}

function Spec({ label, value }) {
  return (
    <div className="panel p-4 text-center">
      <p className="mb-1 text-xs mut">{label}</p>
      <p className="text-xl font-light blut">{value}</p>
    </div>
  );
}
