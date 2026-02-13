import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  programs,
  programDays,
  programExercises,
  exercises,
  workoutSessions,
} from "../db/schema";
import { getUserId } from "../middleware/auth";
import { Router, json } from "../router";
import { broadcast } from "../ws";

const createProgramSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

const updateProgramSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

const createDaySchema = z.object({
  name: z.string().min(1, "Name is required"),
  dayOrder: z.number().int().nonnegative("Day order must be non-negative"),
});

const updateDaySchema = z.object({
  name: z.string().min(1).optional(),
  dayOrder: z.number().int().nonnegative().optional(),
});

const createProgramExerciseSchema = z.object({
  exerciseId: z.number().int().positive("Exercise ID is required"),
  targetSets: z.number().int().positive("Target sets must be positive"),
  targetReps: z.number().int().positive("Target reps must be positive"),
  targetWeight: z.number().nonnegative().optional(),
});

export function registerProgramRoutes(router: Router) {
  // GET /api/programs - list all
  router.get("/api/programs", (req) => {
    const userId = getUserId(req);
    const results = db
      .select()
      .from(programs)
      .where(eq(programs.userId, userId))
      .all();
    return json(results);
  });

  // GET /api/programs/:id - get with days and exercises
  router.get("/api/programs/:id", (req, params) => {
    const userId = getUserId(req);
    const id = Number(params.id);

    const program = db
      .select()
      .from(programs)
      .where(and(eq(programs.id, id), eq(programs.userId, userId)))
      .get();

    if (!program) {
      return json({ error: "Program not found" }, 404);
    }

    const days = db
      .select()
      .from(programDays)
      .where(eq(programDays.programId, id))
      .orderBy(programDays.dayOrder)
      .all();

    const daysWithExercises = days.map((day) => {
      const dayExercises = db
        .select({
          id: programExercises.id,
          programDayId: programExercises.programDayId,
          exerciseId: programExercises.exerciseId,
          targetSets: programExercises.targetSets,
          targetReps: programExercises.targetReps,
          targetWeight: programExercises.targetWeight,
          exercise: {
            id: exercises.id,
            userId: exercises.userId,
            name: exercises.name,
            muscleGroup: exercises.muscleGroup,
            equipment: exercises.equipment,
            createdAt: exercises.createdAt,
          },
        })
        .from(programExercises)
        .leftJoin(exercises, eq(programExercises.exerciseId, exercises.id))
        .where(eq(programExercises.programDayId, day.id))
        .all();

      return { ...day, exercises: dayExercises };
    });

    return json({ ...program, days: daysWithExercises });
  });

  // POST /api/programs - create
  router.post("/api/programs", async (req) => {
    try {
      const userId = getUserId(req);
      const body = await req.json();
      const parsed = createProgramSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      const result = db
        .insert(programs)
        .values({
          userId,
          name: parsed.data.name,
          description: parsed.data.description ?? null,
        })
        .returning()
        .get();

      broadcast({ type: "program:updated" });
      return json(result, 201);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // PUT /api/programs/:id - update
  router.put("/api/programs/:id", async (req, params) => {
    try {
      const userId = getUserId(req);
      const id = Number(params.id);
      const body = await req.json();
      const parsed = updateProgramSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      const existing = db
        .select()
        .from(programs)
        .where(and(eq(programs.id, id), eq(programs.userId, userId)))
        .get();

      if (!existing) {
        return json({ error: "Program not found" }, 404);
      }

      const result = db
        .update(programs)
        .set(parsed.data)
        .where(and(eq(programs.id, id), eq(programs.userId, userId)))
        .returning()
        .get();

      broadcast({ type: "program:updated" });
      return json(result);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // DELETE /api/programs/:id - delete with days and exercises
  router.delete("/api/programs/:id", (req, params) => {
    const userId = getUserId(req);
    const id = Number(params.id);

    const existing = db
      .select()
      .from(programs)
      .where(and(eq(programs.id, id), eq(programs.userId, userId)))
      .get();

    if (!existing) {
      return json({ error: "Program not found" }, 404);
    }

    // Get all days for this program
    const days = db
      .select()
      .from(programDays)
      .where(eq(programDays.programId, id))
      .all();

    // Delete exercises for each day
    for (const day of days) {
      db.delete(programExercises)
        .where(eq(programExercises.programDayId, day.id))
        .run();
    }

    // Delete days
    db.delete(programDays).where(eq(programDays.programId, id)).run();

    // Delete program
    db.delete(programs)
      .where(and(eq(programs.id, id), eq(programs.userId, userId)))
      .run();

    broadcast({ type: "program:updated" });
    return json({ success: true });
  });

  // POST /api/programs/:id/days - add day
  router.post("/api/programs/:id/days", async (req, params) => {
    try {
      const userId = getUserId(req);
      const programId = Number(params.id);
      const body = await req.json();
      const parsed = createDaySchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      // Verify program belongs to user
      const program = db
        .select()
        .from(programs)
        .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
        .get();

      if (!program) {
        return json({ error: "Program not found" }, 404);
      }

      const result = db
        .insert(programDays)
        .values({
          programId,
          name: parsed.data.name,
          dayOrder: parsed.data.dayOrder,
        })
        .returning()
        .get();

      broadcast({ type: "program:updated" });
      return json(result, 201);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // PUT /api/programs/:id/days/:dayId - update day
  router.put("/api/programs/:id/days/:dayId", async (req, params) => {
    try {
      const userId = getUserId(req);
      const programId = Number(params.id);
      const dayId = Number(params.dayId);
      const body = await req.json();
      const parsed = updateDaySchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      // Verify program belongs to user
      const program = db
        .select()
        .from(programs)
        .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
        .get();

      if (!program) {
        return json({ error: "Program not found" }, 404);
      }

      const existing = db
        .select()
        .from(programDays)
        .where(
          and(eq(programDays.id, dayId), eq(programDays.programId, programId))
        )
        .get();

      if (!existing) {
        return json({ error: "Program day not found" }, 404);
      }

      const result = db
        .update(programDays)
        .set(parsed.data)
        .where(
          and(eq(programDays.id, dayId), eq(programDays.programId, programId))
        )
        .returning()
        .get();

      broadcast({ type: "program:updated" });
      return json(result);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // DELETE /api/programs/:id/days/:dayId - delete day
  router.delete("/api/programs/:id/days/:dayId", (req, params) => {
    const userId = getUserId(req);
    const programId = Number(params.id);
    const dayId = Number(params.dayId);

    // Verify program belongs to user
    const program = db
      .select()
      .from(programs)
      .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
      .get();

    if (!program) {
      return json({ error: "Program not found" }, 404);
    }

    const existing = db
      .select()
      .from(programDays)
      .where(
        and(eq(programDays.id, dayId), eq(programDays.programId, programId))
      )
      .get();

    if (!existing) {
      return json({ error: "Program day not found" }, 404);
    }

    // Delete exercises for this day first
    db.delete(programExercises)
      .where(eq(programExercises.programDayId, dayId))
      .run();

    db.delete(programDays)
      .where(
        and(eq(programDays.id, dayId), eq(programDays.programId, programId))
      )
      .run();

    broadcast({ type: "program:updated" });
    return json({ success: true });
  });

  // POST /api/programs/:id/days/:dayId/exercises - add exercise to day
  router.post(
    "/api/programs/:id/days/:dayId/exercises",
    async (req, params) => {
      try {
        const userId = getUserId(req);
        const programId = Number(params.id);
        const dayId = Number(params.dayId);
        const body = await req.json();
        const parsed = createProgramExerciseSchema.safeParse(body);

        if (!parsed.success) {
          return json({ error: parsed.error.issues[0].message }, 400);
        }

        // Verify program belongs to user
        const program = db
          .select()
          .from(programs)
          .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
          .get();

        if (!program) {
          return json({ error: "Program not found" }, 404);
        }

        // Verify day belongs to program
        const day = db
          .select()
          .from(programDays)
          .where(
            and(
              eq(programDays.id, dayId),
              eq(programDays.programId, programId)
            )
          )
          .get();

        if (!day) {
          return json({ error: "Program day not found" }, 404);
        }

        const result = db
          .insert(programExercises)
          .values({
            programDayId: dayId,
            exerciseId: parsed.data.exerciseId,
            targetSets: parsed.data.targetSets,
            targetReps: parsed.data.targetReps,
            targetWeight: parsed.data.targetWeight ?? null,
          })
          .returning()
          .get();

        broadcast({ type: "program:updated" });
        return json(result, 201);
      } catch (err) {
        return json({ error: "Invalid request body" }, 400);
      }
    }
  );

  // DELETE /api/programs/:id/days/:dayId/exercises/:exId - remove exercise from day
  router.delete(
    "/api/programs/:id/days/:dayId/exercises/:exId",
    (req, params) => {
      const userId = getUserId(req);
      const programId = Number(params.id);
      const dayId = Number(params.dayId);
      const exId = Number(params.exId);

      // Verify program belongs to user
      const program = db
        .select()
        .from(programs)
        .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
        .get();

      if (!program) {
        return json({ error: "Program not found" }, 404);
      }

      const existing = db
        .select()
        .from(programExercises)
        .where(
          and(
            eq(programExercises.id, exId),
            eq(programExercises.programDayId, dayId)
          )
        )
        .get();

      if (!existing) {
        return json({ error: "Program exercise not found" }, 404);
      }

      db.delete(programExercises)
        .where(
          and(
            eq(programExercises.id, exId),
            eq(programExercises.programDayId, dayId)
          )
        )
        .run();

      broadcast({ type: "program:updated" });
      return json({ success: true });
    }
  );

  // POST /api/programs/:id/activate - set this program as active, deactivate others
  router.post("/api/programs/:id/activate", (req, params) => {
    const userId = getUserId(req);
    const id = Number(params.id);

    const program = db
      .select()
      .from(programs)
      .where(and(eq(programs.id, id), eq(programs.userId, userId)))
      .get();

    if (!program) {
      return json({ error: "Program not found" }, 404);
    }

    // Deactivate all programs for user
    db.update(programs)
      .set({ isActive: 0 })
      .where(eq(programs.userId, userId))
      .run();

    // Activate this program
    const result = db
      .update(programs)
      .set({ isActive: 1 })
      .where(and(eq(programs.id, id), eq(programs.userId, userId)))
      .returning()
      .get();

    broadcast({ type: "program:updated" });
    return json(result);
  });

  // POST /api/programs/:id/days/:dayId/start-session - create workout session from day template
  router.post(
    "/api/programs/:id/days/:dayId/start-session",
    (req, params) => {
      const userId = getUserId(req);
      const programId = Number(params.id);
      const dayId = Number(params.dayId);

      // Verify program belongs to user
      const program = db
        .select()
        .from(programs)
        .where(and(eq(programs.id, programId), eq(programs.userId, userId)))
        .get();

      if (!program) {
        return json({ error: "Program not found" }, 404);
      }

      // Verify day belongs to program
      const day = db
        .select()
        .from(programDays)
        .where(
          and(
            eq(programDays.id, dayId),
            eq(programDays.programId, programId)
          )
        )
        .get();

      if (!day) {
        return json({ error: "Program day not found" }, 404);
      }

      // Create workout session from the day template
      const session = db
        .insert(workoutSessions)
        .values({
          userId,
          programDayId: dayId,
          name: `${program.name} - ${day.name}`,
        })
        .returning()
        .get();

      // Get the exercises for this day to return with the session
      const dayExercises = db
        .select()
        .from(programExercises)
        .leftJoin(exercises, eq(programExercises.exerciseId, exercises.id))
        .where(eq(programExercises.programDayId, dayId))
        .all();

      broadcast({ type: "workout:updated" });
      return json(
        {
          ...session,
          sets: [],
          template: dayExercises.map((de) => ({
            exerciseId: de.program_exercises.exerciseId,
            exercise: de.exercises,
            targetSets: de.program_exercises.targetSets,
            targetReps: de.program_exercises.targetReps,
            targetWeight: de.program_exercises.targetWeight,
          })),
        },
        201
      );
    }
  );
}
