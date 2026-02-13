<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
import { Dumbbell, X } from "lucide-vue-next";
import { useSettingsStore } from "@/stores/settings";
import ChatBubble from "./ChatBubble.vue";
import TypingIndicator from "./TypingIndicator.vue";
import ChoiceInput from "./inputs/ChoiceInput.vue";
import MultiChoiceInput from "./inputs/MultiChoiceInput.vue";
import NumberInput from "./inputs/NumberInput.vue";
import MacroInput from "./inputs/MacroInput.vue";

const props = defineProps<{ closable?: boolean }>();
const emit = defineEmits<{ complete: [saved: boolean] }>();
const settings = useSettingsStore();

interface Message {
  id: number;
  sender: "bot" | "user";
  text: string;
}

const messages = ref<Message[]>([]);
const typing = ref(false);
const currentStep = ref(0);
const chatContainer = ref<HTMLElement>();
const showCloseConfirm = ref(false);
let messageId = 0;

// Buffer all changes locally — only persist on complete
const pendingSettings = ref<Record<string, string>>({});
const hasPendingChanges = computed(() => Object.keys(pendingSettings.value).length > 0);

function setSetting(key: string, value: string) {
  pendingSettings.value[key] = value;
}

async function persistAll() {
  for (const [key, value] of Object.entries(pendingSettings.value)) {
    await settings.updateSetting(key, value);
  }
}

function handleClose() {
  if (hasPendingChanges.value && currentStep.value < 9) {
    showCloseConfirm.value = true;
  } else {
    emit("complete", false);
  }
}

async function closeAndSave() {
  await persistAll();
  showCloseConfirm.value = false;
  emit("complete", true);
}

function closeAndDiscard() {
  showCloseConfirm.value = false;
  emit("complete", false);
}

const unitSystem = ref(settings.getSetting("unit_system", "metric"));
const goalType = ref(settings.getSetting("goal_type", ""));

const weightSuffix = computed(() => (unitSystem.value === "metric" ? "kg" : "lbs"));

interface Step {
  botMessage: () => string;
  inputType: "choice" | "number" | "multichoice" | "macro" | "done";
}

const steps: Step[] = [
  {
    botMessage: () => "Hey! Welcome to Big Vibes. Let's get you set up. First — do you prefer metric or imperial units?",
    inputType: "choice",
  },
  {
    botMessage: () => `What's your current weight in ${weightSuffix.value}?`,
    inputType: "number",
  },
  {
    botMessage: () => "What's your goal right now?",
    inputType: "choice",
  },
  {
    botMessage: () => {
      if (goalType.value === "cut") return `Nice — what's your target weight in ${weightSuffix.value}? This should be lower than your current weight.`;
      if (goalType.value === "bulk") return `Let's grow! What's your target weight in ${weightSuffix.value}?`;
      return `Even when maintaining, it helps to have a target. What weight in ${weightSuffix.value} do you want to stay around?`;
    },
    inputType: "number",
  },
  {
    botMessage: () => {
      const defaults: Record<string, string> = { cut: "1800", maintain: "2200", bulk: "2800" };
      const d = defaults[goalType.value] ?? "2200";
      return `What's your daily calorie target? (A common starting point for "${goalType.value || "maintain"}" is ~${d} kcal)`;
    },
    inputType: "number",
  },
  {
    botMessage: () => "How would you like to split your macros? Set your daily protein, carbs, and fat targets in grams.",
    inputType: "macro",
  },
  {
    botMessage: () => "How many days per week do you plan to train?",
    inputType: "choice",
  },
  {
    botMessage: () => "Which muscle groups do you want to focus on? Pick as many as you like.",
    inputType: "multichoice",
  },
  {
    botMessage: () => "Last one — what's your training experience level?",
    inputType: "choice",
  },
  {
    botMessage: () => "You're all set! Let's get to work.",
    inputType: "done",
  },
];

function addMessage(sender: "bot" | "user", text: string) {
  messages.value.push({ id: ++messageId, sender, text });
  nextTick(() => {
    chatContainer.value?.scrollTo({ top: chatContainer.value.scrollHeight, behavior: "smooth" });
  });
}

async function showBotMessage() {
  typing.value = true;
  await nextTick();
  chatContainer.value?.scrollTo({ top: chatContainer.value.scrollHeight, behavior: "smooth" });
  await new Promise((r) => setTimeout(r, 600));
  typing.value = false;
  addMessage("bot", steps[currentStep.value].botMessage());
}

// Step handlers
function handleStep0(value: string) {
  unitSystem.value = value;
  addMessage("user", value === "metric" ? "Metric (kg)" : "Imperial (lbs)");
  setSetting("unit_system", value);
  advance();
}

function handleStep1(value: number) {
  addMessage("user", `${value} ${weightSuffix.value}`);
  setSetting("current_weight", String(value));
  advance();
}

function handleStep2(value: string) {
  goalType.value = value;
  addMessage("user", value.charAt(0).toUpperCase() + value.slice(1));
  setSetting("goal_type", value);
  advance();
}

function handleStep3(value: number) {
  addMessage("user", `${value} ${weightSuffix.value}`);
  setSetting("target_weight", String(value));
  advance();
}

function handleStep4(value: number) {
  addMessage("user", `${value} kcal`);
  setSetting("calorie_target", String(value));
  advance();
}

function handleStep5(macros: { protein: number; carbs: number; fat: number }) {
  addMessage("user", `P: ${macros.protein}g / C: ${macros.carbs}g / F: ${macros.fat}g`);
  setSetting("protein_target", String(macros.protein));
  setSetting("carbs_target", String(macros.carbs));
  setSetting("fat_target", String(macros.fat));
  advance();
}

