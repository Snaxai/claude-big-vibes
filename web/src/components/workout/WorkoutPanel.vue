<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useWorkoutStore } from "@/stores/workouts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dumbbell, Play, Calendar, Hash } from "lucide-vue-next";
import ActiveSession from "./ActiveSession.vue";
import ExerciseDialog from "./ExerciseDialog.vue";

const store = useWorkoutStore();

const showStartDialog = ref(false);
const sessionName = ref("");
const starting = ref(false);

onMounted(async () => {
  await Promise.all([
    store.fetchExercises(),
    store.fetchSessions(),
    store.fetchActiveSession(),
  ]);
});

async function handleStart() {
  if (!sessionName.value) return;
  starting.value = true;
  try {
    await store.startSession(sessionName.value);
    sessionName.value = "";
    showStartDialog.value = false;
  } finally {
    starting.value = false;
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="flex items-center gap-2 text-xl">
        <Dumbbell class="h-5 w-5" />
        Workouts
      </CardTitle>
      <ExerciseDialog />
    </CardHeader>
    <CardContent>
      <!-- Active session -->
      <ActiveSession
        v-if="store.activeSession"
        :session="store.activeSession"
      />

      <!-- No active session -->
      <div v-else class="space-y-4">
        <Button @click="showStartDialog = true" class="w-full">
          <Play class="h-4 w-4 mr-2" />
          Start Workout
        </Button>

        <!-- Recent sessions list -->
        <div v-if="store.recentSessions.length > 0" class="space-y-2">
          <h4 class="text-sm font-medium text-muted-foreground">Recent Sessions</h4>
          <div
            v-for="session in store.recentSessions"
            :key="session.id"
            class="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
          >
            <div class="min-w-0">
              <p class="font-medium truncate">{{ session.name }}</p>
              <p class="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar class="h-3 w-3" />
                {{ formatDate(session.startedAt) }}
              </p>
            </div>
            <div v-if="(session as any).setCount != null" class="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-2">
              <Hash class="h-3 w-3" />
              {{ (session as any).setCount }} sets
            </div>
          </div>
        </div>

        <p v-else-if="!store.loading" class="text-sm text-muted-foreground text-center py-4">
          No workouts yet. Start your first session!
        </p>
      </div>

      <!-- Start session dialog -->
      <Dialog v-model:open="showStartDialog">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Workout</DialogTitle>
          </DialogHeader>
          <form @submit.prevent="handleStart" class="space-y-4">
            <Input
              v-model="sessionName"
              placeholder="Workout name, e.g. Push Day"
              autofocus
            />
            <div class="flex justify-end gap-2">
              <Button variant="outline" type="button" @click="showStartDialog = false">
                Cancel
              </Button>
              <Button type="submit" :disabled="!sessionName || starting">
                <Play class="h-4 w-4 mr-1" />
                Start
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
</template>
