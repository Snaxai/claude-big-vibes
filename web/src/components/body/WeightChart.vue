<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  data: { date: string; weight: number }[];
}>();

const svgWidth = 600;
const svgHeight = 200;
const padding = { top: 20, right: 20, bottom: 30, left: 50 };

const chartWidth = svgWidth - padding.left - padding.right;
const chartHeight = svgHeight - padding.top - padding.bottom;

const hoveredIndex = ref<number | null>(null);

const yDomain = computed(() => {
  if (props.data.length === 0) return { min: 0, max: 100 };
  const weights = props.data.map((d) => d.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const rangePadding = Math.max((max - min) * 0.1, 1);
  return { min: min - rangePadding, max: max + rangePadding };
});

const yTicks = computed(() => {
  const { min, max } = yDomain.value;
  const count = 5;
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => +(min + step * i).toFixed(1));
});

const xLabelIndices = computed(() => {
  const len = props.data.length;
  if (len <= 6) return props.data.map((_, i) => i);
  const step = Math.ceil(len / 6);
  const indices: number[] = [];
  for (let i = 0; i < len; i += step) indices.push(i);
  if (indices[indices.length - 1] !== len - 1) indices.push(len - 1);
  return indices;
});

function scaleX(index: number): number {
  if (props.data.length <= 1) return padding.left + chartWidth / 2;
  return padding.left + (index / (props.data.length - 1)) * chartWidth;
}

function scaleY(weight: number): number {
  const { min, max } = yDomain.value;
  if (max === min) return padding.top + chartHeight / 2;
  return padding.top + chartHeight - ((weight - min) / (max - min)) * chartHeight;
}

const linePath = computed(() => {
  if (props.data.length === 0) return "";
  return props.data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(d.weight)}`)
    .join(" ");
});

const points = computed(() =>
  props.data.map((d, i) => ({
    x: scaleX(i),
    y: scaleY(d.weight),
    date: d.date,
    weight: d.weight,
    index: i,
  }))
);

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
</script>

<template>
  <div class="w-full overflow-hidden">
    <svg
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      class="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- Grid lines -->
      <line
        v-for="tick in yTicks"
        :key="tick"
        :x1="padding.left"
        :x2="svgWidth - padding.right"
        :y1="scaleY(tick)"
        :y2="scaleY(tick)"
        class="stroke-muted-foreground/20"
        stroke-width="1"
      />

      <!-- Y-axis labels -->
      <text
        v-for="tick in yTicks"
        :key="'label-' + tick"
        :x="padding.left - 8"
        :y="scaleY(tick) + 4"
        text-anchor="end"
        class="fill-muted-foreground text-[10px]"
      >
        {{ tick }}
      </text>

      <!-- X-axis labels -->
      <text
        v-for="idx in xLabelIndices"
        :key="'x-' + idx"
        :x="scaleX(idx)"
        :y="svgHeight - 6"
        text-anchor="middle"
        class="fill-muted-foreground text-[10px]"
      >
        {{ formatDate(data[idx].date) }}
      </text>

      <!-- Line -->
      <path
        v-if="data.length > 1"
        :d="linePath"
        fill="none"
        class="stroke-primary"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <!-- Data points -->
      <circle
        v-for="pt in points"
        :key="pt.index"
        :cx="pt.x"
        :cy="pt.y"
        :r="hoveredIndex === pt.index ? 5 : 3"
        class="fill-primary stroke-background"
        stroke-width="2"
        @mouseenter="hoveredIndex = pt.index"
        @mouseleave="hoveredIndex = null"
      />

      <!-- Tooltip -->
      <g v-if="hoveredIndex !== null && points[hoveredIndex]">
        <rect
          :x="points[hoveredIndex].x - 40"
          :y="points[hoveredIndex].y - 32"
          width="80"
          height="22"
          rx="4"
          class="fill-popover stroke-border"
          stroke-width="1"
        />
        <text
          :x="points[hoveredIndex].x"
          :y="points[hoveredIndex].y - 17"
          text-anchor="middle"
          class="fill-popover-foreground text-[11px] font-medium"
        >
          {{ points[hoveredIndex].weight }} kg
        </text>
      </g>
    </svg>
  </div>
</template>
