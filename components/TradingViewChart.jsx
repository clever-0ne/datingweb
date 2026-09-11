'use client';

import { useEffect, useRef } from 'react';

/**
 * Dark, compact TradingView mini symbol chart. Injects TradingView's official
 * embed script into a container; the widget auto-sizes to the card width.
 */
export default function TradingViewChart({ symbol = 'BINANCE:BTCUSDT', height = 200 }) {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    container.innerHTML = '';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: '100%',
      height,
      locale: 'en',
      dateRange: '1M',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: true,
      largeChartUrl: '',
      chartOnly: false,
      noTimeScale: false,
    });

    container.appendChild(widget);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [symbol, height]);

  return <div ref={ref} className="tradingview-widget-container" style={{ height }} />;
}
