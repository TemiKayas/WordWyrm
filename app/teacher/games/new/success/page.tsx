import { ShareQR } from '@/components/ShareQR';

export default function SuccessPage({ searchParams }: { searchParams: { url?: string } }) {
  if (!searchParams.url) return <div className="p-6">Missing share URL.</div>;
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Game Ready!</h2>
      <ShareQR url={searchParams.url} />
    </div>
  );
}
