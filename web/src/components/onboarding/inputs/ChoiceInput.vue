<script setup lang="ts">
defineProps<{
  options: { label: string; value: string }[];
}>();

const emit = defineEmits<{
  select: [value: string];
}>();
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="option in options"
      :key="option.value"
      class="rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      @click="emit('select', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
