<script setup lang="ts">
import { Dumbbell } from "lucide-vue-next";
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container mx-auto flex h-14 items-center px-4">
      <div class="flex items-center gap-2">
        <Dumbbell class="h-6 w-6 text-primary" />
        <span class="text-xl font-bold text-primary">Big Vibes</span>
      </div>
    </div>
  </header>
</template>
