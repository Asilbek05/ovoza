# tushun. — to'liq coding prompt

> Bu prompt Claude Code (yoki boshqa AI dasturchi) uchun yozilgan. Uni loyiha papkasida ochib, "PROMPT.md ga qarab ishla" deb bering. Har bir bo'lim — talab. Shubha bo'lsa, **soddaroq va o'qituvchi uchun qulayroq** variantni tanla.

---

## 1. Mahsulot (nima quryapmiz)

**tushun.** — O'zbekistondagi o'qituvchilar (attestatsiya, milliy sertifikat) va abituriyentlar (milliy sertifikat, keyinchalik DTM) uchun demo test platformasi.

Asosiy farq: har bir **xato** savolga ustozning **ovozli tushuntirishi (audio) + 2–4 ta yechim rasmi** beriladi. Rasmlar audio bilan sinxron almashadi (har bir rasmning `start_sec` vaqti bor). Tushuntirishdan keyin **o'xshash savol** chiqadi — tushungani tekshiriladi.

Asosiy halqa (hamma narsa shunga xizmat qiladi):

```
Test yechish → Natija → Xato savollar → Ovozli tushuntirish + rasmlar → O'xshash savol
```

Qo'shimcha: test paytida **"Taxmin qildim"** belgisi. Taxmin bilan topilgan to'g'ri javoblar ham tahlil ro'yxatiga tushadi.

