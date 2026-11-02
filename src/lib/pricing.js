// Indicative per-device pricing by Apple product family.
// Exact compatibility is verified by the desktop companion when available.
export const DEVICE_CLASSES = [
  { id: 'iphone', label: 'iPhone', hint: 'Apple phone', family: 'mobile', multiplier: 1.15 },
  { id: 'ipad', label: 'iPad', hint: 'Apple tablet', family: 'mobile', multiplier: 1.0 },
  { id: 'macbook-air', label: 'MacBook Air', hint: 'Apple laptop', family: 'mac', multiplier: 1.45 },
  { id: 'macbook-pro', label: 'MacBook Pro', hint: 'Apple laptop', family: 'mac', multiplier: 1.65 },
  { id: 'imac', label: 'iMac', hint: 'All-in-one Mac desktop', family: 'mac', multiplier: 1.45 },
  { id: 'mac-mini', label: 'Mac mini', hint: 'Compact Mac desktop', family: 'mac', multiplier: 1.35 },
  { id: 'mac-studio', label: 'Mac Studio', hint: 'Professional Mac desktop', family: 'mac', multiplier: 1.85 },
  { id: 'mac-pro', label: 'Mac Pro', hint: 'Professional Mac workstation', family: 'mac', multiplier: 2.1 },
  { id: 'watch', label: 'Apple Watch', hint: 'Apple smartwatch', family: 'other', multiplier: 0.8 },
  { id: 'apple-tv', label: 'Apple TV', hint: 'Apple streaming device', family: 'other', multiplier: 0.9 },
  { id: 'airpods', label: 'AirPods', hint: 'Apple wireless audio', family: 'other', multiplier: 0.7 },
  { id: 'homepod', label: 'HomePod', hint: 'Apple smart speaker', family: 'other', multiplier: 0.7 },
  { id: 'vision-pro', label: 'Apple Vision Pro', hint: 'Apple spatial computer', family: 'other', multiplier: 1.9 },
];

export const SERVICES = [
  {
    id: 'system_repair',
    label: 'Fix a problem',
    short: 'Fix my device',
    blurb: 'Your Apple device is not starting, keeps freezing, or is not working right.',
    base: 39,
    benchmark: 69,
    turnaround: 'Depends on device',
    icon: 'wrench',
  },
  {
    id: 'data_recovery',
    label: 'Get my photos and files back',
    short: 'Save my stuff',
    blurb: 'Find out if your photos, videos, and other files can be saved. Getting them back is not guaranteed.',
    base: 79,
    benchmark: 129,
    turnaround: 'Depends on device',
    icon: 'drive',
  },
  {
    id: 'diagnostics',
    label: 'Find out what is wrong',
    short: 'Check my device',
    blurb: 'We help you look for the reason your Apple device is having trouble.',
    base: 19,
    benchmark: 39,
    turnaround: 'Depends on device',
    icon: 'stethoscope',
  },
  {
    id: 'refurb_audit',
    label: 'Check a device before I buy or sell it',
    short: 'Check before buying or selling',
    blurb: 'See what to check before you buy a used Apple device or sell your own.',
    base: 12,
    benchmark: 25,
    turnaround: 'Depends on device',
    icon: 'layers',
  },
];

export const VOLUME_TIERS = [
  { id: 'single', label: '1 device', min: 1, max: 1, discount: 0 },
  { id: 'small', label: '2 – 4 devices', min: 2, max: 4, discount: 0.1 },
  { id: 'shop', label: '5 – 9 devices', min: 5, max: 9, discount: 0.18 },
  { id: 'reseller', label: '10 – 24 devices', min: 10, max: 24, discount: 0.26 },
  { id: 'fleet', label: '25+ devices', min: 25, max: Infinity, discount: 0.34 },
];

export const DEFAULT_CONFIG = {
  margin_floor: 1.22,
  undercut_pct: 12,
};

export function formatUsd(value) {
  return '$' + Number(value).toFixed(2);
}

function roundToRetail(value) {
  const rounded = Math.max(10, Math.round(value));
  return rounded - 1 + 0.99;
}

export function getQuote({ serviceId, deviceClassId, quantity = 1, config = DEFAULT_CONFIG }) {
  const service = SERVICES.find((s) => s.id === serviceId) || SERVICES[0];
  const device = DEVICE_CLASSES.find((d) => d.id === deviceClassId) || DEVICE_CLASSES[0];
  const marginFloor = Number(config?.margin_floor) || DEFAULT_CONFIG.margin_floor;
  const undercut = Number(config?.undercut_pct);
  const undercutPct = Number.isFinite(undercut) ? undercut : DEFAULT_CONFIG.undercut_pct;

  const cost = service.base * device.multiplier;
  const floor = cost * marginFloor;
  const benchmark = service.benchmark * device.multiplier;
  const list = Math.max(roundToRetail(benchmark * (1 - undercutPct / 100)), roundToRetail(floor));

  const tiers = VOLUME_TIERS.map((tier) => {
    const rawUnit = list * (1 - tier.discount);
    return {
      ...tier,
      unit: roundToRetail(rawUnit),
      eligible: rawUnit >= floor,
    };
  });

  const eligibleTiers = tiers.filter((tier) => tier.eligible);
  const recommendedTier = eligibleTiers[eligibleTiers.length - 1] || tiers[0];
  const requestedTier = tiers.find((tier) => quantity >= tier.min && quantity <= tier.max) || tiers[0];
  const activeTier = requestedTier.eligible ? requestedTier : tiers[0];
  const unitPrice = activeTier.unit;

  return {
    service,
    device,
    cost,
    floor,
    list,
    tiers,
    recommendedTier,
    activeTier,
    unitPrice,
    quantity,
    total: unitPrice * quantity,
    benchmark: roundToRetail(benchmark),
    savingsPerDevice: Math.max(0, roundToRetail(benchmark) - unitPrice),
    marginPct: ((unitPrice - cost) / unitPrice) * 100,
  };
}

export function deviceClassOptions() {
  return DEVICE_CLASSES;
}

export function serviceOptions() {
  return SERVICES;
}
