import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { BodyLog } from "shared";
import { useApi } from "@/composables/useApi";

export const useBodyLogStore = defineStore("bodylog", () => {
  const api = useApi();
  const logs = ref<BodyLog[]>([]);
  const latestLog = ref<BodyLog | null>(null);
  const loading = ref(false);

  async function fetchLogs() {
    loading.value = true;
    try {
      logs.value = await api.get("/bodylog");
      latestLog.value = logs.value[0] || null;
    } finally {
      loading.value = false;
    }
  }

  async function createLog(data: {
    date: string;
    weight?: number;
    bodyFat?: number;
    notes?: string;
    measurements?: { area: string; value: number }[];
  }) {
    await api.post("/bodylog", data);
    await fetchLogs();
  }

  async function deleteLog(id: number) {
    await api.del(`/bodylog/${id}`);
    await fetchLogs();
  }

  const weightHistory = computed(() =>
    logs.value
      .filter((l) => l.weight != null)
      .map((l) => ({ date: l.date, weight: l.weight! }))
      .reverse()
  );

  return { logs, latestLog, loading, fetchLogs, createLog, deleteLog, weightHistory };
});
