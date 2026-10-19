import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { register } from "@/app/actions/auth";

export default function Register({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="card">
        <h1 className="mb-6 text-2xl font-bold">إنشاء حساب جديد</h1>
        <AuthForm action={register} mode="register" next={searchParams.next} />
        <p className="mt-4 text-sm text-neutral-400">
          لديك حساب؟ <Link href="/login" className="text-brand">سجّل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
