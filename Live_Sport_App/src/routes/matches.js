import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";

const MAX_LIMIT = 100;

export const matchRouter = Router();

// Define routes for matches
matchRouter.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid query",
      details: parsed.error.issues,
    });
  }

  const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);
    res.json({ data });
  } catch (err) {
    res.status(500).json({
      error: "failed to list matches",
      details: JSON.stringify(err),
    });
  }
});

matchRouter.post("/", async (req, res) => {
  const parsed = await createMatchSchema.safeParseAsync(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid Payload",
      details: parsed.error.issues,
    });
  }
  // can only descructure once we know there is something to descructure, which is after the validation check
  const {
    data: { startTime, endTime, homeScore, awayScore },
  } = parsed;

  console.log("Creating match with data:", parsed.data);

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();

    // broadcast the new match to all connected WebSocket clients
    if (res.app.locals.broadcastMatchCreated) {
      // push new match data to all of the clients that are currently connected to the WebSocket server
      res.app.locals.broadcastMatchCreated(event); 
    }
    res.status(201).json({ data: event });
  } catch (err) {
    res.status(500).json({
      error: "Failed to create match",
    });
  }
});
