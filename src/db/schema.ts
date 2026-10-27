import {
  pgTable, serial, integer, text, boolean, timestamp, jsonb, uuid, real, primaryKey, uniqueIndex,
} from "drizzle-orm/pg-core";

export const examTypes = pgTable("exam_types", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  short: text("short").notNull().default(""),
  audience: text("audience").notNull().default("teacher"), // teacher | applicant | both
  description: text("description").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  comingSoon: boolean("coming_soon").notNull().default(false),
  sort: integer("sort").notNull().default(0),
});

export const subjects = pgTable(
  "subjects",
  {
    id: serial("id").primaryKey(),
    examTypeId: integer("exam_type_id").notNull().references(() => examTypes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color").notNull().default("blue"),
    isActive: boolean("is_active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("subjects_exam_slug").on(t.examTypeId, t.slug)],
);

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  durationMin: integer("duration_min").notNull().default(60),
  isFree: boolean("is_free").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  text: text("text").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctIndex: integer("correct_index").notNull().default(0),
  topic: text("topic"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const explanations = pgTable("explanations", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().unique().references(() => questions.id, { onDelete: "cascade" }),
  audioUrl: text("audio_url"),
  audioDurationSec: real("audio_duration_sec"),
  note: text("note").notNull().default(""),
  authorName: text("author_name").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const explanationImages = pgTable("explanation_images", {
  id: serial("id").primaryKey(),
  explanationId: integer("explanation_id").notNull().references(() => explanations.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  startSec: real("start_sec").notNull().default(0),
  caption: text("caption").notNull().default(""),
  position: integer("position").notNull().default(0),
});

export const similarQuestions = pgTable("similar_questions", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().unique().references(() => questions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctIndex: integer("correct_index").notNull().default(0),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  audience: text("audience").notNull().default("teacher"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attempts = pgTable("attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  guestId: text("guest_id"),
  testId: integer("test_id").notNull().references(() => tests.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  correctCount: integer("correct_count").notNull().default(0),
  total: integer("total").notNull().default(0),
});

export const attemptAnswers = pgTable(
  "attempt_answers",
  {
    attemptId: uuid("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
    questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    selectedIndex: integer("selected_index"),
    isGuess: boolean("is_guess").notNull().default(false),
    isCorrect: boolean("is_correct").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.attemptId, t.questionId] })],
);

export const feedback = pgTable(
  "feedback",
  {
    userKey: text("user_key").notNull(),
    questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
    value: text("value").notNull(), // understood | not_understood
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userKey, t.questionId] })],
);

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  audience: text("audience").notNull().default("teacher"), // teacher | applicant | school
  priceUzs: integer("price_uzs").notNull().default(0),
  priceNote: text("price_note").notNull().default(""),
  periodDays: integer("period_days"),
  testsLimit: integer("tests_limit"),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  isHighlighted: boolean("is_highlighted").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => plans.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  testsLeft: integer("tests_left"),
  status: text("status").notNull().default("active"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => plans.id),
  amountUzs: integer("amount_uzs").notNull(),
  provider: text("provider").notNull().default("manual"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ExamType = typeof examTypes.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Test = typeof tests.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Explanation = typeof explanations.$inferSelect;
export type ExplanationImage = typeof explanationImages.$inferSelect;
export type SimilarQuestion = typeof similarQuestions.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type User = typeof users.$inferSelect;
