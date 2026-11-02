import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import usePricingConfig from '@/hooks/usePricingConfig';
import { getQuote } from '@/lib/pricing';
import DeviceServicePicker from '@/components/pricing/DeviceServicePicker';
import QuantityStepper from '@/components/pricing/QuantityStepper';
import TierTable from '@/components/pricing/TierTable';
import PriceSummary from '@/components/pricing/PriceSummary';

export default function Pricing() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const config = usePricingConfig();

  const [serviceId, setServiceId] = useState(params.get('service') || 'system_repair');
  const [deviceClassId, setDeviceClassId] = useState(params.get('device') || 'iphone');
  const [quantity, setQuantity] = useState(1);

  const quote = useMemo(
    () => getQuote({ serviceId, deviceClassId, quantity, config }),
    [serviceId, deviceClassId, quantity, config],
  );

  const reserve = () =>
    navigate(`/quote?service=${serviceId}&device=${deviceClassId}&qty=${quantity}`);

  return (
    <div>
      <div className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 lattice opacity-60" />
        <div className="pointer-events-none absolute -right-24 top-0 h-[300px] w-[300px] rounded-full bg-accent/10 blur-[130px]" />
        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-primary/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
              Price engine
            </span>
          </div>
          <h1 className="mt-5 max-w-2xl font-heading text-4xl font-medium leading-[1.02] tracking-[-0.02em] sm:text-5xl">
            One price per device. Published before you commit.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Choose the device class, the service and how many devices you need covered. The engine
            prices each device against the market and stops at the margin floor so the work stays
            honest. Every price is for a remote session — nothing is shipped.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <DeviceServicePicker
            deviceClassId={deviceClassId}
            serviceId={serviceId}
            onDeviceChange={setDeviceClassId}
            onServiceChange={setServiceId}
          />

          <div className="mt-9 space-y-3">
            <QuantityStepper value={quantity} onChange={setQuantity} />
            <TierTable quote={quote} onSelect={setQuantity} />
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <PriceSummary quote={quote} onReserve={reserve} />
          </div>
        </div>
      </div>
    </div>
  );
}