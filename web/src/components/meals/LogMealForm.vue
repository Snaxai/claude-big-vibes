<script setup lang="ts">
import { ref, watchEffect } from "vue";
import type { Meal } from "shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { useMealStore } from "@/stores/meals";

const props = defineProps<{
  meal?: Meal;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const store = useMealStore();

const name = ref("");
const calories = ref("");
const protein = ref("");
const carbs = ref("");
const fat = ref("");
const saving = ref(false);

watchEffect(() => {
  if (props.meal) {
    name.value = props.meal.name;
    calories.value = String(props.meal.calories);
    protein.value = String(props.meal.protein);
    carbs.value = String(props.meal.carbs);
    fat.value = String(props.meal.fat);
  }
});

async function onSubmit() {
  if (!name.value.trim()) return;

  saving.value = true;
  try {
    const data = {
      name: name.value.trim(),
      calories: Number(calories.value) || 0,
      protein: Number(protein.value) || 0,
      carbs: Number(carbs.value) || 0,
      fat: Number(fat.value) || 0,
    };

    if (props.meal) {
      await store.updateMeal(props.meal.id, data);
    } else {
      await store.createMeal(data);
    }

    emit("saved");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <div class="space-y-3">
      <div class="space-y-1.5">
        <Label for="meal-name">Name</Label>
        <Input
          id="meal-name"
          v-model="name"
          placeholder="e.g. Chicken & Rice"
        />
      </div>

      <div class="space-y-1.5">
        <Label for="meal-calories">Calories</Label>
        <Input
          id="meal-calories"
          v-model="calories"
          type="number"
          placeholder="0"
          min="0"
        />
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div class="space-y-1.5">
          <Label for="meal-protein">Protein (g)</Label>
          <Input
            id="meal-protein"
            v-model="protein"
            type="number"
            placeholder="0"
            min="0"
          />
        </div>
        <div class="space-y-1.5">
          <Label for="meal-carbs">Carbs (g)</Label>
          <Input
            id="meal-carbs"
            v-model="carbs"
            type="number"
            placeholder="0"
            min="0"
          />
        </div>
        <div class="space-y-1.5">
          <Label for="meal-fat">Fat (g)</Label>
          <Input
            id="meal-fat"
            v-model="fat"
            type="number"
            placeholder="0"
            min="0"
          />
        </div>
      </div>
    </div>

    <DialogFooter>
      <Button type="submit" :disabled="saving || !name.trim()">
        {{ saving ? "Saving..." : meal ? "Update" : "Save" }}
      </Button>
    </DialogFooter>
  </form>
</template>
