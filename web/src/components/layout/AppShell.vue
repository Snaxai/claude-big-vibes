<script setup lang="ts">
import NavBar from "@/components/layout/NavBar.vue";
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <NavBar />
    <main class="flex-1 container mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>
