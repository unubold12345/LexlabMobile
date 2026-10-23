import React, { useState } from "react";
import { useRouter } from "expo-router";
import { PageHeader } from "@/components/PageHeader";
import { PlanBoard } from "@/components/PlanBoard";
import { QuizSetupSheet } from "@/components/QuizSetupSheet";
import { Screen } from "@/components/Screen";

export default function Plan() {
  const router = useRouter();
  const [setup, setSetup] = useState<{ main: string; sub: string; total: number } | null>(null);

  return (
    <Screen>
      <PageHeader />

      <PlanBoard onStart={(main, sub, total) => setSetup({ main, sub, total })} />

      <QuizSetupSheet
        visible={setup !== null}
        main={setup?.main ?? "all"}
        sub={setup?.sub ?? ""}
        total={setup?.total ?? 0}
        onClose={() => setSetup(null)}
        onStart={(mode, count) => {
          if (!setup) return;
          const scope = setup;
          setSetup(null);
          router.push({
            pathname: "/quiz",
            params: {
              main: scope.main,
              sub: scope.sub,
              count: String(count),
              mode,
            },
          });
        }}
      />
    </Screen>
  );
}
