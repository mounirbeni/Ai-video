import SimpleForm from "@/components/SimpleForm";
import { forgotPassword } from "@/app/actions/auth";

export default function ForgotPassword() {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="card">
        <h1 className="mb-2 text-2xl font-bold">نسيت كلمة المرور؟</h1>
        <p className="mb-6 text-sm text-neutral-400">أدخل بريدك وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.</p>
        <SimpleForm action={forgotPassword} label="إرسال الرابط">
          <div><label className="label">البريد الإلكتروني</label><input name="email" type="email" className="input" required dir="ltr" /></div>
        </SimpleForm>
      </div>
    </div>
  );
}
