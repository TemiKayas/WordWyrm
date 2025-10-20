import { ShareQR } from '@/components/ShareQR';

export default function SuccessPage({ searchParams }: { searchParams: { url?: string } }) {
  const url = searchParams?.url;

  if (!url) return <div className="p-6">Missing share URL in query string.</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fffaf2] p-6">
      <h2 className="text-2xl font-bold mb-6 text-[#473025]">Game Ready!</h2>
      <p className="text-sm text-gray-600 mb-6 break-all text-center">
        Share this link with your students:
        <br />
        <span className="text-blue-600 font-semibold">{url}</span>
      </p>
      <ShareQR url={url} />
    </div>
  );
}
