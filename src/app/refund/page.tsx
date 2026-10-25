import LegalPage from "@/components/LegalPage";
import { getLocale } from "@/lib/i18n/server";
import { contactEmail } from "@/lib/contact";

export async function generateMetadata() {
  return { title: (await getLocale()) === "ar" ? "سياسة الاسترداد — Nexora" : "Refund Policy — Nexora" };
}

export default async function Refund() {
  const ar = (await getLocale()) === "ar";
  const email = contactEmail();
  const AR: [string, string][] = [
    ["1. مدة الاسترداد", "يمكنك طلب استرداد كامل خلال 14 يومًا من تاريخ أي عملية شراء على Nexora، سواء كانت اشتراكًا شهريًا أو سنويًا أو باقة دعم لمرة واحدة."],
    ["2. كيفية الطلب", `${email ? `راسلنا على ${email}` : "تواصل معنا"} مع ذكر البريد المستخدم في الشراء، أو اطلب الاسترداد مباشرة عبر رابط الإيصال الذي يصلك من Paddle أو عبر paddle.net.`],
    ["3. معالجة الاسترداد", "تتم عملية الطلب عبر بائعنا المعتمد Paddle.com، وهو البائع الرسمي (Merchant of Record) لجميع طلباتنا، ويتولى معالجة المبالغ المستردة إلى وسيلة الدفع الأصلية. قد يستغرق ظهور المبلغ في حسابك من 5 إلى 10 أيام عمل بحسب البنك."],
    ["4. بعد الاسترداد", "عند الاسترداد يتوقف الوصول المرتبط بعملية الشراء المستردة. يمكنك إلغاء الاشتراك في أي وقت من صفحة «حسابي» دون الحاجة إلى طلب استرداد."],
  ];
  const EN: [string, string][] = [
    ["1. Refund window", "You can request a full refund within 14 days of any purchase on Nexora, whether a monthly or yearly subscription or a one-time support pack."],
    ["2. How to request", `${email ? `Email us at ${email}` : "Contact us"} with the email address used for the purchase, or request a refund directly from the receipt link sent by Paddle or at paddle.net.`],
    ["3. Processing", "Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders and processes refunds to the original payment method. Refunds may take 5–10 business days to appear, depending on your bank."],
    ["4. After a refund", "Access linked to the refunded purchase ends once the refund is processed. You can also cancel your subscription at any time from your Account page without requesting a refund."],
  ];
  return <LegalPage title={ar ? "سياسة الاسترداد" : "Refund Policy"} updated="2026-10-19" sections={ar ? AR : EN} />;
}
