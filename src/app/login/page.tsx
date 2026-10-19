import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { login } from "@/app/actions/auth";

export default function Login({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="card">
        <h1 className="mb-6 text-2xl font-bold">تسجيل الدخول</h1>
        <AuthForm action={login} mode="login" next={searchParams.next} />
        <p className="mt-4 text-sm text-neutral-400">
          ليس لديك حساب؟ <Link href={`/register${searchParams.next ? `?next=${encodeURIComponent(searchParams.next)}` : ""}`} className="text-brand">أنشئ حسابًا</Link>
        </p>
      </div>
    </div>
  );
}
