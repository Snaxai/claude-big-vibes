<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { Meal } from "shared";
import { useMealStore } from "@/stores/meals";
import { useSettingsStore } from "@/stores/settings";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DatePicker from "@/components/shared/DatePicker.vue";
import LogMealForm from "@/components/meals/LogMealForm.vue";
import MacroRing from "@/components/meals/MacroRing.vue";
import { UtensilsCrossed, Pencil, Trash2, Plus } from "lucide-vue-next";

const store = useMealStore();
const settingsStore = useSettingsStore();

const dialogOpen = ref(false);
const editingMeal = ref<Meal | undefined>(undefined);

const calorieTarget = computed(() => settingsStore.calorieTarget);
const totalCalories = computed(() => store.dailySummary?.totalCalories ?? 0);
const totalProtein = computed(() => store.dailySummary?.totalProtein ?? 0);
const totalCarbs = computed(() => store.dailySummary?.totalCarbs ?? 0);
const totalFat = computed(() => store.dailySummary?.totalFat ?? 0);

const calorieProgress = computed(() =>
  Math.min((totalCalories.value / calorieTarget.value) * 100, 100)
);

const calorieBarColor = computed(() => {
  const pct = calorieProgress.value;
  if (pct < 75) return "bg-green-500";
  if (pct < 95) return "bg-amber-400";
  return "bg-red-500";
});

function openAddDialog() {
  editingMeal.value = undefined;
  dialogOpen.value = true;
}

function openEditDialog(meal: Meal) {
  editingMeal.value = meal;
  dialogOpen.value = true;
}

function onSaved() {
  dialogOpen.value = false;
  editingMeal.value = undefined;
}

function onDateChange(date: string) {
  store.setDate(date);
}

onMounted(() => {
  store.fetchMeals();
  store.fetchSummary();
});
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="flex items-center gap-2">
        <UtensilsCrossed class="h-5 w-5 text-primary" />
        Meals
      </CardTitle>
      <div class="flex items-center gap-2">
        <DatePicker
          :model-value="store.selectedDate"
          @update:model-value="onDateChange"
        />
        <Button size="sm" @click="openAddDialog">
          <Plus class="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Calorie progress bar -->
      <div class="space-y-1">
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>{{ totalCalories }} kcal</span>
          <span>{{ calorieTarget }} kcal target</span>
        </div>
        <div class="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            :class="['h-full rounded-full transition-all duration-500', calorieBarColor]"
            :style="{ width: `${calorieProgress}%` }"
          />
        </div>
      </div>

      <!-- Macro Ring -->
      <div class="flex justify-center">
        <MacroRing
          :protein="totalProtein"
          :carbs="totalCarbs"
          :fat="totalFat"
          :calories="totalCalories"
        />
      </div>

      <!-- Meals list -->
      <div v-if="store.meals.length > 0" class="space-y-2">
        <p class="text-sm font-medium">Today's Meals</p>
        <div
          v-for="meal in store.meals"
          :key="meal.id"
          class="flex items-center justify-between rounded-md border p-2 text-sm"
        >
          <div class="min-w-0 flex-1">
            <p class="font-medium truncate">{{ meal.name }}</p>
            <div class="flex gap-2 text-xs text-muted-foreground">
              <span>{{ meal.calories }} kcal</span>
              <span class="text-blue-500">P:{{ meal.protein }}g</span>
              <span class="text-amber-400">C:{{ meal.carbs }}g</span>
              <span class="text-red-400">F:{{ meal.fat }}g</span>
            </div>
          </div>
          <div class="flex gap-1">
            <Button variant="ghost" size="icon" @click="openEditDialog(meal)">
              <Pencil class="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" @click="store.deleteMeal(meal.id)">
              <Trash2 class="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      <p v-else-if="!store.loading" class="text-sm text-muted-foreground text-center py-4">
        No meals logged yet. Add your first meal!
      </p>

      <!-- Add/Edit Dialog -->
      <Dialog v-model:open="dialogOpen">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ editingMeal ? 'Edit Meal' : 'Add Meal' }}</DialogTitle>
          </DialogHeader>
          <LogMealForm :meal="editingMeal" @saved="onSaved" />
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
</template>
