<script setup lang="ts">
import { inject } from "vue";
import { Dumbbell, Settings } from "lucide-vue-next";

const startOnboarding = inject<() => void>("startOnboarding");
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container mx-auto flex h-14 items-center justify-between px-4">
      <div class="flex items-center gap-2">
        <Dumbbell class="h-6 w-6 text-primary" />
        <span class="text-xl font-bold text-primary">Big Vibes</span>
      </div>
      <button
        class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Setup wizard"
        @click="startOnboarding?.()"
      >
        <Settings class="h-5 w-5" />
      </button>
    </div>
  </header>
</template>
