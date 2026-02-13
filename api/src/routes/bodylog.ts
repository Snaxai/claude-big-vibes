import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { bodyLogs, bodyMeasurements } from "../db/schema";
import { getUserId } from "../middleware/auth";
import { Router, json } from "../router";
import { broadcast } from "../ws";

const measurementSchema = z.object({
  area: z.string().min(1, "Area is required"),
  value: z.number().positive("Value must be positive"),
});

const createBodyLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  weight: z.number().positive().optional(),
  bodyFat: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  measurements: z.array(measurementSchema).optional(),
});

const updateBodyLogSchema = z.object({
  date: z.string().min(1).optional(),
  weight: z.number().positive().nullable().optional(),
  bodyFat: z.number().min(0).max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export function registerBodyLogRoutes(router: Router) {
  // GET /api/bodylog - list logs (most recent first, limit 30)
  router.get("/api/bodylog", (req) => {
    const userId = getUserId(req);
    const logs = db
      .select()
      .from(bodyLogs)
      .where(eq(bodyLogs.userId, userId))
      .orderBy(desc(bodyLogs.date))
      .limit(30)
      .all();

    return json(logs);
  });

  // GET /api/bodylog/:id - get one with measurements
  router.get("/api/bodylog/:id", (req, params) => {
    const userId = getUserId(req);
    const id = Number(params.id);

    const log = db
      .select()
      .from(bodyLogs)
      .where(and(eq(bodyLogs.id, id), eq(bodyLogs.userId, userId)))
      .get();

    if (!log) {
      return json({ error: "Body log not found" }, 404);
    }

    const measurements = db
      .select()
      .from(bodyMeasurements)
      .where(eq(bodyMeasurements.bodyLogId, id))
      .all();

    return json({ ...log, measurements });
  });

  // POST /api/bodylog - create (with optional measurements array)
  router.post("/api/bodylog", async (req) => {
    try {
      const userId = getUserId(req);
      const body = await req.json();
      const parsed = createBodyLogSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      const { measurements, ...logData } = parsed.data;

      const log = db
        .insert(bodyLogs)
        .values({
          userId,
          date: logData.date,
          weight: logData.weight ?? null,
          bodyFat: logData.bodyFat ?? null,
          notes: logData.notes ?? null,
        })
        .returning()
        .get();

      let insertedMeasurements: typeof bodyMeasurements.$inferSelect[] = [];

      if (measurements && measurements.length > 0) {
        insertedMeasurements = db
          .insert(bodyMeasurements)
          .values(
            measurements.map((m) => ({
              bodyLogId: log.id,
              area: m.area,
              value: m.value,
            }))
          )
          .returning()
          .all();
      }

      broadcast({ type: "body:updated" });
      return json({ ...log, measurements: insertedMeasurements }, 201);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // PUT /api/bodylog/:id - update
  router.put("/api/bodylog/:id", async (req, params) => {
    try {
      const userId = getUserId(req);
      const id = Number(params.id);
      const body = await req.json();
      const parsed = updateBodyLogSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      const existing = db
        .select()
        .from(bodyLogs)
        .where(and(eq(bodyLogs.id, id), eq(bodyLogs.userId, userId)))
        .get();

      if (!existing) {
        return json({ error: "Body log not found" }, 404);
      }

      const result = db
        .update(bodyLogs)
        .set(parsed.data)
        .where(and(eq(bodyLogs.id, id), eq(bodyLogs.userId, userId)))
        .returning()
        .get();

      broadcast({ type: "body:updated" });
      return json(result);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // DELETE /api/bodylog/:id - delete with measurements
  router.delete("/api/bodylog/:id", (req, params) => {
    const userId = getUserId(req);
    const id = Number(params.id);

    const existing = db
      .select()
      .from(bodyLogs)
      .where(and(eq(bodyLogs.id, id), eq(bodyLogs.userId, userId)))
      .get();

    if (!existing) {
      return json({ error: "Body log not found" }, 404);
    }

    // Delete measurements first (foreign key)
    db.delete(bodyMeasurements)
      .where(eq(bodyMeasurements.bodyLogId, id))
      .run();

    db.delete(bodyLogs)
      .where(and(eq(bodyLogs.id, id), eq(bodyLogs.userId, userId)))
      .run();

    broadcast({ type: "body:updated" });
    return json({ success: true });
  });
}
