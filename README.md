# ovoza — xatoni ustoz ovozi bilan tushuntiradigan test platformasi

Attestatsiya va milliy sertifikat (keyin DTM) testlari. Har bir xato savolga ustozning **ovozli tushuntirishi + yechim rasmlari** (audio bilan sinxron) va **oʻxshash savol** beriladi.

> Bu hujjat — toʻliq foydalanish yoʻriqnomasi. Texnik topshiriq: `PROMPT.md`.

---

## 1. Kompyuterda ishga tushirish (2 daqiqa)

Kerak: **Node.js 20+**.

```bash
npm install
cp .env.example .env.local      # ADMIN_PASSWORD ni oʻzgartiring
npm run dev
```

| Nima | Qayerda |
| --- | --- |
| Sayt | http://localhost:3001 |
| Admin panel | http://localhost:3001/admin (standart parol `admin12345`) |

Bazani sozlash shart emas — `DATABASE_URL` boʻsh boʻlsa, papka ichidagi `./.pglite` ishlatiladi; jadvallar va demo maʼlumotlar birinchi ishga tushishda oʻzi yaratiladi. Demo: 3 imtihon turi, 20 ta fan, 6 ta test, 8 ta tarif, ovozli tushuntirishli 1 savol.

Boshidan boshlash: serverni toʻxtating → `.pglite` va `uploads` papkalarini oʻchiring → qayta ishga tushiring.

---

## 2. Admin panel bilan ishlash — qadamma-qadam

1. **Fanlar** → kerakli fanni qoʻshing/tahrirlang (rang, tartib, vaqtincha yashirish).
2. **Testlar va savollar** → *Yangi test*: fan, nom, vaqt (daqiqa), «Bepul» belgisi.
3. **Savollarni qoʻshish** — uch yoʻl:
   - qoʻlda («+ Savol»);
   - **Import**: matn joylang yoki `.txt` `.docx` `.pdf` `.json` yuklang. Oddiy format AI siz tanilib ketadi:
     ```
     1. Savol matni
     A) variant  B) variant  C) variant  D) variant
     Javob: B
     ```
     (`*C) ...` yoki «Toʻgʻri javob: B» ham taniladi). Namuna fayllar import sahifasida. Murakkab Word/PDF uchun AI kerak (7-bandga qarang).
   - Import natijasi jadvalda chiqadi: har birini tekshirib, toʻgʻri javobni belgilab, keyin «Saqlash».
4. **Har bir savol → Tushuntirish**:
   - **Audio**: «Mikrofondan yozish» tugmasi bilan ustoz toʻgʻridan-toʻgʻri brauzerda yozadi (eng koʻpi 6 daqiqa) — yoki tayyor `mp3/m4a/ogg/wav` yuklanadi. Mikrofon uchun brauzer ruxsat soʻraydi (sayt `https://` yoki `localhost` boʻlishi shart).
   - **Rasmlar**: 2–4 ta yuklang; har biriga «audioning qaysi soniyasida ochilsin» ni yozing («hozirgi vaqtni olish» tugmasi pleyerdan oladi). Oʻng tomonda foydalanuvchi koʻradigan koʻrinish jonli chiqadi.
   - **Oʻxshash savol** va izoh/muallif ismi.
5. Testda **«Saytda chop etilgan»** ni yoqing (savolsiz testni chop etib boʻlmaydi).
6. **Umumiy** sahifa audiosi yoʻq savollar navbatini koʻrsatadi — platformaning asosiy koʻrsatkichi shu.
7. **Tushunmadim** — foydalanuvchilar qaysi tushuntirishni tushunmagan; shularni qayta yozing.

Qoʻshimcha: testni **nusxalash**, **CSV** eksport (foydalanuvchilar, toʻlovlar), **Sozlamalar** (telefon, Telegram, karta raqami, yuqori eʼlon).

## 3. Foydalanuvchi tomoni

