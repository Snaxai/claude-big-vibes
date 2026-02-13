<script setup lang="ts">
import { ref } from "vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/shared/DatePicker.vue";
import { useBodyLogStore } from "@/stores/bodylog";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  "update:open": [value: boolean];
  saved: [];
}>();

const store = useBodyLogStore();

const today = new Date().toISOString().split("T")[0];
const date = ref(today);
const weight = ref<string>("");
const bodyFat = ref<string>("");
const notes = ref<string>("");
const saving = ref(false);

async function handleSave() {
  saving.value = true;
  try {
    await store.createLog({
      date: date.value,
      weight: weight.value ? parseFloat(weight.value) : undefined,
      bodyFat: bodyFat.value ? parseFloat(bodyFat.value) : undefined,
      notes: notes.value || undefined,
    });
    // Reset form
    date.value = today;
    weight.value = "";
    bodyFat.value = "";
    notes.value = "";
    emit("saved");
    emit("update:open", false);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Log Body Data</DialogTitle>
      </DialogHeader>

      <form class="grid gap-4 py-2" @submit.prevent="handleSave">
        <div class="grid gap-2">
          <Label for="log-date">Date</Label>
          <DatePicker v-model="date" />
        </div>

        <div class="grid gap-2">
          <Label for="log-weight">Weight (kg)</Label>
          <Input
            id="log-weight"
            v-model="weight"
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 75.5"
          />
        </div>

        <div class="grid gap-2">
          <Label for="log-bodyfat">Body Fat %</Label>
          <Input
            id="log-bodyfat"
            v-model="bodyFat"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="e.g. 15.0"
          />
        </div>

        <div class="grid gap-2">
          <Label for="log-notes">Notes</Label>
          <textarea
            id="log-notes"
            v-model="notes"
            rows="3"
            placeholder="Optional notes..."
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('update:open', false)">
            Cancel
          </Button>
          <Button type="submit" :disabled="saving">
            {{ saving ? "Saving..." : "Save" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
