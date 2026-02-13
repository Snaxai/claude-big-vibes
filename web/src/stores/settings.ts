import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Setting } from "shared";
import { useApi } from "@/composables/useApi";

export const useSettingsStore = defineStore("settings", () => {
  const api = useApi();
  const settings = ref<Setting[]>([]);
  const loading = ref(false);

  async function fetchSettings() {
    loading.value = true;
    try {
      settings.value = await api.get("/settings");
    } finally { loading.value = false; }
  }

  async function updateSetting(key: string, value: string) {
    await api.put(`/settings/${key}`, { value });
    await fetchSettings();
  }

  function getSetting(key: string, defaultValue: string = ""): string {
    return settings.value.find(s => s.key === key)?.value ?? defaultValue;
  }

  const calorieTarget = computed(() => Number(getSetting("calorie_target", "2000")));
  const proteinTarget = computed(() => Number(getSetting("protein_target", "150")));
  const carbsTarget = computed(() => Number(getSetting("carbs_target", "250")));
  const fatTarget = computed(() => Number(getSetting("fat_target", "65")));
  const unitSystem = computed(() => getSetting("unit_system", "metric"));
  const onboardingCompleted = computed(() => getSetting("onboarding_completed") === "true");
  const goalType = computed(() => getSetting("goal_type"));
  const currentWeight = computed(() => getSetting("current_weight"));
  const targetWeight = computed(() => getSetting("target_weight"));
  const trainingFrequency = computed(() => getSetting("training_frequency"));
  const focusAreas = computed(() => getSetting("focus_areas"));
  const experienceLevel = computed(() => getSetting("experience_level"));

  return { settings, loading, fetchSettings, updateSetting, getSetting, calorieTarget, proteinTarget, carbsTarget, fatTarget, unitSystem, onboardingCompleted, goalType, currentWeight, targetWeight, trainingFrequency, focusAreas, experienceLevel };
});