- Roʻyxatdan oʻtmagan kishi **bepul** testni yechadi; natijani koʻrish va tushuntirishlar uchun roʻyxatdan oʻtadi (urinish saqlanib qoladi).
- Bepul testda **dastlabki 3 ta** xatoning tushuntirishi ochiq; qolganlari — obuna bilan.
- Test: savolni belgilash (**F**), savollar xaritasi, vaqt serverda nazorat qilinadi, javoblar har bosishda saqlanadi.
- Natija → xatolar roʻyxati → ovozli tahlil (play/pauza, 1×/1.25×/1.5×, rasmlar audio bilan almashadi) → oʻxshash savol.
- Kabinet: statistika, zaif mavzular, profil, parolni almashtirish. «Parolni unutdingizmi?» — SMS kod orqali (6-band).

## 4. Narxlar va obunalar

Tariflar **Tariflar** sahifasida (narx, muddat, imkoniyatlar). Foydalanuvchi tarif tanlasa — **buyurtma** yaratiladi. Toʻlov usullari:

- **Click / Payme** (5-band) — toʻlov tushishi bilan obuna **avtomatik** ochiladi.
- **Qoʻlda**: foydalanuvchi kartaga oʻtkazadi (rekvizit **Sozlamalar** da), siz **Toʻlovlar** sahifasida «Toʻlandi» ni bosasiz. Yoki **Foydalanuvchilar → Obuna berish**.

## 5. Click va Payme ulash

Ikkalasi uchun ham saytingiz **internetda, https bilan** turgan boʻlishi kerak (localhost ishlamaydi) va `NEXT_PUBLIC_SITE_URL` toʻgʻri boʻlishi kerak.

**Payme** (merchant.paycom.uz):
1. Kassa yarating → *Endpoint URL*: `https://<domen>/api/payme`.
2. `.env`: `PAYME_MERCHANT_ID` (kassa ID), `PAYME_KEY` (Key; test rejimda «Test key», shunda `PAYME_TEST=1`).
3. Hisob maydoni (`account`): **`order_id`**. Summa tiyinda tekshiriladi.

**Click** (merchant.click.uz):
1. Xizmat yarating → *Prepare URL*: `https://<domen>/api/click/prepare`, *Complete URL*: `https://<domen>/api/click/complete`.
2. `.env`: `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_SECRET_KEY`.

Kalitlar kiritilgach kabinetdagi buyurtma kartasida «Click orqali / Payme orqali toʻlash» tugmalari paydo boʻladi. Protokol (imzo tekshiruvi, takroriy chaqiruv, bekor qilish, hisobot) toʻliq amalga oshirilgan va oʻz tomondan sinalgan; haqiqiy kassa bilan birinchi sinov toʻlovini Payme/Click test rejimida oʻtkazing.

## 6. SMS (parolni tiklash)

