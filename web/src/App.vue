<script setup lang="ts">
import { ref, provide, onMounted } from "vue";
import AppShell from "@/components/layout/AppShell.vue";
import Dashboard from "@/pages/Dashboard.vue";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard.vue";
import { useSettingsStore } from "@/stores/settings";

const settings = useSettingsStore();
const settingsLoaded = ref(false);
const showOnboarding = ref(false);
const onboardingClosable = ref(false);

onMounted(async () => {
  await settings.fetchSettings();
  settingsLoaded.value = true;
  if (!settings.onboardingCompleted) {
    showOnboarding.value = true;
  }
});

function startOnboarding() {
  onboardingClosable.value = true;
  showOnboarding.value = true;
}

async function onOnboardingComplete(saved: boolean) {
  showOnboarding.value = false;
  if (saved) {
    await settings.fetchSettings();
  }
}

provide("startOnboarding", startOnboarding);
</script>

<template>
  <template v-if="settingsLoaded">
    <OnboardingWizard v-if="showOnboarding" :closable="onboardingClosable" @complete="onOnboardingComplete" />
    <AppShell v-else>
      <Dashboard />
    </AppShell>
  </template>
</template>
