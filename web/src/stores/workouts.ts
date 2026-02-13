import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { WorkoutSession, Exercise } from "shared";
import { useApi } from "@/composables/useApi";

export const useWorkoutStore = defineStore("workouts", () => {
  const api = useApi();
  const sessions = ref<WorkoutSession[]>([]);
  const activeSession = ref<(WorkoutSession & { sets: any[] }) | null>(null);
  const exercises = ref<Exercise[]>([]);
  const loading = ref(false);

  async function fetchExercises() {
    exercises.value = await api.get("/exercises");
  }

  async function createExercise(data: { name: string; muscleGroup: string; equipment?: string }) {
    const ex = await api.post("/exercises", data);
    exercises.value.push(ex as Exercise);
    return ex;
  }

  async function deleteExercise(id: number) {
    await api.del(`/exercises/${id}`);
    exercises.value = exercises.value.filter(e => e.id !== id);
  }

  async function fetchSessions() {
    loading.value = true;
    try {
      sessions.value = await api.get("/workouts");
    } finally {
      loading.value = false;
    }
  }

  async function fetchActiveSession() {
    try {
      activeSession.value = await api.get("/workouts/active");
    } catch { activeSession.value = null; }
  }

  async function startSession(name: string, programDayId?: number) {
    const session = await api.post("/workouts", { name, programDayId });
    await fetchSessions();
    await fetchActiveSession();
    return session;
  }

  async function finishSession(id: number) {
    await api.put(`/workouts/${id}`, { finishedAt: new Date().toISOString() });
    await fetchSessions();
    activeSession.value = null;
  }

  async function deleteSession(id: number) {
    await api.del(`/workouts/${id}`);
    sessions.value = sessions.value.filter(s => s.id !== id);
    if (activeSession.value?.id === id) activeSession.value = null;
  }

  async function logSet(sessionId: number, data: { exerciseId: number; reps: number; weight: number; rpe?: number }) {
    const result = await api.post(`/workouts/${sessionId}/sets`, data);
    await fetchActiveSession();
    return result;
  }

  async function deleteSet(sessionId: number, setId: number) {
    await api.del(`/workouts/${sessionId}/sets/${setId}`);
    await fetchActiveSession();
  }

  const recentSessions = computed(() => sessions.value.slice(0, 5));

  return {
    sessions, activeSession, exercises, loading,
    fetchExercises, createExercise, deleteExercise,
    fetchSessions, fetchActiveSession, startSession, finishSession, deleteSession,
    logSet, deleteSet, recentSessions
  };
});
