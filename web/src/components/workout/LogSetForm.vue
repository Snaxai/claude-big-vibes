<script setup lang="ts">
import { ref } from "vue";
import { useWorkoutStore } from "@/stores/workouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-vue-next";

const props = defineProps<{ sessionId: number }>();
const emit = defineEmits<{ logged: [] }>();

const store = useWorkoutStore();

const exerciseId = ref<string>("");
const weight = ref<string>("");
const reps = ref<string>("");
const rpe = ref<string>("");
const submitting = ref(false);

async function submit() {
  if (!exerciseId.value || !weight.value || !reps.value) return;
  submitting.value = true;
  try {
    await store.logSet(props.sessionId, {
      exerciseId: Number(exerciseId.value),
      weight: Number(weight.value),
      reps: Number(reps.value),
      rpe: rpe.value ? Number(rpe.value) : undefined,
    });
    weight.value = "";
    reps.value = "";
    rpe.value = "";
    emit("logged");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="flex flex-col sm:flex-row gap-2 items-end">
    <div class="w-full sm:w-40">
      <Select v-model="exerciseId">
        <SelectTrigger class="h-9 text-xs">
          <SelectValue placeholder="Exercise" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem
            v-for="ex in store.exercises"
            :key="ex.id"
            :value="String(ex.id)"
          >
            {{ ex.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <Input
      v-model="weight"
      type="number"
      placeholder="Weight"
      class="h-9 w-full sm:w-20 text-xs"
      min="0"
      step="0.5"
    />
    <Input
      v-model="reps"
      type="number"
      placeholder="Reps"
      class="h-9 w-full sm:w-16 text-xs"
      min="1"
    />
    <Input
      v-model="rpe"
      type="number"
      placeholder="RPE"
      class="h-9 w-full sm:w-16 text-xs"
      min="1"
      max="10"
    />
    <Button
      type="submit"
      size="sm"
      :disabled="!exerciseId || !weight || !reps || submitting"
      class="w-full sm:w-auto"
    >
      <Plus class="h-4 w-4 mr-1" />
      Log Set
    </Button>
  </form>
</template>
