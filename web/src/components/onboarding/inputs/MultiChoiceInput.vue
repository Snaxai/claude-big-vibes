<script setup lang="ts">
import { ref } from "vue";
import { Check } from "lucide-vue-next";

const props = defineProps<{
  options: { label: string; value: string }[];
  defaults?: string[];
}>();

const emit = defineEmits<{
  submit: [values: string[]];
}>();

const selected = ref<Set<string>>(new Set(props.defaults ?? []));

function toggle(value: string) {
  if (selected.value.has(value)) {
    selected.value.delete(value);
  } else {
    selected.value.add(value);
  }
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in options"
        :key="option.value"
        class="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
        :class="
          selected.has(option.value)
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary'
        "
        @click="toggle(option.value)"
      >
        <Check v-if="selected.has(option.value)" class="h-3.5 w-3.5" />
        {{ option.label }}
      </button>
    </div>
    <button
      class="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
      :disabled="selected.size === 0"
      @click="emit('submit', [...selected])"
    >
      Confirm
    </button>
  </div>
</template>
