import { eq, and } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { workoutSets, workoutSessions } from "../db/schema";
import type * as schema from "../db/schema";

/**
 * Check if a given weight x reps combination is a personal record
 * for the specified exercise and user.
 *
 * A set is a PR if no previous set exists for that exercise
 * where weight >= current AND reps >= current.
 */
export function checkPR(
  db: BunSQLiteDatabase<typeof schema>,
  exerciseId: number,
  userId: string,
  weight: number,
  reps: number
): boolean {
  const previousSets = db
    .select({
      weight: workoutSets.weight,
      reps: workoutSets.reps,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSets.exerciseId, exerciseId),
        eq(workoutSessions.userId, userId)
      )
    )
    .all();

  // It's a PR if no previous set matches or exceeds both weight and reps
  const beaten = previousSets.some(
    (set) => set.weight >= weight && set.reps >= reps
  );

  return !beaten;
}
