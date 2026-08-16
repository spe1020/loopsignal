export function SampleDataCaption({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[10px] font-medium uppercase tracking-[0.16em] text-stone ${className}`}
    >
      Fictional sample data
    </p>
  );
}
