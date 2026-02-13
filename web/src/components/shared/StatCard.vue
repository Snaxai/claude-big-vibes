<script setup lang="ts">
import type { Component } from "vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

defineProps<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: Component;
}>();
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium">{{ title }}</CardTitle>
      <component :is="icon" v-if="icon" class="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold">{{ value }}</div>
      <p v-if="subtitle" class="text-xs text-muted-foreground">{{ subtitle }}</p>
    </CardContent>
  </Card>
</template>
