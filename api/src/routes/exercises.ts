import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { exercises } from "../db/schema";
import { getUserId } from "../middleware/auth";
import { Router, json } from "../router";
import { broadcast } from "../ws";

const createExerciseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  muscleGroup: z.string().min(1, "Muscle group is required"),
  equipment: z.string().optional(),
});

const updateExerciseSchema = z.object({
  name: z.string().min(1).optional(),
  muscleGroup: z.string().min(1).optional(),
  equipment: z.string().nullable().optional(),
});

export function registerExerciseRoutes(router: Router) {
  // GET /api/exercises - list all for user
  router.get("/api/exercises", (req) => {
    const userId = getUserId(req);
    const results = db
      .select()
      .from(exercises)
      .where(eq(exercises.userId, userId))
      .all();
    return json(results);
  });

  // GET /api/exercises/:id - get one
  router.get("/api/exercises/:id", (req, params) => {
    const userId = getUserId(req);
    const id = Number(params.id);
    const exercise = db
      .select()
      .from(exercises)
      .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
      .get();

    if (!exercise) {
      return json({ error: "Exercise not found" }, 404);
    }
    return json(exercise);
  });

  // POST /api/exercises - create
  router.post("/api/exercises", async (req) => {
    try {
      const userId = getUserId(req);
      const body = await req.json();
      const parsed = createExerciseSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      const result = db
        .insert(exercises)
        .values({
          userId,
          name: parsed.data.name,
          muscleGroup: parsed.data.muscleGroup,
          equipment: parsed.data.equipment ?? null,
        })
        .returning()
        .get();

      broadcast({ type: "workout:updated" });
      return json(result, 201);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // PUT /api/exercises/:id - update
  router.put("/api/exercises/:id", async (req, params) => {
    try {
      const userId = getUserId(req);
      const id = Number(params.id);
      const body = await req.json();
      const parsed = updateExerciseSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      const existing = db
        .select()
        .from(exercises)
        .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
        .get();

      if (!existing) {
        return json({ error: "Exercise not found" }, 404);
      }

      const result = db
        .update(exercises)
        .set(parsed.data)
        .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
        .returning()
        .get();

      broadcast({ type: "workout:updated" });
      return json(result);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // DELETE /api/exercises/:id - delete
  router.delete("/api/exercises/:id", (req, params) => {
    const userId = getUserId(req);
    const id = Number(params.id);

    const existing = db
      .select()
      .from(exercises)
      .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
      .get();

    if (!existing) {
      return json({ error: "Exercise not found" }, 404);
    }

    db.delete(exercises)
      .where(and(eq(exercises.id, id), eq(exercises.userId, userId)))
      .run();

    broadcast({ type: "workout:updated" });
    return json({ success: true });
  });
}
