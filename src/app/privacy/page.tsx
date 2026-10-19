import LegalPage from "@/components/LegalPage";
import { getLocale } from "@/lib/i18n/server";
import { contactEmail } from "@/lib/contact";

const email = contactEmail();

export function generateMetadata() {
  return { title: getLocale() === "ar" ? "سياسة الخصوصية — Nexora" : "Privacy Policy — Nexora" };
}

// نموذج عام — راجعه مع مختص قانوني وعدّله بحسب بلدك ونشاطك
const AR: [string, string][] = [
        ["1. البيانات التي نجمعها", "• بيانات الحساب: الاسم والبريد الإلكتروني وكلمة المرور (مخزنة مشفّرة بشكل لا يمكن استرجاعه).\n• بيانات الاشتراك: الخطة وحالتها وتاريخ التجديد. بيانات البطاقة يعالجها Paddle.com (البائع الرسمي لطلباتنا) مباشرة ولا تصل إلينا.\n• بيانات المشاهدة: موضع التوقف في كل عمل لتتمكن من المتابعة."],
        ["2. كيف نستخدمها", "لتشغيل حسابك وتقديم المحتوى، ومعالجة الاشتراك، وإرسال رسائل ضرورية (تأكيد البريد، إعادة تعيين كلمة المرور، إشعارات الفوترة)، وتحسين الخدمة."],
        ["3. ملفات تعريف الارتباط", "نستخدم ملفات ارتباط ضرورية لإبقائك مسجلًا الدخول ولتذكّر لغتك. لا نستخدم ملفات ارتباط إعلانية."],
        ["4. مشاركة البيانات", "لا نبيع بياناتك. نشاركها فقط مع مزودي الخدمة اللازمين لتشغيل المنصة (معالجة الدفع، إرسال البريد، الاستضافة) أو عندما يلزم القانون بذلك."],
        ["5. الاحتفاظ بالبيانات", "نحتفظ ببياناتك طالما حسابك قائم، وبما يلزم بعد ذلك للوفاء بالالتزامات القانونية والمحاسبية."],
        ["6. حقوقك", `يحق لك الاطلاع على بياناتك وتصحيحها وطلب حذف حسابك. تواصل معنا${email ? ` على ${email}` : ""} لممارسة هذه الحقوق.`],
        ["7. الأمان", "نستخدم اتصالًا مشفرًا وتخزينًا آمنًا لكلمات المرور، لكن لا توجد وسيلة نقل أو تخزين آمنة بنسبة 100%."],
        ["8. التعديلات", "قد نحدّث هذه السياسة، وسننشر النسخة المحدثة هنا مع تاريخ التحديث."],
      ];

const EN: [string, string][] = [
        ["1. Data we collect", "• Account data: your name, email and password (stored using irreversible hashing).\n• Subscription data: your plan, its status and renewal date. Card details are handled directly by Paddle.com (our Merchant of Record) and never reach us.\n• Viewing data: where you stopped in each title, so you can resume."],
        ["2. How we use it", "To run your account and deliver content, process your subscription, send essential messages (email confirmation, password reset, billing notices) and improve the service."],
        ["3. Cookies", "We use essential cookies to keep you signed in and to remember your language. We do not use advertising cookies."],
        ["4. Sharing", "We do not sell your data. We share it only with the service providers needed to run the platform (payments, email, hosting) or when required by law."],
        ["5. Retention", "We keep your data while your account exists, and afterwards only as long as needed to meet legal and accounting obligations."],
        ["6. Your rights", `You may access and correct your data and request deletion of your account. Contact us${email ? ` at ${email}` : ""} to exercise these rights.`],
        ["7. Security", "We use encrypted connections and secure password storage, but no method of transmission or storage is 100% secure."],
        ["8. Changes", "We may update this policy and will publish the updated version here with its revision date."],
      ];

export default function Privacy() {
  const ar = getLocale() === "ar";
  return <LegalPage title={ar ? "سياسة الخصوصية" : "Privacy Policy"} updated="2026-10-19" sections={ar ? AR : EN} />;
}