### Mahsulot tamoyillari (buzilmasin)
1. Har ekranda **bitta** asosiy harakat (katta ko'k tugma).
2. **Telefon birinchi.** 360px kenglikda mukammal ishlashi shart. 3G'da tez ochilishi kerak.
3. Katta shrift (asosiy matn ≥16px), tugmalar ≥44px balandlik — yoshi kattaroq o'qituvchilar uchun.
4. Reklama, reyting, forum, gamifikatsiya **yo'q**.
5. Interfeys tili — **o'zbek (lotin)**. Apostrof sifatida `ʻ` (U+02BB) ishlatiladi: `Oʻqituvchi`, `toʻgʻri`.
6. Test formati rasmiy imtihonga mos: vaqt, savollar soni, baholash.

---

## 2. Texnologiyalar

| Qatlam | Tanlov | Izoh |
| --- | --- | --- |
| Framework | **Next.js 15 (App Router) + TypeScript** | Server Components, Server Actions |
| UI | **Tailwind CSS v4 + shadcn/ui** (Radix asosida) | komponentlar `src/components/ui` da |
| Bloklar | **21st.dev** dan bepul bloklar (hero, pricing, feature) — moslashtirilgan | ko'chirib, ranglarni tokenlarga almashtirish |
| Admin layout | shadcn **sidebar** bloki (`sidebar-07` uslubi) | bepul, rasmiy |
| Ikonlar | `lucide-react` | |
| Shriftlar | **Bricolage Grotesque** (sarlavhalar), **Onest** (matn) — `next/font/google` | ikkalasi ham o'zbek lotinini qo'llaydi |
| DB | **PostgreSQL** + **Drizzle ORM** | prod: Supabase Postgres; local: **PGlite** (sozlashsiz) |
| Fayllar | Storage adapter: local `public/uploads` (dev) yoki **Supabase Storage** (prod) | audio, rasmlar |
| Auth (foydalanuvchi) | telefon + parol, `bcryptjs`, `jose` JWT cookie | keyin SMS/Telegram qo'shiladi |
| Auth (admin) | `ADMIN_PASSWORD` env + alohida imzolangan cookie | |
| AI import | **Anthropic API** (`claude-sonnet-5-5`) — matn/DOCX/PDF dan savollarni JSON ga ajratish | `mammoth` (docx), `unpdf` (pdf) |
| To'lov | Click / Payme — **provider interfeysi** + "pending" buyurtmalar; admin qo'lda faollashtira oladi | merchant kalitlari keyin |
| Validatsiya | `zod` | barcha formalar va server actionlar |
| Toast | `sonner` | |

### Muhit o'zgaruvchilari (`.env.example`)
```
DATABASE_URL=            # bo'sh bo'lsa → PGlite (./.pglite)
AUTH_SECRET=             # 32+ belgi
ADMIN_PASSWORD=          # admin panelga kirish
ANTHROPIC_API_KEY=       # AI import uchun
SUPABASE_URL=            # bo'sh bo'lsa → local public/uploads
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=media
```

---

## 3. Ma'lumotlar bazasi (Drizzle sxemasi)

```
exam_types        id, slug (attestatsiya | milliy-sertifikat | dtm), name, short, audience ('teacher'|'applicant'|'both'),
                  description, is_active, coming_soon, sort
subjects          id, exam_type_id → exam_types, name, slug, color ('blue'|'yellow'|'green'|'coral'|'violet'|'teal'),
                  is_active, sort, created_at     UNIQUE(exam_type_id, slug)
tests             id, subject_id → subjects, title, description, duration_min, is_free, is_published, sort, created_at
questions         id, test_id → tests, position, text, options (jsonb string[2..6]), correct_index, topic, created_at
explanations      id, question_id (unique) → questions, audio_url, audio_duration_sec, note, author_name, updated_at
explanation_images id, explanation_id → explanations, url, start_sec, caption, position
similar_questions id, question_id (unique) → questions, text, options (jsonb), correct_index
users             id, name, phone (unique), password_hash, audience ('teacher'|'applicant'), created_at
attempts          id, user_id, test_id, started_at, finished_at, correct_count, total
attempt_answers   attempt_id, question_id, selected_index (null = javobsiz), is_guess, is_correct   PK(attempt_id, question_id)
feedback          user_id, question_id, value ('understood'|'not_understood'), created_at
plans             id, code, name, audience, price_uzs, period_days (null = bir martalik), tests_limit (null = cheksiz),
                  features (jsonb string[]), is_highlighted, is_active, sort
subscriptions     id, user_id, plan_id, starts_at, ends_at, status ('active'|'expired'|'cancelled')
orders            id, user_id, plan_id, amount_uzs, provider ('click'|'payme'|'manual'), status ('pending'|'paid'|'failed'), created_at
```

O'chirish qoidasi: fan o'chirilsa — uning testlari ham (cascade), lekin testida urinishlar bo'lsa, **o'chirish o'rniga arxivlash** (`is_active=false`) taklif qilinadi.

### Seed (default ma'lumotlar)
**Imtihon turlari:**
- Attestatsiya — oʻqituvchilar — faol
- Milliy sertifikat — oʻqituvchilar va abituriyentlar — faol
- DTM testlari — abituriyentlar — `coming_soon = true`

**Attestatsiya fanlari:** Matematika, Ona tili va adabiyot, Ingliz tili, Rus tili, Tarix, Fizika, Kimyo, Biologiya, Geografiya, Informatika, Boshlangʻich taʼlim.

**Milliy sertifikat fanlari:** Matematika, Ona tili va adabiyot, Tarix, Fizika, Kimyo, Biologiya, Geografiya, Rus tili, Informatika.

**Demo test:** "Matematika · demo №1" (attestatsiya, `is_free=true`), 5 ta savol; 1-savol (kvadrat tenglama 2x² − 8x + 6 = 0) uchun to'liq tushuntirish: audio + 3 rasm (0s, 40s, 90s) + o'xshash savol.

**Tariflar** (narxlar bozorga qarab qo'yilgan — 7-bo'limga qarang).

Qolgan fanlar va testlar admin paneldagi CRUD orqali qo'shiladi.

---

## 4. Admin panel (`/admin`)

Layout: chap tomonda yig'iladigan sidebar (telefonda Sheet), yuqorida breadcrumb. Fon `#F4F8FF`, kartochkalar oq, radius 20px.

| Sahifa | Nima qiladi |
| --- | --- |
| `/admin/login` | Parol bilan kirish |
| `/admin` | Statistika: foydalanuvchilar, testlar, savollar, tushuntirishsiz savollar soni (eng muhim raqam!), oxirgi to'lovlar |
| `/admin/imtihonlar` | Imtihon turlari: nom, tavsif, faol/tez orada — tahrirlash |
| `/admin/fanlar` | **Fanlar CRUD**: imtihon turi bo'yicha tablar, jadval (nom, testlar soni, faol, tartib), qo'shish/tahrirlash dialogi, o'chirish tasdig'i |
| `/admin/testlar` | Testlar ro'yxati (filtr: imtihon turi, fan, holat) + yangi test |
| `/admin/testlar/[id]` | Test sozlamalari + savollar ro'yxati. Har savol yonida tushuntirish holati: ✓ audio, rasmlar soni, o'xshash savol bor/yo'q |
| `/admin/testlar/[id]/import` | **AI import** (pastda) |
| `/admin/savollar/[id]` | Savol tahriri + **tushuntirish muharriri**: audio yuklash, rasmlar (drag-tartib, har biriga `start_sec`), izoh matni, muallif, o'xshash savol, jonli ko'rinish (foydalanuvchi ko'radigan pleyer) |
| `/admin/tariflar` | Tariflar CRUD (narx, muddat, imkoniyatlar ro'yxati, ajratilgan) |
| `/admin/foydalanuvchilar` | Ro'yxat, qidiruv, qo'lda obuna berish |
| `/admin/tolovlar` | Buyurtmalar, holatni "to'langan" ga o'tkazish (obunani avtomatik faollashtiradi) |

### AI import oqimi
1. Admin matnni joylaydi **yoki** fayl yuklaydi (`.txt`, `.docx`, `.pdf`, `.json`).
2. Server matnni ajratib oladi → Anthropic API ga yuboradi, qat'iy JSON sxema bilan:
   `{ questions: [{ text, options: string[], correct_index: number|null, topic: string|null }] }`
3. Natija **ko'rib chiqish jadvalida** chiqadi: har qatorni tahrirlash, to'g'ri javobni tanlash, o'chirish. `correct_index = null` bo'lsa — qizil belgi.
4. "Saqlash" → savollar testga qo'shiladi (mavjudlarining oxiriga).
5. API kaliti bo'lmasa: JSON formatidagi import baribir ishlaydi; AI tugmasi o'chirilgan va sababi yoziladi.

### Audio yuklash
- Qabul: `mp3, m4a, ogg, wav, webm`, ≤ 20 MB. Rasmlar: `jpg, png, webp`, ≤ 5 MB.
- Davomiylik brauzerda o'lchanadi va saqlanadi.
- Rasm `start_sec` ni "hozirgi vaqtni olish" tugmasi bilan audio pleyerdan olish mumkin.

---

## 5. Foydalanuvchi qismi

| Sahifa | Mazmun |
| --- | --- |
| `/` | Landing: hero (chat ko'rinishidagi ovozli xabar maketi), 3 yo'nalish, 3 qadam, imkoniyatlar, tariflar, CTA |
| `/imtihon/[slug]` | Imtihon turi → fanlar gridi (rangli kartochkalar, testlar soni) |
| `/imtihon/[slug]/[subject]` | Fan → testlar ro'yxati (bepul belgisi, savollar soni, vaqt) |
| `/test/[id]` | Test oldi: qoidalar, vaqt, savollar soni, "Boshlash" |
| `/urinish/[id]` | **Test yechish**: taymer, savol, variantlar, "Aniq bilaman / Taxmin qildim", savollar xaritasi, oldingi/keyingi, yakunlash tasdig'i. Javoblar har o'zgarishda saqlanadi (sahifa yangilansa yo'qolmaydi) |
| `/natija/[id]` | Ball halqasi, toʻgʻri/xato/taxmin chiplari, mavzular xaritasi, **ovozli xabarlar** ro'yxati |
| `/natija/[id]/[questionId]` | **Tahlil (chat ko'rinishida)**: savol pufakchasi, sizning javobingiz (qizil), ovozli xabar (play/pauza, to'lqin, tezlik 1×/1.25×/1.5×), rasm-karusel audio bilan sinxron, izoh, "Tushundim / Yana tushuntiring", o'xshash savol, keyingi xato |
| `/tariflar` | O'qituvchilar / Abituriyentlar / Maktablar tablari |
| `/kirish`, `/royxat` | Telefon (+998 maskasi) va parol |
| `/kabinet` | Urinishlarim, obunam |

### Kirish qoidalari (paywall)
- Ro'yxatdan o'tmagan foydalanuvchi bepul testni yecha oladi (urinish — anonim cookie bilan), natijani ko'rish uchun ro'yxatdan o'tadi.
- Bepul testda **birinchi 3 ta xato** tushuntirishi ochiq; qolganlari — qulf + "Tariflar" tugmasi.
- Pullik testlar — faol obuna bilan.

---

## 6. Dizayn tizimi

Yorug', ko'k, ta'limga xos — lekin "shablon"ga o'xshamasin. Asosiy obraz: **ustozdan kelgan ovozli xabar** (Telegram ovozli xabari kabi).

```
--bg            #F4F8FF   sahifa foni (juda och ko'k)
--surface       #FFFFFF   kartochkalar
--ink           #0F1B3D   asosiy matn
--muted         #55627F   ikkinchi darajali matn (oqda 6:1)
--line          #DCE5F5   chegaralar
--primary       #2557E8   asosiy ko'k (oq matn bilan 5.3:1)
--primary-deep  #163A9E
--primary-soft  #E3ECFF
--accent        #FFD24A   sariq marker (faqat to'q matn bilan)
--accent-soft   #FFF4CC
--success       #1A8B55 / soft #DDF5E8
--danger-text   #B42D33 / soft #FFE8E8
```
- Radius: kartochka 24–32px, tugma `999px` (pill), input 14px.
- Sarlavhalar: Bricolage Grotesque 800, `letter-spacing: -0.02em`. Matn: Onest 400–700.
- Imzo elementlari: ko'k "nutq pufakchasi" logotip (`border-radius: 14px 14px 14px 4px`), sariq marker bilan ajratilgan so'z, to'lqin (waveform) chiziqlari, yechim rasmlarida sariq highlight.
- Soya faqat asosiy CTA va hero maketida. Gradient yo'q. Emoji yo'q.
- Hamma interaktiv element: `focus-visible` halqasi (`--primary`, 2px offset).
- Dark mode — MVPda kerak emas.

---

## 7. Narxlar (bozor tahlili asosida, adminda o'zgartiriladi)

Bozor: sinov.uz platformasida attestatsiya testlari **10 000–50 000 so'm** (tushuntirishsiz). Milliy sertifikat imtihonining o'zi bir fan uchun ~**556 200 so'm**. Raqobatchi mock-test saytlari asosan bepul, lekin xatolarni ovoz bilan tushuntirmaydi.

| Auditoriya | Tarif | Narx | Nima kiradi |
| --- | --- | --- | --- |
| Hamma | Bepul | 0 | 1 demo test + 3 ta xato tushuntirishi |
| Oʻqituvchi | Bitta test | **25 000 soʻm** | 1 test + barcha xatolar tahlili |
| Oʻqituvchi | Oylik | **89 000 soʻm / oy** | Barcha fanlar, cheksiz testlar, barcha tushuntirishlar |
| Oʻqituvchi | Imtihongacha (3 oy) | **219 000 soʻm** | Oylik × 3, ~18% arzon |
| Abituriyent | Bitta test | **15 000 soʻm** | 1 test + barcha xatolar |
| Abituriyent | Oylik | **49 000 soʻm / oy** | Cheksiz testlar |
| Abituriyent | 3 oy | **119 000 soʻm** | |
| Maktab | Jamoa | **59 000 soʻm / oʻqituvchi / oy** (kamida 10) | Admin hisobot |

---

## 8. Sifat talablari (qabul mezonlari)

- `npm run build` xatosiz, `npm run lint` toza, TypeScript `strict`.
- `npm run dev` **hech qanday sozlashsiz** ishga tushadi (PGlite + local uploads + avtomatik migratsiya va seed).
- Lighthouse (mobil): Performance ≥ 90, Accessibility ≥ 95.
- Barcha formalar: zod validatsiya, xato matnlari o'zbekcha, tugma yuklanish holati.
- Bo'sh holatlar: "Hali fan yo'q — birinchisini qo'shing" kabi aniq yo'l-yo'riq.
- Admin harakatlari: muvaffaqiyat/xato toast, o'chirishdan oldin tasdiqlash.
- Test yechishda javoblar serverga saqlanadi; taymer tugasa avtomatik yakunlanadi.
- Audio pleyer: klaviatura (Space = play/pauza), `aria-label` lar, yuklab olish tugmasi yo'q (`controlsList="nodownload"`).
- 360px, 768px, 1280px kengliklarda skrinshot bilan tekshirish.

---

## 9. Bajarish tartibi

1. Skelet: Next.js, Tailwind tokenlari, shriftlar, `src/components/ui` (button, input, label, textarea, select, dialog, sheet, table, badge, card, tabs, switch, dropdown-menu, alert-dialog, sonner).
2. DB: Drizzle sxemasi, PGlite/Postgres ulanish, migratsiya, seed.
3. Admin: login → layout → fanlar CRUD → testlar → savollar → tushuntirish muharriri → AI import → tariflar → foydalanuvchilar/to'lovlar.
4. Frontend: landing → imtihon/fan/test sahifalari → test yechish → natija → tahlil pleyeri → tariflar → auth → kabinet.
5. Tekshirish: build, lint, Playwright skrinshotlari (telefon + laptop), asosiy oqimni boshidan oxirigacha bosib chiqish.
