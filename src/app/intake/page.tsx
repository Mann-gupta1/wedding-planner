import { AppShell } from "@/components/layout/AppShell";
import { IntakeWizard } from "@/components/intake/IntakeWizard";

export default function IntakePage() {
  return (
    <AppShell activeNav="intake" topNavActive="planning">
      <IntakeWizard />
    </AppShell>
  );
}
