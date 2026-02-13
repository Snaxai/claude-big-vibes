<script setup lang="ts">
import { ref, computed } from "vue";
import { useWorkoutStore } from "@/stores/workouts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Library } from "lucide-vue-next";

const store = useWorkoutStore();

const open = ref(false);
const name = ref("");
const muscleGroup = ref("");
const equipment = ref("");
const submitting = ref(false);

const muscleGroups = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Core",
  "Cardio",
  "Other",
];

const grouped = computed(() => {
  const map = new Map<string, typeof store.exercises>();
  for (const ex of store.exercises) {
    const group = ex.muscleGroup || "Other";
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push(ex);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
});

async function addExercise() {
  if (!name.value || !muscleGroup.value) return;
  submitting.value = true;
  try {
    await store.createExercise({
      name: name.value,
      muscleGroup: muscleGroup.value,
      equipment: equipment.value || undefined,
    });
    name.value = "";
    muscleGroup.value = "";
    equipment.value = "";
  } finally {
    submitting.value = false;
  }
}

async function removeExercise(id: number) {
  await store.deleteExercise(id);
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger>
      <Button variant="outline" size="sm">
        <Library class="h-4 w-4 mr-1" />
        Exercise Library
      </Button>
    </DialogTrigger>
    <DialogContent class="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Exercise Library</DialogTitle>
      </DialogHeader>

      <form @submit.prevent="addExercise" class="space-y-3 border-b border-border pb-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label>Name</Label>
            <Input v-model="name" placeholder="e.g. Bench Press" />
          </div>
          <div class="space-y-1.5">
            <Label>Muscle Group</Label>
            <Select v-model="muscleGroup">
              <SelectTrigger>
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem v-for="mg in muscleGroups" :key="mg" :value="mg">
                  {{ mg }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div class="space-y-1.5">
          <Label>Equipment (optional)</Label>
          <Input v-model="equipment" placeholder="e.g. Barbell, Dumbbell" />
        </div>
        <Button type="submit" size="sm" :disabled="!name || !muscleGroup || submitting">
          <Plus class="h-4 w-4 mr-1" />
          Add Exercise
        </Button>
      </form>

      <div v-if="grouped.length === 0" class="text-sm text-muted-foreground text-center py-4">
        No exercises yet. Add your first exercise above.
      </div>

      <div v-for="[group, exercises] in grouped" :key="group" class="space-y-2">
        <h4 class="text-sm font-medium text-muted-foreground">{{ group }}</h4>
        <div
          v-for="ex in exercises"
          :key="ex.id"
          class="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
        >
          <div>
            <span class="font-medium">{{ ex.name }}</span>
            <span v-if="ex.equipment" class="text-muted-foreground ml-2 text-xs">
              {{ ex.equipment }}
            </span>
          </div>
          <button
            @click="removeExercise(ex.id)"
            class="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
