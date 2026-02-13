<script setup lang="ts">
import { Input } from "@/components/ui/input";

defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
}
</script>

<template>
  <Input
    type="date"
    :value="modelValue"
    @input="onInput"
    class="w-auto"
  />
</template>
