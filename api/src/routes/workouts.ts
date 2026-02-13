import { eq, and, isNull, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { workoutSessions, workoutSets } from "../db/schema";
import { getUserId } from "../middleware/auth";
import { Router, json } from "../router";
import { broadcast } from "../ws";
import { checkPR } from "../lib/pr";

const createSessionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  programDayId: z.number().int().optional(),
});

const updateSessionSchema = z.object({
  name: z.string().min(1).optional(),
  finishedAt: z.string().optional(),
});

const logSetSchema = z.object({
  exerciseId: z.number().int().positive("Exercise ID is required"),
  reps: z.number().int().positive("Reps must be positive"),
  weight: z.number().nonnegative("Weight must be non-negative"),
  rpe: z.number().min(1).max(10).optional(),
});

export function registerWorkoutRoutes(router: Router) {
  // GET /api/workouts - list sessions (most recent first), include sets
  router.get("/api/workouts", (req) => {
    const userId = getUserId(req);
    const sessions = db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .orderBy(desc(workoutSessions.startedAt))
      .all();

    const result = sessions.map((session) => {
      const sets = db
        .select()
        .from(workoutSets)
        .where(eq(workoutSets.sessionId, session.id))
        .orderBy(workoutSets.setOrder)
        .all();
      return { ...session, sets };
    });

    return json(result);
  });

  // GET /api/workouts/active - get active session (finishedAt is null)
  router.get("/api/workouts/active", (req) => {
    const userId = getUserId(req);
    const session = db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          isNull(workoutSessions.finishedAt)
        )
      )
      .orderBy(desc(workoutSessions.startedAt))
      .get();

    if (!session) {
      return json(null);
    }

    const sets = db
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.sessionId, session.id))
      .orderBy(workoutSets.setOrder)
      .all();

    return json({ ...session, sets });
  });

  // GET /api/workouts/:id - get one with sets
  router.get("/api/workouts/:id", (req, params) => {
    const userId = getUserId(req);
    const id = Number(params.id);

    const session = db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)))
      .get();

    if (!session) {
      return json({ error: "Workout session not found" }, 404);
    }

    const sets = db
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.sessionId, session.id))
      .orderBy(workoutSets.setOrder)
      .all();

    return json({ ...session, sets });
  });

  // POST /api/workouts - create new session
  router.post("/api/workouts", async (req) => {
    try {
      const userId = getUserId(req);
      const body = await req.json();
      const parsed = createSessionSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      const result = db
        .insert(workoutSessions)
        .values({
          userId,
          name: parsed.data.name,
          programDayId: parsed.data.programDayId ?? null,
        })
        .returning()
        .get();

      broadcast({ type: "workout:updated" });
      return json(result, 201);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // PUT /api/workouts/:id - update session
  router.put("/api/workouts/:id", async (req, params) => {
    try {
      const userId = getUserId(req);
      const id = Number(params.id);
      const body = await req.json();
      const parsed = updateSessionSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      const existing = db
        .select()
        .from(workoutSessions)
        .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)))
        .get();

      if (!existing) {
        return json({ error: "Workout session not found" }, 404);
      }

      const result = db
        .update(workoutSessions)
        .set(parsed.data)
        .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)))
        .returning()
        .get();

      broadcast({ type: "workout:updated" });
      return json(result);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // DELETE /api/workouts/:id - delete session and its sets
  router.delete("/api/workouts/:id", (req, params) => {
    const userId = getUserId(req);
    const id = Number(params.id);

    const existing = db
      .select()
      .from(workoutSessions)
      .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)))
      .get();

    if (!existing) {
      return json({ error: "Workout session not found" }, 404);
    }

    // Delete sets first (foreign key)
    db.delete(workoutSets).where(eq(workoutSets.sessionId, id)).run();
    db.delete(workoutSessions)
      .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId)))
      .run();

    broadcast({ type: "workout:updated" });
    return json({ success: true });
  });

  // POST /api/workouts/:id/sets - log a set
  router.post("/api/workouts/:id/sets", async (req, params) => {
    try {
      const userId = getUserId(req);
      const sessionId = Number(params.id);
      const body = await req.json();
      const parsed = logSetSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      // Verify session exists and belongs to user
      const session = db
        .select()
        .from(workoutSessions)
        .where(
          and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId))
        )
        .get();

      if (!session) {
        return json({ error: "Workout session not found" }, 404);
      }

      // Determine set order
      const existingSets = db
        .select()
        .from(workoutSets)
        .where(eq(workoutSets.sessionId, sessionId))
        .all();
      const setOrder = existingSets.length + 1;

      // Check for PR
      const isPR = checkPR(
        db,
        parsed.data.exerciseId,
        userId,
        parsed.data.weight,
        parsed.data.reps
      );

      const result = db
        .insert(workoutSets)
        .values({
          sessionId,
          exerciseId: parsed.data.exerciseId,
          setOrder,
          reps: parsed.data.reps,
          weight: parsed.data.weight,
          rpe: parsed.data.rpe ?? null,
          isPR: isPR ? 1 : 0,
        })
        .returning()
        .get();

      broadcast({
        type: "workout:setLogged",
        payload: { sessionId, set: result, isPR },
      });

      return json({ ...result, isPR }, 201);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // DELETE /api/workouts/:id/sets/:setId - delete a set
  router.delete("/api/workouts/:id/sets/:setId", (req, params) => {
    const userId = getUserId(req);
    const sessionId = Number(params.id);
    const setId = Number(params.setId);

    // Verify session belongs to user
    const session = db
      .select()
      .from(workoutSessions)
      .where(
        and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId))
      )
      .get();

    if (!session) {
      return json({ error: "Workout session not found" }, 404);
    }

    const existing = db
      .select()
      .from(workoutSets)
      .where(and(eq(workoutSets.id, setId), eq(workoutSets.sessionId, sessionId)))
      .get();

    if (!existing) {
      return json({ error: "Set not found" }, 404);
    }

    db.delete(workoutSets)
      .where(and(eq(workoutSets.id, setId), eq(workoutSets.sessionId, sessionId)))
      .run();

    broadcast({ type: "workout:updated" });
    return json({ success: true });
  });
}
