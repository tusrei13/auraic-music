'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center"><h1 className="text-xl font-bold">Không thể tải trang</h1><p className="max-w-md text-sm text-white/55">Đã xảy ra lỗi tạm thời khi tải dữ liệu.</p><button type="button" onClick={() => reset()} className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950">Thử lại</button></main>;
}
