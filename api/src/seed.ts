import { eq } from "drizzle-orm";
import { db } from "./db";
import { exercises, workoutSessions, workoutSets, meals, bodyLogs } from "./db/schema";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export function seedIfEmpty() {
  const existing = db.select().from(exercises).limit(1).all();
  if (existing.length > 0) return;

  console.log("Empty database detected, seeding test data...");

  // ── Exercises ──

  const exerciseData = [
    { name: "Barbell Bench Press", muscleGroup: "Chest", equipment: "Barbell" },
    { name: "Incline Dumbbell Press", muscleGroup: "Chest", equipment: "Dumbbells" },
    { name: "Cable Flyes", muscleGroup: "Chest", equipment: "Cable" },
    { name: "Barbell Back Squat", muscleGroup: "Legs", equipment: "Barbell" },
    { name: "Romanian Deadlift", muscleGroup: "Legs", equipment: "Barbell" },
    { name: "Leg Press", muscleGroup: "Legs", equipment: "Machine" },
    { name: "Leg Curl", muscleGroup: "Legs", equipment: "Machine" },
    { name: "Barbell Overhead Press", muscleGroup: "Shoulders", equipment: "Barbell" },
    { name: "Lateral Raise", muscleGroup: "Shoulders", equipment: "Dumbbells" },
    { name: "Pull-Up", muscleGroup: "Back", equipment: "Bodyweight" },
    { name: "Barbell Row", muscleGroup: "Back", equipment: "Barbell" },
    { name: "Seated Cable Row", muscleGroup: "Back", equipment: "Cable" },
    { name: "Face Pull", muscleGroup: "Back", equipment: "Cable" },
    { name: "Barbell Curl", muscleGroup: "Arms", equipment: "Barbell" },
    { name: "Tricep Pushdown", muscleGroup: "Arms", equipment: "Cable" },
    { name: "Hammer Curl", muscleGroup: "Arms", equipment: "Dumbbells" },
    { name: "Conventional Deadlift", muscleGroup: "Back", equipment: "Barbell" },
    { name: "Walking Lunge", muscleGroup: "Legs", equipment: "Dumbbells" },
    { name: "Calf Raise", muscleGroup: "Legs", equipment: "Machine" },
    { name: "Dumbbell Shoulder Press", muscleGroup: "Shoulders", equipment: "Dumbbells" },
  ] as const;

  const exerciseIds: Record<string, number> = {};
  for (const ex of exerciseData) {
    const result = db.insert(exercises).values(ex).returning().get();
    exerciseIds[ex.name] = result.id;
  }

  // ── Workouts ──
  // Each set: [weight (kg), reps, rpe]

  const workoutData = [
    {
      name: "Push Day",
      daysAgo: 6,
      sets: [
        { exercise: "Barbell Bench Press", sets: [[80, 8, 7], [85, 6, 8], [85, 6, 8.5], [80, 8, 9]] },
        { exercise: "Incline Dumbbell Press", sets: [[30, 10, 7], [32, 8, 8], [32, 8, 8.5]] },
        { exercise: "Barbell Overhead Press", sets: [[45, 8, 7], [50, 6, 8], [50, 5, 9]] },
        { exercise: "Lateral Raise", sets: [[10, 15, 7], [12, 12, 8], [12, 12, 9]] },
        { exercise: "Tricep Pushdown", sets: [[25, 12, 7], [27, 10, 8], [27, 10, 8.5]] },
        { exercise: "Cable Flyes", sets: [[15, 12, 7], [15, 12, 8], [17, 10, 9]] },
      ],
    },
    {
      name: "Pull Day",
      daysAgo: 5,
      sets: [
        { exercise: "Pull-Up", sets: [[0, 10, 7], [0, 8, 8], [0, 7, 9]] },
        { exercise: "Barbell Row", sets: [[70, 8, 7], [75, 6, 8], [75, 6, 8.5]] },
        { exercise: "Seated Cable Row", sets: [[55, 10, 7], [60, 8, 8], [60, 8, 8.5]] },
        { exercise: "Face Pull", sets: [[20, 15, 7], [22, 12, 8], [22, 12, 8]] },
        { exercise: "Barbell Curl", sets: [[30, 10, 7], [32, 8, 8], [32, 8, 9]] },
        { exercise: "Hammer Curl", sets: [[14, 10, 7], [16, 8, 8], [16, 8, 9]] },
      ],
    },
    {
      name: "Leg Day",
      daysAgo: 4,
      sets: [
        { exercise: "Barbell Back Squat", sets: [[100, 6, 7], [110, 5, 8], [110, 5, 8.5], [100, 7, 9]] },
        { exercise: "Romanian Deadlift", sets: [[90, 8, 7], [95, 8, 8], [95, 7, 8.5]] },
        { exercise: "Leg Press", sets: [[180, 10, 7], [200, 8, 8], [200, 8, 9]] },
        { exercise: "Leg Curl", sets: [[40, 10, 7], [45, 8, 8], [45, 8, 8.5]] },
        { exercise: "Walking Lunge", sets: [[20, 12, 8], [20, 12, 8.5], [22, 10, 9]] },
        { exercise: "Calf Raise", sets: [[80, 15, 7], [90, 12, 8], [90, 12, 8.5]] },
      ],
    },
    {
      name: "Upper Body",
      daysAgo: 2,
      sets: [
        { exercise: "Barbell Bench Press", sets: [[82, 8, 7], [87, 6, 8], [87, 6, 8.5], [82, 8, 9]] },
        { exercise: "Barbell Row", sets: [[72, 8, 7], [77, 6, 8], [77, 6, 8.5]] },
        { exercise: "Dumbbell Shoulder Press", sets: [[24, 10, 7], [26, 8, 8], [26, 8, 9]] },
        { exercise: "Pull-Up", sets: [[0, 10, 7], [0, 9, 8], [0, 8, 9]] },
        { exercise: "Cable Flyes", sets: [[15, 12, 7], [17, 10, 8]] },
        { exercise: "Face Pull", sets: [[22, 15, 7], [25, 12, 8]] },
      ],
    },
    {
      name: "Lower Body",
      daysAgo: 1,
      sets: [
        { exercise: "Conventional Deadlift", sets: [[120, 5, 7], [130, 3, 8.5], [130, 3, 9], [120, 5, 9]] },
        { exercise: "Barbell Back Squat", sets: [[90, 8, 7], [95, 6, 8], [95, 6, 8.5]] },
        { exercise: "Leg Press", sets: [[190, 10, 7], [210, 8, 8.5], [210, 8, 9]] },
        { exercise: "Leg Curl", sets: [[42, 10, 7], [47, 8, 8], [47, 8, 9]] },
        { exercise: "Calf Raise", sets: [[85, 15, 7], [95, 12, 8.5], [95, 12, 9]] },
      ],
    },
  ];

  for (const workout of workoutData) {
    const session = db
      .insert(workoutSessions)
      .values({ name: workout.name })
      .returning()
      .get();

    let setOrder = 1;
    for (const group of workout.sets) {
      for (const [weight, reps, rpe] of group.sets) {
        db.insert(workoutSets)
          .values({
            sessionId: session.id,
            exerciseId: exerciseIds[group.exercise],
            setOrder: setOrder++,
            reps,
            weight,
            rpe,
          })
          .run();
      }
    }

    db.update(workoutSessions)
      .set({ finishedAt: new Date().toISOString() })
      .where(eq(workoutSessions.id, session.id))
      .run();
  }

  // ── Meals ──

  const mealDays = [
    {
      daysAgo: 4,
      meals: [
        { name: "Poached eggs on avocado toast", calories: 460, protein: 22, carbs: 34, fat: 26 },
        { name: "Chicken Caesar salad with croutons", calories: 540, protein: 38, carbs: 30, fat: 28 },
        { name: "Rice cakes with peanut butter & banana", calories: 310, protein: 10, carbs: 42, fat: 12 },
        { name: "Shrimp tacos with slaw & lime crema", calories: 580, protein: 32, carbs: 52, fat: 24 },
      ],
    },
    {
      daysAgo: 3,
      meals: [
        { name: "Smoothie bowl with granola & berries", calories: 450, protein: 20, carbs: 62, fat: 14 },
        { name: "Tuna salad sandwich on whole wheat", calories: 520, protein: 36, carbs: 42, fat: 20 },
        { name: "Apple with almond butter", calories: 250, protein: 6, carbs: 28, fat: 14 },
        { name: "Grilled chicken thigh with couscous & roasted peppers", calories: 610, protein: 40, carbs: 58, fat: 18 },
      ],
    },
    {
      daysAgo: 2,
      meals: [
        { name: "Oatmeal with banana & peanut butter", calories: 480, protein: 18, carbs: 65, fat: 16 },
        { name: "Grilled chicken wrap with avocado", calories: 620, protein: 42, carbs: 48, fat: 24 },
        { name: "Greek yogurt with honey & almonds", calories: 280, protein: 20, carbs: 28, fat: 10 },
        { name: "Salmon with rice & steamed broccoli", calories: 650, protein: 45, carbs: 60, fat: 20 },
      ],
    },
    {
      daysAgo: 1,
      meals: [
        { name: "Scrambled eggs on toast with spinach", calories: 420, protein: 28, carbs: 30, fat: 20 },
        { name: "Turkey & quinoa bowl with roasted veg", calories: 580, protein: 40, carbs: 55, fat: 18 },
        { name: "Protein shake with oat milk & banana", calories: 340, protein: 32, carbs: 38, fat: 6 },
        { name: "Beef stir-fry with noodles", calories: 680, protein: 38, carbs: 70, fat: 22 },
      ],
    },
    {
      daysAgo: 0,
      meals: [
        { name: "Overnight oats with berries & chia seeds", calories: 410, protein: 16, carbs: 58, fat: 12 },
        { name: "Chicken breast with sweet potato & green beans", calories: 560, protein: 45, carbs: 52, fat: 12 },
        { name: "Cottage cheese with pineapple", calories: 220, protein: 24, carbs: 18, fat: 5 },
        { name: "Pasta bolognese with side salad", calories: 720, protein: 35, carbs: 80, fat: 24 },
      ],
    },
  ];

  for (const day of mealDays) {
    const date = daysAgo(day.daysAgo);
    for (const meal of day.meals) {
      db.insert(meals).values({ ...meal, date }).run();
    }
  }

  // ── Body Logs ──

  const bodyLogData = [
    { daysAgo: 7, weight: 83.2, bodyFat: 16.5 },
    { daysAgo: 5, weight: 82.9, bodyFat: 16.3 },
    { daysAgo: 3, weight: 83.0, bodyFat: 16.2 },
    { daysAgo: 1, weight: 82.6, bodyFat: 16.0 },
    { daysAgo: 0, weight: 82.4, bodyFat: 15.9 },
  ];

  for (const log of bodyLogData) {
    db.insert(bodyLogs)
      .values({ date: daysAgo(log.daysAgo), weight: log.weight, bodyFat: log.bodyFat })
      .run();
  }

  console.log("Seeded: 20 exercises, 5 workouts, 20 meals, 5 body logs");
}
