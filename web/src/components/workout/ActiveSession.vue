<script setup lang="ts">
import { computed } from "vue";
import type { WorkoutSession, WorkoutSet } from "shared";
import { useWorkoutStore } from "@/stores/workouts";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Clock } from "lucide-vue-next";
import LogSetForm from "./LogSetForm.vue";
import PRBadge from "./PRBadge.vue";

const props = defineProps<{
  session: WorkoutSession & { sets: WorkoutSet[] };
}>();

const store = useWorkoutStore();

const startTime = computed(() => {
  const d = new Date(props.session.startedAt);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
});

const setsByExercise = computed(() => {
  const grouped = new Map<number, { exercise: string; sets: WorkoutSet[] }>();
  for (const set of props.session.sets) {
    if (!grouped.has(set.exerciseId)) {
      const ex = store.exercises.find(e => e.id === set.exerciseId);
      grouped.set(set.exerciseId, {
        exercise: ex?.name ?? `Exercise #${set.exerciseId}`,
        sets: [],
      });
    }
    grouped.get(set.exerciseId)!.sets.push(set);
  }
  return [...grouped.values()];
});

async function handleFinish() {
  await store.finishSession(props.session.id);
}

async function handleDeleteSet(setId: number) {
  await store.deleteSet(props.session.id, setId);
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">{{ session.name }}</h3>
        <p class="text-sm text-muted-foreground flex items-center gap-1">
          <Clock class="h-3.5 w-3.5" />
          Started at {{ startTime }}
        </p>
      </div>
      <Button variant="outline" size="sm" @click="handleFinish">
        <CheckCircle class="h-4 w-4 mr-1" />
        Finish Workout
      </Button>
    </div>

    <LogSetForm :session-id="session.id" @logged="() => {}" />

    <div v-if="setsByExercise.length === 0" class="text-sm text-muted-foreground text-center py-4">
      No sets logged yet. Use the form above to log your first set.
    </div>

    <div v-for="group in setsByExercise" :key="group.exercise" class="space-y-2">
      <h4 class="text-sm font-medium text-muted-foreground">{{ group.exercise }}</h4>
      <div class="space-y-1">
        <div
          v-for="(set, idx) in group.sets"
          :key="set.id"
          class="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
        >
          <div class="flex items-center gap-3">
            <span class="text-muted-foreground font-mono text-xs w-6">
              #{{ idx + 1 }}
            </span>
            <span class="font-medium">
              {{ set.weight }}kg x {{ set.reps }}
            </span>
            <span v-if="set.rpe" class="text-muted-foreground text-xs">
              RPE {{ set.rpe }}
            </span>
            <PRBadge v-if="set.isPR" />
          </div>
          <button
            @click="handleDeleteSet(set.id)"
            class="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
