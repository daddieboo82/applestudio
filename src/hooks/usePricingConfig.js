import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_CONFIG } from '@/lib/pricing';

export default function usePricingConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    let active = true;
    base44.entities.PricingConfig.filter({ key: 'global' }).then((rows) => {
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!active || !row) return;
      setConfig({
        margin_floor: Number(row.margin_floor) || DEFAULT_CONFIG.margin_floor,
        undercut_pct: Number.isFinite(Number(row.undercut_pct))
          ? Number(row.undercut_pct)
          : DEFAULT_CONFIG.undercut_pct,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  return config;
}