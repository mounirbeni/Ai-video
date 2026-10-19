import LegalPage from "@/components/LegalPage";
import { getLocale } from "@/lib/i18n/server";

export function generateMetadata() {
  return { title: getLocale() === "ar" ? "شروط الاستخدام — منصتي" : "Terms of Use — Minassati" };
}

// نموذج عام — راجعه مع مختص قانوني وعدّله بحسب بلدك ونشاطك
const AR: [string, string][] = [
        ["1. القبول", "باستخدامك المنصة أو إنشاء حساب فيها فإنك توافق على هذه الشروط. إن لم توافق عليها فلا تستخدم المنصة."],
        ["2. الحساب", "يجب تقديم معلومات صحيحة، وأنت مسؤول عن سرية كلمة المرور وعن كل نشاط يتم عبر حسابك. الحساب شخصي ولا يجوز مشاركته أو بيعه."],
        ["3. الاشتراك والدفع", "يمنحك الاشتراك المدفوع وصولًا إلى المحتوى طوال مدة الخطة المختارة. يتجدد الاشتراك تلقائيًا في نهاية كل فترة ما لم تُلغه قبل موعد التجديد من صفحة «حسابي». تتم المدفوعات عبر مزوّد دفع خارجي (Stripe) ولا نحتفظ ببيانات بطاقتك."],
        ["4. الإلغاء والاسترداد", "يمكنك إلغاء الاشتراك في أي وقت، ويبقى الوصول متاحًا حتى نهاية الفترة المدفوعة. لا تُسترد المبالغ عن الفترات المستخدمة جزئيًا إلا إذا اشترط القانون المعمول به خلاف ذلك."],
        ["5. الملكية الفكرية", "جميع الأفلام والمسلسلات والمواد المعروضة مملوكة لصاحب المنصة ومحمية بقوانين حقوق النشر. يُمنح المشترك ترخيصًا شخصيًا غير تجاري للمشاهدة عبر المنصة فقط، ويُحظر التنزيل أو النسخ أو إعادة النشر أو البث العام أو التحايل على وسائل الحماية."],
        ["6. الاستخدام المحظور", "يُحظر استخدام المنصة لأي غرض غير مشروع، أو محاولة اختراقها أو تعطيلها، أو استخدام أدوات آلية لاستخراج المحتوى."],
        ["7. إيقاف الحساب", "يحق لنا تعليق أو إنهاء أي حساب يخالف هذه الشروط دون استرداد."],
        ["8. إخلاء المسؤولية", "تُقدَّم المنصة «كما هي»، ولا نضمن عملها دون انقطاع أو أخطاء. لا نتحمل مسؤولية الأضرار غير المباشرة الناتجة عن استخدامها في حدود ما يسمح به القانون."],
        ["9. التعديلات", "قد نعدّل هذه الشروط أو الأسعار، وسنُعلمك بالتغييرات الجوهرية مسبقًا. استمرارك في الاستخدام بعد التعديل يعني قبوله."],
        ["10. التواصل", "لأي استفسار تواصل معنا عبر البريد المذكور في صفحة المنصة."],
      ];

const EN: [string, string][] = [
        ["1. Acceptance", "By using the platform or creating an account, you agree to these terms. If you do not agree, do not use the platform."],
        ["2. Your account", "You must provide accurate information and you are responsible for keeping your password confidential and for all activity on your account. Accounts are personal and may not be shared or sold."],
        ["3. Subscription and payment", "A paid subscription gives you access to the content for the duration of the plan you choose. Subscriptions renew automatically at the end of each period unless you cancel before the renewal date from your Account page. Payments are processed by a third-party payment provider and we do not store your card details."],
        ["4. Cancellation and refunds", "You can cancel at any time and keep access until the end of the paid period. Partially used periods are not refunded unless required by applicable law."],
        ["5. Intellectual property", "All movies, series and materials on the platform are owned by the platform owner and protected by copyright. Subscribers receive a personal, non-commercial license to watch through the platform only. Downloading, copying, republishing, public screening or circumventing protection measures is prohibited."],
        ["6. Prohibited use", "You may not use the platform for any unlawful purpose, attempt to hack or disrupt it, or use automated tools to extract content."],
        ["7. Account suspension", "We may suspend or terminate any account that violates these terms, without refund."],
        ["8. Disclaimer", "The platform is provided “as is” and we do not guarantee uninterrupted or error-free operation. To the extent permitted by law, we are not liable for indirect damages arising from its use."],
        ["9. Changes", "We may update these terms or our prices and will notify you in advance of material changes. Continuing to use the platform after a change means you accept it."],
        ["10. Contact", "For any questions, contact us at the email address shown on the platform."],
      ];

export default function Terms() {
  const ar = getLocale() === "ar";
  return <LegalPage title={ar ? "شروط الاستخدام" : "Terms of Use"} updated="2026-10-19" sections={ar ? AR : EN} />;
}
