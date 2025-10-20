'use client';
import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export function ShareQR({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <div className="flex justify-center">
        <QRCodeCanvas value={url} size={220} includeMargin />
      </div>
      <div className="flex gap-2">
        <input className="w-full rounded border px-3 py-2" value={url} readOnly />
        <button onClick={copy} className="rounded-xl px-3 py-2 shadow">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <p className="text-xs opacity-70">Scan to join this game.</p>
    </div>
  );
}
