import TitleForm from "@/components/TitleForm";
import { createTitle } from "@/app/actions/admin";

export default function NewTitle() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">إضافة فيلم أو مسلسل</h1>
      <TitleForm action={createTitle} />
    </div>
  );
}
