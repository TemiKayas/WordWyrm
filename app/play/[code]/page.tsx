import React from "react";

async function fetchGame(code: string) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/auth/games/${code}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}


export default async function PlayPage({ params }: { params: { code: string } }) {
  const data = await fetchGame(params.code);
  if (!data) return <div className="p-6">Game not found or inactive.</div>;

  // TODO: Replace with your Phaser game player using data.quiz.quizJson
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{data.title}</h1>
      <p className="text-sm opacity-70">Code: {data.shareCode}</p>
      <div className="rounded-2xl border p-4">
        <pre className="text-xs overflow-auto">
          {JSON.stringify(data.quiz.quizJson, null, 2)}
        </pre>
      </div>
    </div>
  );
}
