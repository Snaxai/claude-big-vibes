<script setup lang="ts">
defineProps<{
  sender: "bot" | "user";
}>();
</script>

<template>
  <div class="flex" :class="sender === 'user' ? 'justify-end' : 'justify-start'">
    <div
      class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
      :class="
        sender === 'bot'
          ? 'bg-muted text-foreground rounded-bl-sm'
          : 'bg-primary text-primary-foreground rounded-br-sm'
      "
    >
      <slot />
    </div>
  </div>
</template>
