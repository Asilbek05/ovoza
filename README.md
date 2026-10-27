# tushun. — xatoni ovoz bilan tushuntiradigan test platformasi

Attestatsiya, milliy sertifikat (keyin DTM) demo testlari. Har bir xato savolga ustozning **audio tushuntirishi + yechim rasmlari** (audio bilan sinxron) va **oʻxshash savol**.

## Ishga tushirish (2 daqiqa)

```bash
npm install
cp .env.example .env.local     # ADMIN_PASSWORD ni oʻzgartiring
npm run dev
```

- Sayt: http://localhost:3000
- Admin panel: http://localhost:3000/admin (parol — `.env.local` dagi `ADMIN_PASSWORD`, standart: `admin12345`)

Hech qanday baza sozlash shart emas: `DATABASE_URL` boʻsh boʻlsa, loyiha ichidagi **PGlite** (fayldagi PostgreSQL, `./.pglite`) ishlatiladi. Birinchi ishga tushishda jadvallar yaratiladi va default maʼlumotlar qoʻshiladi:
- 3 imtihon turi (Attestatsiya, Milliy sertifikat, DTM — «tez orada»)
- 11 + 9 asosiy fan (qolganini admin → Fanlar dan qoʻshasiz)
- 3 demo test, toʻliq tushuntirishli 1 savol, 8 ta tarif (narxlar bozorga qarab)

## Admin panel

| Boʻlim | Nima qiladi |
| --- | --- |
| Umumiy | Audio qamrovi (eng muhim raqam), audiosiz savollar navbati, oxirgi buyurtmalar |
| Imtihon turlari | Nom, tavsif, koʻrinish, «tez orada» |
| Fanlar | Toʻliq CRUD, rang, tartib, faol/nofaol |
| Testlar va savollar | Test yaratish, savollar, tartib, **AI import** (Word/PDF/matn/JSON) |
| Savol → Tushuntirish | Audio yuklash, rasmlar + soniyasi («hozirgi vaqtni olish»), izoh, muallif, oʻxshash savol, jonli koʻrinish |
| Tariflar | Narx, muddat, imkoniyatlar |
| Foydalanuvchilar | Qidiruv, qoʻlda obuna berish/toʻxtatish |
| Toʻlovlar | Tushum, kutilayotgan buyurtmalar, «Toʻlandi» → obuna avtomatik ochiladi, CSV eksport |
| Tushunmadim | Qaysi tushuntirishni foydalanuvchilar tushunmagan — qayta yozish navbati |
| Sozlamalar | Telefon, Telegram, email, toʻlov kartasi, yuqori eʼlon (saytda darhol yangilanadi) |

**AI import:** `.env.local` ga `ANTHROPIC_API_KEY` qoʻshing. Kalitsiz ham oddiy format ishlaydi:

```
1. Savol matni
A) ...  B) ...  C) ...  D) ...
Javob: B
```

## Production (Vercel + Supabase)

1. Supabase'da loyiha oching → SQL editorda `supabase/schema.sql` ni ishga tushiring (ilova buni avtomatik ham qiladi).
2. Storage → `media` nomli **public** bucket yarating.
3. Vercel'da env: `DATABASE_URL` (Supabase → Connect → Transaction pooler), `AUTH_SECRET`, `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET=media`.
4. Vercel'da fayl tizimi vaqtinchalik — shuning uchun productionda Supabase Storage **shart**.

Oddiy VPS'da (`npm run build && npm start`) PGlite va lokal `uploads/` papkasi ham ishlaydi — faqat `.pglite` va `uploads` ni zaxiralab turing.

## Foydalanuvchi tajribasi

- Test: savolni **belgilash** (F), savollar xaritasi, har savolga sarflangan vaqt, yakunlashdan oldin xulosa oynasi, 5 va 1 daqiqa ogohlantirishi.
- Natija: daraja (Aʼlo/Yaxshi/…), mavzular xaritasi, **barcha savollar** roʻyxati (toʻgʻri/xato, vaqt, belgilanganlar), ovozli xabarlar.
- Kabinet: statistika, oxirgi natijalar grafigi, takrorlash kerak boʻlgan mavzular, profil va parolni almashtirish.
- Landing: raqamlar, taqqoslash, savol-javob; SEO (`sitemap.xml`, `robots.txt`, manifest), «Aloqa», oferta va maxfiylik sahifalari (oferta/maxfiylik matni — shablon, yurist koʻrib chiqsin).
- Productionda `NEXT_PUBLIC_SITE_URL` ni oʻz domeningizga qoʻying (sitemap va OG uchun).

## Xavfsizlik va ishonchlilik

- Productionda `AUTH_SECRET` (32+ belgi) va `ADMIN_PASSWORD` **majburiy** — ular boʻlmasa ilova ishlamaydi (standart parol faqat `npm run dev` da).
- `/admin` ostidagi har bir sahifa middleware orqali yopilgan; admin va foydalanuvchi kirishida urinishlar cheklangan.
- Test vaqti serverda tekshiriladi: vaqt tugagach javoblar qabul qilinmaydi, natija avtomatik hisoblanadi. Tugallanmagan urinish qayta boshlanganda davom ettiriladi (kredit ikki marta sarflanmaydi).
- Yuklash: audio — mp3/m4a/ogg/wav/webm/aac (≤20 MB), rasm — jpg/png/webp (≤5 MB). SVG yuklash taqiqlangan.

## Keyingi qadamlar

- Click / Payme merchant ulash (hozir buyurtmalar admin orqali tasdiqlanadi)
- SMS yoki Telegram orqali kirish
- DTM boʻlimini ochish: admin → Imtihon turlari → DTM → «tez orada» ni oʻchirish, fanlar qoʻshish

Toʻliq texnik topshiriq: `PROMPT.md`.

## Stack

Next.js 15 · TypeScript · Tailwind v4 · shadcn/ui uslubidagi Radix komponentlar · Drizzle ORM · PostgreSQL/PGlite · Anthropic API · Onest + Bricolage Grotesque (lokal shriftlar).
