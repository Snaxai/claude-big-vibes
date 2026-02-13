import { defineStore } from "pinia";
import { ref } from "vue";
import type { Meal, DailySummary } from "shared";
import { useApi } from "@/composables/useApi";
import { format } from "date-fns";

export const useMealStore = defineStore("meals", () => {
  const api = useApi();
  const meals = ref<Meal[]>([]);
  const dailySummary = ref<DailySummary | null>(null);
  const selectedDate = ref(format(new Date(), "yyyy-MM-dd"));
  const loading = ref(false);

  async function fetchMeals(date?: string) {
    loading.value = true;
    try {
      const d = date || selectedDate.value;
      meals.value = await api.get(`/meals?date=${d}`);
    } finally {
      loading.value = false;
    }
  }

  async function fetchSummary(date?: string) {
    const d = date || selectedDate.value;
    dailySummary.value = await api.get(`/meals/summary?date=${d}`);
  }

  async function createMeal(data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) {
    await api.post("/meals", { ...data, date: selectedDate.value });
    await fetchMeals();
    await fetchSummary();
  }

  async function updateMeal(id: number, data: Partial<Meal>) {
    await api.put(`/meals/${id}`, data);
    await fetchMeals();
    await fetchSummary();
  }

  async function deleteMeal(id: number) {
    await api.del(`/meals/${id}`);
    await fetchMeals();
    await fetchSummary();
  }

  async function setDate(date: string) {
    selectedDate.value = date;
    await fetchMeals(date);
    await fetchSummary(date);
  }

  return {
    meals,
    dailySummary,
    selectedDate,
    loading,
    fetchMeals,
    fetchSummary,
    createMeal,
    updateMeal,
    deleteMeal,
    setDate,
  };
});
