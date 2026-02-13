import { defineStore } from "pinia";
import { ref } from "vue";
import type { Program } from "shared";
import { useApi } from "@/composables/useApi";

export const useProgramStore = defineStore("programs", () => {
  const api = useApi();
  const programs = ref<Program[]>([]);
  const activeProgram = ref<Program | null>(null);
  const loading = ref(false);

  async function fetchPrograms() {
    loading.value = true;
    try {
      programs.value = await api.get("/programs");
      activeProgram.value = programs.value.find(p => p.isActive) || null;
    } finally { loading.value = false; }
  }

  async function fetchProgram(id: number): Promise<Program> {
    return await api.get(`/programs/${id}`);
  }

  async function createProgram(data: { name: string; description?: string }) {
    await api.post("/programs", data);
    await fetchPrograms();
  }

  async function updateProgram(id: number, data: { name?: string; description?: string }) {
    await api.put(`/programs/${id}`, data);
    await fetchPrograms();
  }

  async function deleteProgram(id: number) {
    await api.del(`/programs/${id}`);
    await fetchPrograms();
  }

  async function activateProgram(id: number) {
    await api.post(`/programs/${id}/activate`, {});
    await fetchPrograms();
  }

  async function addDay(programId: number, data: { name: string; dayOrder: number }) {
    await api.post(`/programs/${programId}/days`, data);
  }

  async function updateDay(programId: number, dayId: number, data: { name?: string; dayOrder?: number }) {
    await api.put(`/programs/${programId}/days/${dayId}`, data);
  }

  async function deleteDay(programId: number, dayId: number) {
    await api.del(`/programs/${programId}/days/${dayId}`);
  }

  async function addExerciseToDay(programId: number, dayId: number, data: { exerciseId: number; targetSets: number; targetReps: number; targetWeight?: number }) {
    await api.post(`/programs/${programId}/days/${dayId}/exercises`, data);
  }

  async function removeExerciseFromDay(programId: number, dayId: number, exId: number) {
    await api.del(`/programs/${programId}/days/${dayId}/exercises/${exId}`);
  }

  async function startSessionFromDay(programId: number, dayId: number) {
    return await api.post(`/programs/${programId}/days/${dayId}/start-session`, {});
  }

  return {
    programs, activeProgram, loading,
    fetchPrograms, fetchProgram, createProgram, updateProgram, deleteProgram,
    activateProgram, addDay, updateDay, deleteDay,
    addExerciseToDay, removeExerciseFromDay, startSessionFromDay
  };
});
