-- ovoza schema (idempotent). Generated from src/db/ddl.ts
CREATE TABLE IF NOT EXISTS exam_types (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL DEFAULT 'teacher',
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  coming_soon BOOLEAN NOT NULL DEFAULT FALSE,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  exam_type_id INTEGER NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS subjects_exam_slug ON subjects(exam_type_id, slug);
CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_min INTEGER NOT NULL DEFAULT 60,
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL DEFAULT 0,
  topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS questions_test ON questions(test_id, position);
CREATE TABLE IF NOT EXISTS explanations (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
  audio_url TEXT,
  audio_duration_sec REAL,
  note TEXT NOT NULL DEFAULT '',
  author_name TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS explanation_images (
  id SERIAL PRIMARY KEY,
  explanation_id INTEGER NOT NULL REFERENCES explanations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  start_sec REAL NOT NULL DEFAULT 0,
  caption TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS similar_questions (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL UNIQUE REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'teacher',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  guest_id TEXT,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS attempt_answers (
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_index INTEGER,
  is_guess BOOLEAN NOT NULL DEFAULT FALSE,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (attempt_id, question_id)
);
CREATE TABLE IF NOT EXISTS feedback (
  user_key TEXT NOT NULL,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_key, question_id)
);
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'teacher',
  price_uzs INTEGER NOT NULL DEFAULT 0,
  price_note TEXT NOT NULL DEFAULT '',
  period_days INTEGER,
  tests_limit INTEGER,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_highlighted BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  tests_left INTEGER,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  amount_uzs INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS time_spent_sec INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS attempts_user ON attempts(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS attempts_guest ON attempts(guest_id);
CREATE INDEX IF NOT EXISTS attempts_test ON attempts(test_id);
CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subs_user ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS tests_subject ON tests(subject_id, is_published);
