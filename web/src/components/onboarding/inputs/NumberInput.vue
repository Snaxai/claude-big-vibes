<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  suffix?: string;
  defaultValue?: number;
  placeholder?: string;
}>();

const emit = defineEmits<{
  submit: [value: number];
}>();

const value = ref(props.defaultValue ?? undefined);

function handleSubmit() {
  if (value.value != null && value.value > 0) {
    emit("submit", value.value);
  }
}
</script>

<template>
  <form class="flex items-center gap-2" @submit.prevent="handleSubmit">
    <div class="relative">
      <input
        v-model.number="value"
        type="number"
        :placeholder="placeholder ?? 'Enter a number'"
        class="w-32 rounded-lg border border-input bg-background px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        min="0"
        step="any"
      />
      <span
        v-if="suffix"
        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
      >
        {{ suffix }}
      </span>
    </div>
    <button
      type="submit"
      class="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
      :disabled="!value || value <= 0"
    >
      Next
    </button>
  </form>
</template>
