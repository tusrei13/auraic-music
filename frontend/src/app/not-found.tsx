import Link from 'next/link';

export default function NotFound() {
  return <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-300">404</p><h1 className="text-2xl font-black">Không tìm thấy nội dung</h1><p className="text-sm text-white/55">Trang bạn yêu cầu không tồn tại hoặc đã được chuyển.</p><Link href="/" className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950">Về trang chủ</Link></main>;
}
