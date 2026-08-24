'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="vi"><body className="flex min-h-screen items-center justify-center bg-slate-950 p-8 text-white"><main className="text-center"><h1 className="text-xl font-bold">Auraic cần khởi động lại</h1><button type="button" onClick={() => reset()} className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950">Thử lại</button></main></body></html>;
}
