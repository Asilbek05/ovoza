import { PageHeader } from "../shell";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./form";

export const metadata = { title: "Sozlamalar" };

export default async function SettingsPage() {
  const values = await getSettings();
  return (
    <>
      <PageHeader title="Sozlamalar" description="Aloqa maʼlumotlari, toʻlov rekvizitlari va yuqori eʼlon. Saytda darhol yangilanadi." />
      <SettingsForm initial={values} />
    </>
  );
}
