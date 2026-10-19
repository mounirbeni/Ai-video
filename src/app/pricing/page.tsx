import Link from "next/link";
import { getUser, isSubscribed } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { demoPayments } from "@/lib/stripe";
import { paddle, paddleEnv, paddlePrice } from "@/lib/paddle";
import PaddleCheckout from "@/components/PaddleCheckout";

export const dynamic = "force-dynamic";

const FEATURES = ["مشاهدة غير محدودة لكل الأفلام والمسلسلات", "جودة عالية", "متابعة المشاهدة من حيث توقفت", "إلغاء في أي وقت"];

export default async function Pricing({ searchParams }: { searchParams: { canceled?: string } }) {
  const user = await getUser();
  const subscribed = isSubscribed(user);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-center text-4xl font-extrabold">اختر خطتك</h1>
      <p className="mt-3 text-center text-neutral-400">وصول كامل لكل محتوى المنصة الحصري</p>
      {searchParams.canceled && <p className="mt-4 text-center text-yellow-400">تم إلغاء عملية الدفع.</p>}
      {demoPayments && (
        <p className="mx-auto mt-4 max-w-xl rounded-md bg-yellow-500/10 p-3 text-center text-sm text-yellow-300">
          وضع الدفع التجريبي مفعّل: سيُفعَّل الاشتراك دون دفع. أضف مفاتيح Stripe لتفعيل الدفع الحقيقي.
        </p>
      )}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {Object.values(PLANS).map((p) => (
          <div key={p.id} className={`card flex flex-col ${p.id === "yearly" ? "border-brand" : ""}`}>
            {p.id === "yearly" && <span className="mb-2 self-start rounded bg-brand px-2 py-0.5 text-xs">وفّر شهرين</span>}
            <h2 className="text-xl font-bold">{p.name}</h2>
            <p className="mt-3 text-4xl font-extrabold">{p.price}<span className="text-base font-normal text-neutral-400"> / {p.period}</span></p>
            <ul className="my-6 space-y-2 text-neutral-300">
              {FEATURES.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            <div className="mt-auto">
              {subscribed ? (
                <Link href="/account" className="btn-ghost w-full">أنت مشترك — إدارة الاشتراك</Link>
              ) : user && paddle && paddlePrice(p.id) ? (
                <PaddleCheckout priceId={paddlePrice(p.id)!} token={process.env.PADDLE_CLIENT_TOKEN!} env={paddleEnv} email={user.email} userId={user.id} />
              ) : user ? (
                <form action="/api/checkout" method="post">
                  <input type="hidden" name="plan" value={p.id} />
                  <button className="btn-primary w-full">اشترك الآن</button>
                </form>
              ) : (
                <Link href="/register?next=/pricing" className="btn-primary w-full">أنشئ حسابًا للاشتراك</Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
