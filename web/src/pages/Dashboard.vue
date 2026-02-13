<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useWebSocket } from "@/composables/useWebSocket";
import { useWorkoutStore } from "@/stores/workouts";
import { useMealStore } from "@/stores/meals";
import { useBodyLogStore } from "@/stores/bodylog";
import { useProgramStore } from "@/stores/programs";
import { useSettingsStore } from "@/stores/settings";
import WorkoutPanel from "@/components/workout/WorkoutPanel.vue";
import MealsPanel from "@/components/meals/MealsPanel.vue";
import BodyPanel from "@/components/body/BodyPanel.vue";
import PlannerPanel from "@/components/planner/PlannerPanel.vue";
import type { WSEvent } from "shared";

const workoutStore = useWorkoutStore();
const mealStore = useMealStore();
const bodyLogStore = useBodyLogStore();
const programStore = useProgramStore();
const settingsStore = useSettingsStore();

function handleWsEvent(event: WSEvent) {
  switch (event.type) {
    case "workout:updated":
    case "workout:setLogged":
      workoutStore.fetchSessions();
      workoutStore.fetchActiveSession();
      break;
    case "meal:updated":
      mealStore.fetchMeals();
      mealStore.fetchSummary();
      break;
    case "body:updated":
      bodyLogStore.fetchLogs();
      break;
    case "program:updated":
      programStore.fetchPrograms();
      break;
    case "settings:updated":
      settingsStore.fetchSettings();
      break;
  }
}

const ws = useWebSocket(handleWsEvent);

onMounted(() => {
  settingsStore.fetchSettings();
});

onUnmounted(() => {
  ws.close();
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-3xl font-bold">Dashboard</h1>

    <div class="grid gap-6 md:grid-cols-2">
      <WorkoutPanel />
      <MealsPanel />
      <BodyPanel />
      <PlannerPanel />
    </div>
  </div>
</template>