function handleStep6(value: string) {
  addMessage("user", `${value} days/week`);
  setSetting("training_frequency", value);
  advance();
}

function handleStep7(values: string[]) {
  addMessage("user", values.join(", "));
  setSetting("focus_areas", values.join(","));
  advance();
}

function handleStep8(value: string) {
  addMessage("user", value.charAt(0).toUpperCase() + value.slice(1));
  setSetting("experience_level", value);
  advance();
}

async function handleDone() {
  setSetting("onboarding_completed", "true");
  await persistAll();
  emit("complete", true);
}

function advance() {
  currentStep.value++;
  showBotMessage();
}

// Defaults for re-run
const defaultWeight = computed(() => {
  const v = settings.getSetting("current_weight");
  return v ? Number(v) : undefined;
});
const defaultTargetWeight = computed(() => {
  const v = settings.getSetting("target_weight");
  return v ? Number(v) : undefined;
});
const defaultCalories = computed(() => {
  const v = settings.getSetting("calorie_target");
  return v ? Number(v) : undefined;
});
const defaultFocusAreas = computed(() => {
  const v = settings.getSetting("focus_areas");
  return v ? v.split(",") : [];
});

// Start
showBotMessage();
</script>

<template>
  <div class="fixed inset-0 z-50 flex flex-col bg-background">
    <!-- Header -->
    <div class="flex items-center gap-2 border-b px-4 py-3">
      <Dumbbell class="h-5 w-5 text-primary" />
      <span class="font-semibold text-primary">Big Vibes Setup</span>
      <button
        v-if="props.closable"
        class="ml-auto rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        @click="handleClose"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- Chat area -->
    <div ref="chatContainer" class="flex-1 overflow-y-auto px-4 py-6">
      <div class="mx-auto max-w-lg space-y-3">
        <TransitionGroup name="chat">
          <ChatBubble
            v-for="msg in messages"
            :key="msg.id"
            :sender="msg.sender"
          >
            {{ msg.text }}
          </ChatBubble>
        </TransitionGroup>
        <TypingIndicator v-if="typing" />
      </div>
    </div>

    <!-- Input area -->
    <div class="border-t px-4 py-4" v-if="!typing">
      <div class="mx-auto max-w-lg">
        <!-- Step 0: Unit system -->
        <ChoiceInput
          v-if="currentStep === 0"
          :options="[
            { label: 'Metric (kg)', value: 'metric' },
            { label: 'Imperial (lbs)', value: 'imperial' },
          ]"
          @select="handleStep0"
        />

        <!-- Step 1: Current weight -->
        <NumberInput
          v-if="currentStep === 1"
          :suffix="weightSuffix"
          :default-value="defaultWeight"
          placeholder="e.g. 80"
          @submit="handleStep1"
        />

        <!-- Step 2: Goal type -->
        <ChoiceInput
          v-if="currentStep === 2"
          :options="[
            { label: 'Cut', value: 'cut' },
            { label: 'Maintain', value: 'maintain' },
            { label: 'Bulk', value: 'bulk' },
          ]"
          @select="handleStep2"
        />

        <!-- Step 3: Target weight -->
        <NumberInput
          v-if="currentStep === 3"
          :suffix="weightSuffix"
          :default-value="defaultTargetWeight"
          placeholder="e.g. 75"
          @submit="handleStep3"
        />

        <!-- Step 4: Calorie target -->
        <NumberInput
          v-if="currentStep === 4"
          suffix="kcal"
          :default-value="defaultCalories"
          placeholder="e.g. 2200"
          @submit="handleStep4"
        />

        <!-- Step 5: Macros -->
        <MacroInput
          v-if="currentStep === 5"
          :default-protein="settings.proteinTarget"
          :default-carbs="settings.carbsTarget"
          :default-fat="settings.fatTarget"
          @submit="handleStep5"
        />

        <!-- Step 6: Training frequency -->
        <ChoiceInput
          v-if="currentStep === 6"
          :options="[2,3,4,5,6,7].map(n => ({ label: `${n}`, value: `${n}` }))"
          @select="handleStep6"
        />

        <!-- Step 7: Focus areas -->
        <MultiChoiceInput
          v-if="currentStep === 7"
          :options="['Chest','Back','Shoulders','Arms','Legs','Core'].map(g => ({ label: g, value: g }))"
          :defaults="defaultFocusAreas"
          @submit="handleStep7"
        />

        <!-- Step 8: Experience level -->
        <ChoiceInput
          v-if="currentStep === 8"
          :options="[
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate', value: 'intermediate' },
            { label: 'Advanced', value: 'advanced' },
          ]"
          @select="handleStep8"
        />

        <!-- Step 9: Done -->
        <div v-if="currentStep === 9" class="flex justify-center">
          <button
            class="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
            @click="handleDone"
          >
            Let's go!
          </button>
        </div>
      </div>
    </div>
    <!-- Close confirmation overlay -->
    <Transition name="fade">
      <div v-if="showCloseConfirm" class="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div class="mx-4 w-full max-w-sm rounded-xl border bg-background p-6 shadow-lg">
          <p class="text-sm font-medium text-foreground">You have unsaved changes. What would you like to do?</p>
          <div class="mt-4 flex gap-2">
            <button
              class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              @click="closeAndDiscard"
            >
              Discard
            </button>
            <button
              class="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              @click="closeAndSave"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
.chat-enter-active {
  transition: all 0.3s ease-out;
}
.chat-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
