"use client";
export default function ErrorView({ reset }: { reset: () => void }) {
  return (
    <div className="p-10" role="alert">
      <h1>Company workspace unavailable</h1>
      <p>No company data has been saved to browser storage.</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
