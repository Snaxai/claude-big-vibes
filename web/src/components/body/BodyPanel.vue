<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useBodyLogStore } from "@/stores/bodylog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, Trash2, Plus } from "lucide-vue-next";
import WeightChart from "./WeightChart.vue";
import LogWeightForm from "./LogWeightForm.vue";

const store = useBodyLogStore();
const showForm = ref(false);

onMounted(() => {
  store.fetchLogs();
});

function onSaved() {
  showForm.value = false;
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="flex items-center gap-2">
        <Scale class="h-5 w-5 text-primary" />
        Body
      </CardTitle>
      <Button size="sm" @click="showForm = !showForm">
        <Plus class="h-4 w-4 mr-1" />
        Log Weight
      </Button>
    </CardHeader>
    <CardContent class="space-y-4">
      <LogWeightForm :open="showForm" @update:open="showForm = $event" @saved="onSaved" />

      <!-- Latest stats -->
      <div v-if="store.latestLog" class="grid grid-cols-2 gap-3">
        <div class="rounded-lg bg-muted p-3">
          <p class="text-xs text-muted-foreground">Weight</p>
          <p class="text-2xl font-bold">
            {{ store.latestLog.weight ?? "—" }}
            <span class="text-sm font-normal text-muted-foreground">kg</span>
          </p>
        </div>
        <div class="rounded-lg bg-muted p-3">
          <p class="text-xs text-muted-foreground">Body Fat</p>
          <p class="text-2xl font-bold">
            {{ store.latestLog.bodyFat ?? "—" }}
            <span class="text-sm font-normal text-muted-foreground">%</span>
          </p>
        </div>
      </div>

      <!-- Weight chart -->
      <div v-if="store.weightHistory.length > 1">
        <p class="text-sm font-medium mb-2">Weight Trend</p>
        <WeightChart :data="store.weightHistory" />
      </div>

      <!-- Recent logs -->
      <div v-if="store.logs.length > 0">
        <p class="text-sm font-medium mb-2">Recent Entries</p>
        <div class="space-y-2">
          <div
            v-for="log in store.logs.slice(0, 5)"
            :key="log.id"
            class="flex items-center justify-between rounded-md border p-2 text-sm"
          >
            <div>
              <span class="font-medium">{{ log.date }}</span>
              <span v-if="log.weight" class="ml-2 text-muted-foreground">
                {{ log.weight }} kg
              </span>
              <span v-if="log.bodyFat" class="ml-2 text-muted-foreground">
                {{ log.bodyFat }}% BF
              </span>
              <span v-if="log.notes" class="ml-2 text-muted-foreground italic">
                {{ log.notes }}
              </span>
            </div>
            <Button variant="ghost" size="icon" @click="store.deleteLog(log.id)">
              <Trash2 class="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      <p v-else-if="!store.loading" class="text-sm text-muted-foreground text-center py-4">
        No body logs yet. Start tracking!
      </p>
    </CardContent>
  </Card>
</template>
