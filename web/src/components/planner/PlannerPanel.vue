<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useProgramStore } from "@/stores/programs";
import { useWorkoutStore } from "@/stores/workouts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { ClipboardList, Plus, Play, Trash2, Star, Edit } from "lucide-vue-next";
import ProgramEditor from "./ProgramEditor.vue";

const programStore = useProgramStore();
const workoutStore = useWorkoutStore();

const showNewProgram = ref(false);
const editingProgramId = ref<number | null>(null);
const newProgram = ref({ name: "", description: "" });

onMounted(() => {
  programStore.fetchPrograms();
  workoutStore.fetchExercises();
});

async function createProgram() {
  if (!newProgram.value.name) return;
  await programStore.createProgram(newProgram.value);
  newProgram.value = { name: "", description: "" };
  showNewProgram.value = false;
}

async function startSession(programId: number, dayId: number) {
  await programStore.startSessionFromDay(programId, dayId);
  await workoutStore.fetchActiveSession();
  await workoutStore.fetchSessions();
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="flex items-center gap-2">
        <ClipboardList class="h-5 w-5 text-primary" />
        Planner
      </CardTitle>
      <Button size="sm" @click="showNewProgram = true">
        <Plus class="h-4 w-4 mr-1" />
        New Program
      </Button>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Active program -->
      <div v-if="programStore.activeProgram" class="space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold flex items-center gap-2">
              {{ programStore.activeProgram.name }}
              <Badge variant="secondary" class="text-xs">Active</Badge>
            </h3>
            <p v-if="programStore.activeProgram.description" class="text-sm text-muted-foreground">
              {{ programStore.activeProgram.description }}
            </p>
          </div>
          <Button variant="ghost" size="icon" @click="editingProgramId = programStore.activeProgram!.id">
            <Edit class="h-4 w-4" />
          </Button>
        </div>

        <div v-if="programStore.activeProgram.days?.length" class="space-y-2">
          <div
            v-for="day in programStore.activeProgram.days"
            :key="day.id"
            class="flex items-center justify-between rounded-md border p-2"
          >
            <div>
              <span class="font-medium text-sm">{{ day.name }}</span>
              <span class="text-xs text-muted-foreground ml-2">
                {{ day.exercises?.length || 0 }} exercises
              </span>
            </div>
            <Button size="sm" variant="outline" @click="startSession(programStore.activeProgram!.id, day.id)">
              <Play class="h-3 w-3 mr-1" />
              Start
            </Button>
          </div>
        </div>
      </div>

      <!-- All programs list -->
      <div v-if="programStore.programs.length > 0">
        <p class="text-sm font-medium mb-2">All Programs</p>
        <div class="space-y-2">
          <div
            v-for="prog in programStore.programs"
            :key="prog.id"
            class="flex items-center justify-between rounded-md border p-2 text-sm"
          >
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ prog.name }}</span>
              <Badge v-if="prog.isActive" variant="secondary" class="text-xs">Active</Badge>
            </div>
            <div class="flex gap-1">
              <Button v-if="!prog.isActive" variant="ghost" size="icon" @click="programStore.activateProgram(prog.id)">
                <Star class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="editingProgramId = prog.id">
                <Edit class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="programStore.deleteProgram(prog.id)">
                <Trash2 class="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <p v-else-if="!programStore.loading" class="text-sm text-muted-foreground text-center py-4">
        No programs yet. Create your first workout program!
      </p>

      <!-- New Program Dialog -->
      <Dialog :open="showNewProgram" @update:open="showNewProgram = $event">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Program</DialogTitle>
          </DialogHeader>
          <div class="space-y-3">
            <div>
              <Label>Name</Label>
              <Input v-model="newProgram.name" placeholder="e.g. Push/Pull/Legs" />
            </div>
            <div>
              <Label>Description</Label>
              <Input v-model="newProgram.description" placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" @click="showNewProgram = false">Cancel</Button>
            <Button @click="createProgram">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Program Editor Dialog -->
      <Dialog :open="editingProgramId !== null" @update:open="val => { if (!val) editingProgramId = null }">
        <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
          <ProgramEditor
            v-if="editingProgramId !== null"
            :program-id="editingProgramId"
            @closed="editingProgramId = null; programStore.fetchPrograms()"
          />
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
</template>
