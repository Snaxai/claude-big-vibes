import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { settings } from "../db/schema";
import { getUserId } from "../middleware/auth";
import { Router, json } from "../router";
import { broadcast } from "../ws";

const upsertSettingSchema = z.object({
  value: z.string().min(1, "Value is required"),
});

export function registerSettingsRoutes(router: Router) {
  // GET /api/settings - list all settings for user
  router.get("/api/settings", (req) => {
    const userId = getUserId(req);
    const results = db
      .select()
      .from(settings)
      .where(eq(settings.userId, userId))
      .all();
    return json(results);
  });

  // PUT /api/settings/:key - upsert setting
  router.put("/api/settings/:key", async (req, params) => {
    try {
      const userId = getUserId(req);
      const key = params.key;
      const body = await req.json();
      const parsed = upsertSettingSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      // Check if setting already exists
      const existing = db
        .select()
        .from(settings)
        .where(and(eq(settings.userId, userId), eq(settings.key, key)))
        .get();

      let result;
      if (existing) {
        result = db
          .update(settings)
          .set({ value: parsed.data.value })
          .where(and(eq(settings.userId, userId), eq(settings.key, key)))
          .returning()
          .get();
      } else {
        result = db
          .insert(settings)
          .values({
            userId,
            key,
            value: parsed.data.value,
          })
          .returning()
          .get();
      }

      broadcast({ type: "settings:updated" });
      return json(result);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });
}
