<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}>();

const radius = 60;
const strokeWidth = 14;
const circumference = 2 * Math.PI * radius;

const total = computed(() => props.protein + props.carbs + props.fat);

const segments = computed(() => {
  if (total.value === 0) {
    return [
      { color: "stroke-muted", offset: 0, length: circumference },
    ];
  }

  const proteinFrac = props.protein / total.value;
  const carbsFrac = props.carbs / total.value;
  const fatFrac = props.fat / total.value;

  const proteinLen = proteinFrac * circumference;
  const carbsLen = carbsFrac * circumference;
  const fatLen = fatFrac * circumference;

  return [
    { color: "stroke-blue-500", offset: 0, length: proteinLen, label: "Protein" },
    { color: "stroke-amber-400", offset: proteinLen, length: carbsLen, label: "Carbs" },
    { color: "stroke-red-400", offset: proteinLen + carbsLen, length: fatLen, label: "Fat" },
  ];
});
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      class="transform -rotate-90"
    >
      <!-- Background ring -->
      <circle
        cx="80"
        cy="80"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        class="stroke-muted"
      />
      <!-- Macro segments -->
      <circle
        v-for="(seg, i) in segments"
        :key="i"
        cx="80"
        cy="80"
        :r="radius"
        fill="none"
        :stroke-width="strokeWidth"
        :class="seg.color"
        :stroke-dasharray="`${seg.length} ${circumference - seg.length}`"
        :stroke-dashoffset="-seg.offset"
        stroke-linecap="butt"
      />
      <!-- Center text -->
      <text
        x="80"
        y="76"
        text-anchor="middle"
        dominant-baseline="middle"
        class="fill-foreground text-2xl font-bold"
        transform="rotate(90, 80, 80)"
      >
        {{ calories }}
      </text>
      <text
        x="80"
        y="96"
        text-anchor="middle"
        dominant-baseline="middle"
        class="fill-muted-foreground text-xs"
        transform="rotate(90, 80, 80)"
      >
        kcal
      </text>
    </svg>

    <!-- Legend -->
    <div class="flex gap-4 text-sm">
      <div class="flex items-center gap-1.5">
        <span class="inline-block h-3 w-3 rounded-full bg-blue-500" />
        <span class="text-muted-foreground">P: {{ protein }}g</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="inline-block h-3 w-3 rounded-full bg-amber-400" />
        <span class="text-muted-foreground">C: {{ carbs }}g</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="inline-block h-3 w-3 rounded-full bg-red-400" />
        <span class="text-muted-foreground">F: {{ fat }}g</span>
      </div>
    </div>
  </div>
</template>
