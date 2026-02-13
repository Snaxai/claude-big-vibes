<script setup lang="ts">
import { ref } from "vue";
import { useProgramStore } from "@/stores/programs";
import { useWorkoutStore } from "@/stores/workouts";
import type { ProgramDay } from "shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-vue-next";

const props = defineProps<{ day: ProgramDay; programId: number }>();
const emit = defineEmits<{ updated: [] }>();

const programStore = useProgramStore();
const workoutStore = useWorkoutStore();

const expanded = ref(true);
const showAddExercise = ref(false);
const newExercise = ref({ exerciseId: 0, targetSets: 3, targetReps: 10, targetWeight: undefined as number | undefined });

async function deleteDay() {
  await programStore.deleteDay(props.programId, props.day.id);
  emit("updated");
}

async function addExercise() {
  if (!newExercise.value.exerciseId) return;
  await programStore.addExerciseToDay(props.programId, props.day.id, {
    exerciseId: newExercise.value.exerciseId,
    targetSets: newExercise.value.targetSets,
    targetReps: newExercise.value.targetReps,
    targetWeight: newExercise.value.targetWeight,
  });
  newExercise.value = { exerciseId: 0, targetSets: 3, targetReps: 10, targetWeight: undefined };
  showAddExercise.value = false;
  emit("updated");
}

async function removeExercise(exId: number) {
  await programStore.removeExerciseFromDay(props.programId, props.day.id, exId);
  emit("updated");
}
</script>

<template>
  <div class="rounded-lg border p-3 space-y-2">
    <div class="flex items-center justify-between">
      <button class="flex items-center gap-2 text-sm font-medium" @click="expanded = !expanded">
        <component :is="expanded ? ChevronUp : ChevronDown" class="h-4 w-4" />
        {{ day.name }}
      </button>
      <Button variant="ghost" size="icon" @click="deleteDay">
        <Trash2 class="h-4 w-4 text-destructive" />
      </Button>
    </div>

    <div v-if="expanded" class="space-y-2 pl-6">
      <!-- Exercises list -->
      <div
        v-for="ex in day.exercises"
        :key="ex.id"
        class="flex items-center justify-between text-sm rounded bg-muted p-2"
      >
        <div>
          <span class="font-medium">{{ ex.exercise?.name || `Exercise #${ex.exerciseId}` }}</span>
          <span class="text-muted-foreground ml-2">
            {{ ex.targetSets }}×{{ ex.targetReps }}
            <span v-if="ex.targetWeight"> @ {{ ex.targetWeight }}kg</span>
          </span>
        </div>
        <Button variant="ghost" size="icon" @click="removeExercise(ex.id)">
          <Trash2 class="h-3 w-3 text-destructive" />
        </Button>
      </div>

      <div v-if="!day.exercises?.length" class="text-xs text-muted-foreground">
        No exercises added yet.
      </div>

      <!-- Add exercise form -->
      <div v-if="showAddExercise" class="space-y-2 rounded border p-2">
        <div>
          <Label class="text-xs">Exercise</Label>
          <select
            v-model.number="newExercise.exerciseId"
            class="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option :value="0" disabled>Select exercise...</option>
            <option v-for="ex in workoutStore.exercises" :key="ex.id" :value="ex.id">
              {{ ex.name }} ({{ ex.muscleGroup }})
            </option>
          </select>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <Label class="text-xs">Sets</Label>
            <Input v-model.number="newExercise.targetSets" type="number" min="1" />
          </div>
          <div>
            <Label class="text-xs">Reps</Label>
            <Input v-model.number="newExercise.targetReps" type="number" min="1" />
          </div>
          <div>
            <Label class="text-xs">Weight (kg)</Label>
            <Input v-model.number="newExercise.targetWeight" type="number" placeholder="Optional" />
          </div>
        </div>
        <div class="flex gap-2">
          <Button size="sm" @click="addExercise">Add</Button>
          <Button size="sm" variant="outline" @click="showAddExercise = false">Cancel</Button>
        </div>
      </div>

      <Button v-else size="sm" variant="outline" @click="showAddExercise = true">
        <Plus class="h-3 w-3 mr-1" />
        Add Exercise
      </Button>
    </div>
  </div>
</template>
