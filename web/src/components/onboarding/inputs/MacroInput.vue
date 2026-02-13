<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  defaultProtein?: number;
  defaultCarbs?: number;
  defaultFat?: number;
}>();

const emit = defineEmits<{
  submit: [macros: { protein: number; carbs: number; fat: number }];
}>();

const protein = ref(props.defaultProtein ?? 150);
const carbs = ref(props.defaultCarbs ?? 250);
const fat = ref(props.defaultFat ?? 65);

function handleSubmit() {
  emit("submit", { protein: protein.value, carbs: carbs.value, fat: fat.value });
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="handleSubmit">
    <div class="flex items-center gap-3">
      <label class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground w-14">Protein</span>
        <input
          v-model.number="protein"
          type="number"
          min="0"
          class="w-20 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span class="text-sm text-muted-foreground">g</span>
      </label>
      <label class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground w-14">Carbs</span>
        <input
          v-model.number="carbs"
          type="number"
          min="0"
          class="w-20 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span class="text-sm text-muted-foreground">g</span>
      </label>
      <label class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground w-14">Fat</span>
        <input
          v-model.number="fat"
          type="number"
          min="0"
          class="w-20 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span class="text-sm text-muted-foreground">g</span>
      </label>
    </div>
    <button
      type="submit"
      class="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
    >
      Next
    </button>
  </form>
</template>
