# سخرتي — SAKHRTI

منصة Delivery Marketplace كاملة للسوق المغربي: مطاعم، متاجر، عروض، سلة، Checkout، تتبع مباشر للطلبات، لوحة تحكم Admin، لوحة تاجر وسائق.

**Tagline:** «كلشي لي بغيتي... حتى لباب دارك»

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + **TypeScript**
- **PostgreSQL** عبر **Drizzle ORM**
- **Tailwind CSS v4** — RTL كامل، خط Tajawal، أيقونات Lucide
- **Auth**: JWT httpOnly cookies + bcrypt + RBAC (customer / vendor / admin / driver)
- **Realtime**: PostgreSQL `LISTEN/NOTIFY` → SSE (`/api/stream/orders`) — لا يوجد polling
- **Storage**: رفع صور مع ضغط client-side، تخزين فقاعدة البيانات، تقديم عبر `/api/media/[id]`
- **أبstractions جاهزة**: `src/lib/payments.ts` (بوابة أداء) و `src/lib/maps.ts` (خريطة)

## التشغيل

```bash
npm install
cp .env.example .env   # ثم عدّل القيم
npx drizzle-kit push   # إنشاء الجداول
npm run build && npm start
```

عند أول تشغيل تتم زراعة بيانات تجريبية كاملة تلقائياً (34 محل، 189 منتج، طلبات، عروض، كوبونات، حسابات demo). كلمة مرور الحسابات التجريبية تُولّد عشوائياً وتُخزّن server-side — الدخول السريع متاح من صفحة `/login`.
في الإنتاج حدّد `ADMIN_EMAIL` و `ADMIN_PASSWORD`.

## المسارات

| المسار | الوصف |
| --- | --- |
| `/` | الرئيسية: تصنيفات، بانرات، أقسام محلات |
| `/restaurants`, `/stores` | تصفح المحلات مع فلاتر وترتيب وPagination |
| `/store/[slug]` | صفحة المحل + المنيو + Product Sheet |
| `/offers`, `/search`, `/cart`, `/checkout`, `/track` | العروض، البحث، السلة، إتمام الطلب، التتبع |
| `/orders/[code]` | تتبع الطلب مباشرة (خريطة + Timeline + SSE) |
| `/account/[section]` | الملف، الطلبات، العناوين، المفضلة، الإشعارات، الكوبونات |
| `/admin` | لوحة التحكم: طلبات، محلات، منتجات، بانرات، كوبونات، عروض، مستخدمون، سائقون، تقييمات، مدفوعات، تحليلات، إعدادات |
| `/vendor` | لوحة التاجر: طلبات ومنتجات وإعدادات محله فقط |
| `/driver` | لوحة السائق: طلبات متاحة، قبول، استلام، توصيل، أرباح |

## البنية

```
src/
├─ app/              # routes: (shop)/ admin/ vendor/ driver/ api/
├─ components/       # ui / layout / cart / checkout / product /
│                      store / order / account / auth / search /
│                      home / admin / driver / brand / providers
├─ db/               # schema.ts (25+ table), index.ts
└─ lib/              # auth, queries, seed, payments, maps, realtime,
                     utils, actions/(auth|account|orders|admin)
```

## الأمان

- لا يوجد أي secret داخل الكود — كل شيء من متغيرات البيئة
- إعادة تسعير السلة والتحقق من الكوبونات حصراً فالـ Server Actions
- عزل التاجر على مستوى قيود الملكية (`ownerId`) فكل action
- جلسات JWT موقّعة + كلمات مرور bcrypt + حماية المسارات `/admin` `/vendor` `/driver`
