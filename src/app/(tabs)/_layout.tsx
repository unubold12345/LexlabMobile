import React from "react";
import { Tabs } from "expo-router/js-tabs";
import { FloatingTabBar } from "@/components/TabBar";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Нүүр" }} />
      <Tabs.Screen name="subjects" options={{ title: "Сэдэв" }} />
      <Tabs.Screen name="practice" options={{ title: "Дасгал" }} />
      <Tabs.Screen name="profile" options={{ title: "Профайл" }} />
    </Tabs>
  );
}
