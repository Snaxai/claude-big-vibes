<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useProgramStore } from "@/stores/programs";
import type { Program } from "shared";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-vue-next";
import TemplateDay from "./TemplateDay.vue";

const props = defineProps<{ programId: number }>();
const emit = defineEmits<{ closed: [] }>();

const store = useProgramStore();
const program = ref<Program | null>(null);
const newDayName = ref("");

onMounted(async () => {
  program.value = await store.fetchProgram(props.programId);
});

async function addDay() {
  if (!newDayName.value || !program.value) return;
  const order = (program.value.days?.length || 0) + 1;
  await store.addDay(props.programId, { name: newDayName.value, dayOrder: order });
  program.value = await store.fetchProgram(props.programId);
  newDayName.value = "";
}

async function refreshProgram() {
  program.value = await store.fetchProgram(props.programId);
}

async function saveName() {
  if (!program.value) return;
  await store.updateProgram(props.programId, {
    name: program.value.name,
    description: program.value.description ?? undefined,
  });
}
</script>

<template>
  <div v-if="program" class="space-y-4">
    <DialogHeader>
      <DialogTitle>Edit Program</DialogTitle>
    </DialogHeader>

    <div class="space-y-3">
      <div>
        <Label>Program Name</Label>
        <Input v-model="program.name" @blur="saveName" />
      </div>
      <div>
        <Label>Description</Label>
        <Input v-model="program.description" placeholder="Optional" @blur="saveName" />
      </div>
    </div>

    <!-- Days -->
    <div class="space-y-3">
      <p class="text-sm font-medium">Days</p>
      <TemplateDay
        v-for="day in program.days"
        :key="day.id"
        :day="day"
        :program-id="programId"
        @updated="refreshProgram"
      />

      <!-- Add day form -->
      <div class="flex gap-2">
        <Input v-model="newDayName" placeholder="Day name (e.g. Push Day)" class="flex-1" @keyup.enter="addDay" />
        <Button size="sm" @click="addDay">
          <Plus class="h-4 w-4 mr-1" />
          Add Day
        </Button>
      </div>
    </div>

    <div class="flex justify-end">
      <Button variant="outline" @click="emit('closed')">Done</Button>
    </div>
  </div>
  <div v-else class="py-8 text-center text-muted-foreground">Loading...</div>
</template>
