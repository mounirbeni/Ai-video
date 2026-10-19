import SimpleForm from "@/components/SimpleForm";
import { resetPassword } from "@/app/actions/auth";

export default function ResetPassword({ searchParams }: { searchParams: { token?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="card">
        <h1 className="mb-6 text-2xl font-bold">تعيين كلمة مرور جديدة</h1>
        <SimpleForm action={resetPassword} label="حفظ كلمة المرور">
          <input type="hidden" name="token" value={searchParams.token ?? ""} />
          <div><label className="label">كلمة المرور الجديدة</label><input name="password" type="password" className="input" required minLength={8} dir="ltr" /></div>
        </SimpleForm>
      </div>
    </div>
  );
}