[Eskiz.uz](https://eskiz.uz) akkaunti oching, `.env` ga `ESKIZ_EMAIL`, `ESKIZ_PASSWORD` (va kerak boʻlsa `ESKIZ_FROM`) yozing. SMS ulanmagan boʻlsa: lokal rejimda kod ekranda chiqadi (sinash uchun), productionda foydalanuvchiga «administratorga murojaat qiling» deyiladi — admin esa **Foydalanuvchilar → Parol** orqali vaqtinchalik parol beradi.

## 7. AI import

`.env` ga `ANTHROPIC_API_KEY` qoʻshing (model: `ANTHROPIC_MODEL`). Kalitsiz ham `.txt` / JSON / oddiy formatdagi Word va PDF ishlaydi. **AI bilan ajratish haqiqiy kalit bilan hali sinab koʻrilmagan** — birinchi marta kichik hujjat bilan tekshiring.

---

## 8. Internetga chiqarish (Vercel + Supabase)

Vercel’da fayl tizimi vaqtinchalik, shuning uchun **Supabase** (baza + fayllar) shart.

1. **Supabase** da yangi loyiha oching.
2. **Storage** → `media` nomli **public** bucket yarating.
3. **Project Settings → Database → Connection string → Transaction pooler** manzilini oling (`DATABASE_URL`). Jadvallar birinchi ishga tushishda oʻzi yaratiladi (xohlasangiz `supabase/schema.sql` ni SQL Editorda ham ishga tushirishingiz mumkin).
4. **Project Settings → API**: `SUPABASE_URL` va `service_role` kaliti (`SUPABASE_SERVICE_ROLE_KEY` — faqat serverda, hech qayerga oshkor qilmang).
5. Repo’ni GitHub’ga yuklang → **Vercel → New Project** → shu repo.
6. Vercel → Settings → Environment Variables:

| Oʻzgaruvchi | Izoh |
| --- | --- |
| `DATABASE_URL` | Supabase pooler manzili (**majburiy**) |
| `AUTH_SECRET` | 32+ belgi, tasodifiy (`openssl rand -base64 32`) (**majburiy**) |
| `ADMIN_PASSWORD` | admin paroli (**majburiy**, kuchli qiling) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET=media` | fayllar uchun (**majburiy**) |
| `NEXT_PUBLIC_SITE_URL` | `https://sizning-domen.uz` |
| `ANTHROPIC_API_KEY` | AI import (ixtiyoriy) |
| `PAYME_*`, `CLICK_*` | onlayn toʻlov (ixtiyoriy) |
| `ESKIZ_*` | SMS (ixtiyoriy) |

7. Deploy. Domen ulang (Vercel → Domains). Keyin Payme/Click kabinetlariga `https://<domen>/api/...` manzillarini kiriting.

> Productionda `AUTH_SECRET` va `ADMIN_PASSWORD` boʻlmasa ilova ishga tushmaydi — bu ataylab.

VPS’da (`npm run build && npm start`) PGlite va lokal `uploads/` ham ishlaydi — faqat `.pglite` va `uploads` papkalarini zaxiralab turing.

## 9. Xavfsizlik va ishonchlilik

- `/admin` — middleware bilan yopilgan; kirish urinishlari cheklangan; parollar bcrypt bilan.
- Test vaqti serverda nazorat qilinadi: vaqt tugagach javob qabul qilinmaydi, natija avtomatik hisoblanadi. Tugallanmagan urinish davom ettiriladi (kredit ikki marta sarflanmaydi).
- Yuklash: audio — mp3/m4a/ogg/wav/webm/aac (≤20 MB), rasm — jpg/png/webp (≤5 MB). SVG taqiqlangan.
- Toʻlov webhooklari takroriy chaqiruvga chidamli (obuna faqat bir marta ochiladi).

## 10. Hozircha yoʻq narsalar

- Telegram orqali kirish (kirish telefon + parol; SMS faqat parolni tiklashda).
- DTM boʻlimi — «tez orada» (admin → Imtihon turlari orqali yoqiladi).
- Oferta va maxfiylik matnlari — shablon; yurist koʻrib chiqsin.

## 11. Muammolar

| Alomat | Yechim |
| --- | --- |
| Port 3000 band | Eski `next dev` ni toʻxtating yoki `npm run dev -- -p 3002` |
| Baza «buzildi» | Serverni toʻxtating, `.pglite` ni oʻchiring (maʼlumot oʻchadi!), qayta ishga tushiring |
| Mikrofon ishlamayapti | Brauzer ruxsatini tekshiring; sayt `https://` yoki `localhost` boʻlsin |
| Admin parolini unutdim | `.env.local` dagi `ADMIN_PASSWORD` ni oʻzgartirib, serverni qayta ishga tushiring |
| Vercel’da «DATABASE_URL majburiy» | 8-band, 3-qadam |

## Stack

Next.js 15 · TypeScript · Tailwind v4 · Radix (shadcn uslubi) · Drizzle ORM · PostgreSQL/PGlite · Supabase Storage · Anthropic API · Onest + Instrument Serif.
