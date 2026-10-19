import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-32 text-center">
      <h1 className="text-5xl font-extrabold">404</h1>
      <p className="mt-3 text-neutral-400">الصفحة غير موجودة</p>
      <Link href="/" className="btn-primary mt-6">العودة للرئيسية</Link>
    </div>
  );
}
