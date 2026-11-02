export default function SectionHeading({ index, eyebrow, title, description, align = 'left' }) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <div
        className={`flex items-center gap-3 ${align === 'center' ? 'justify-center' : ''}`}
      >
        {index && (
          <span className="font-mono text-[10px] tracking-[0.2em] text-primary">{index}</span>
        )}
        <span className="h-px w-6 bg-primary/50" />
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-5 font-heading text-3xl font-medium leading-[1.1] tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}