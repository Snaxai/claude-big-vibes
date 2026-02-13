import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { meals } from "../db/schema";
import { getUserId } from "../middleware/auth";
import { Router, json } from "../router";
import { broadcast } from "../ws";

const createMealSchema = z.object({
  date: z.string().min(1, "Date is required"),
  name: z.string().min(1, "Name is required"),
  calories: z.number().nonnegative("Calories must be non-negative"),
  protein: z.number().nonnegative("Protein must be non-negative"),
  carbs: z.number().nonnegative("Carbs must be non-negative"),
  fat: z.number().nonnegative("Fat must be non-negative"),
});

const updateMealSchema = z.object({
  date: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
});

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export function registerMealRoutes(router: Router) {
  // GET /api/meals?date=YYYY-MM-DD - list meals for date (default today)
  router.get("/api/meals", (req) => {
    const userId = getUserId(req);
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || getTodayDate();

    const results = db
      .select()
      .from(meals)
      .where(and(eq(meals.userId, userId), eq(meals.date, date)))
      .all();

    return json(results);
  });

  // GET /api/meals/summary?date=YYYY-MM-DD - daily summary with totals
  router.get("/api/meals/summary", (req) => {
    const userId = getUserId(req);
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || getTodayDate();

    const dayMeals = db
      .select()
      .from(meals)
      .where(and(eq(meals.userId, userId), eq(meals.date, date)))
      .all();

    const summary = {
      date,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      meals: dayMeals,
    };

    for (const meal of dayMeals) {
      summary.totalCalories += meal.calories;
      summary.totalProtein += meal.protein;
      summary.totalCarbs += meal.carbs;
      summary.totalFat += meal.fat;
    }

    return json(summary);
  });

  // POST /api/meals - create
  router.post("/api/meals", async (req) => {
    try {
      const userId = getUserId(req);
      const body = await req.json();
      const parsed = createMealSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      const result = db
        .insert(meals)
        .values({
          userId,
          ...parsed.data,
        })
        .returning()
        .get();

      broadcast({ type: "meal:updated" });
      return json(result, 201);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // PUT /api/meals/:id - update
  router.put("/api/meals/:id", async (req, params) => {
    try {
      const userId = getUserId(req);
      const id = Number(params.id);
      const body = await req.json();
      const parsed = updateMealSchema.safeParse(body);

      if (!parsed.success) {
        return json({ error: parsed.error.issues[0].message }, 400);
      }

      const existing = db
        .select()
        .from(meals)
        .where(and(eq(meals.id, id), eq(meals.userId, userId)))
        .get();

      if (!existing) {
        return json({ error: "Meal not found" }, 404);
      }

      const result = db
        .update(meals)
        .set(parsed.data)
        .where(and(eq(meals.id, id), eq(meals.userId, userId)))
        .returning()
        .get();

      broadcast({ type: "meal:updated" });
      return json(result);
    } catch (err) {
      return json({ error: "Invalid request body" }, 400);
    }
  });

  // DELETE /api/meals/:id - delete
  router.delete("/api/meals/:id", (req, params) => {
    const userId = getUserId(req);
    const id = Number(params.id);

    const existing = db
      .select()
      .from(meals)
      .where(and(eq(meals.id, id), eq(meals.userId, userId)))
      .get();

    if (!existing) {
      return json({ error: "Meal not found" }, 404);
    }

    db.delete(meals)
      .where(and(eq(meals.id, id), eq(meals.userId, userId)))
      .run();

    broadcast({ type: "meal:updated" });
    return json({ success: true });
  });
}
