import { DEVICE_CLASSES, SERVICES } from '@/lib/pricing';

const GROUPS = [
  { id: 'mobile', label: 'iPhone & iPad', description: 'Phones and tablets' },
  { id: 'mac', label: 'Mac computers', description: 'Mac laptops and desktop computers' },
  { id: 'other', label: 'Other Apple devices', description: 'Watches, headphones, speakers, and more' },
];

export default function DeviceServicePicker({ deviceClassId, serviceId, onDeviceChange, onServiceChange }) {
  return (
    <div className="space-y-9">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Step 1 — What Apple device do you have?
          </p>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
            {DEVICE_CLASSES.length} device families
          </span>
        </div>
        <div className="mt-4 space-y-6">
          {GROUPS.map((group) => {
            const devices = DEVICE_CLASSES.filter((device) => device.family === group.id);
            return (
              <section key={group.id} aria-label={group.label}>
                <div className="mb-2">
                  <h3 className="font-heading text-sm font-medium text-foreground">{group.label}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {devices.map((device) => {
                    const active = device.id === deviceClassId;
                    return (
                      <button
                        key={device.id}
                        type="button"
                        onClick={() => onDeviceChange(device.id)}
                        aria-pressed={active}
                        className={active
                          ? 'rounded-lg border border-primary/60 bg-primary/[0.07] p-3.5 text-left transition-colors'
                          : 'rounded-lg border border-border bg-card p-3.5 text-left transition-colors hover:border-foreground/20'}
                      >
                        <span className={active ? 'block text-sm font-medium text-primary' : 'block text-sm font-medium text-foreground'}>
                          {device.label}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">{device.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Just pick the name that looks like your device. You do not need to know its model number.
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Step 2 — What do you need help with?
          </p>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
            {SERVICES.length} ways we can help
          </span>
        </div>
        <div className="mt-3 grid gap-2">
          {SERVICES.map((service) => {
            const active = service.id === serviceId;
            return (
              <button
                key={service.id}
                type="button"
                onClick={() => onServiceChange(service.id)}
                aria-pressed={active}
                className={active
                  ? 'flex items-start justify-between gap-4 rounded-lg border border-primary/60 bg-primary/[0.07] p-3.5 text-left transition-colors'
                  : 'flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-3.5 text-left transition-colors hover:border-foreground/20'}
              >
                <span>
                  <span className={active ? 'block text-sm font-medium text-primary' : 'block text-sm font-medium text-foreground'}>
                    {service.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{service.blurb}</span>
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {service.turnaround}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
