<script setup lang="ts">
import { Trophy } from "lucide-vue-next";
import { Badge } from "@/components/ui/badge";
</script>

<template>
  <Badge class="border-amber-500/50 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 gap-1">
    <Trophy class="h-3 w-3" />
    PR
  </Badge>
</template>
