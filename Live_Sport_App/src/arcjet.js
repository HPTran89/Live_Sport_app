import arcjet, { slidingWindow, shield, detectBot } from "@arcjet/node";import 'dotenv/config';

const arcjetKey = process.env.ARCJET_KEY;
const arcjetEnv = process.env.ARCJET_ENV || "production";
const arcjetMode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";


if(!arcjetKey) {
    throw new Error("ARCJET_KEY is not set. Arcjet will not be initialized.");
}

export const httpArcjet = arcjetKey ? arcjet({
    key: arcjetKey,
    rules: [
        shield({mode: arcjetMode}),
        detectBot({mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY: PREVIEW']}),
        slidingWindow({ mode: arcjetMode, interval: '10s', max: 50 })
    ]
}): null;

export const wsArcjet = arcjetKey ? arcjet({
    key: arcjetKey,
    rules: [
        shield({mode: arcjetMode}),
        detectBot({mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY: PREVIEW']}),
        slidingWindow({ mode: arcjetMode, interval: '2s', max: 5 }) // only 5 connections attempts every 2 seconds
    ]
}): null;

export function securityMiddleware(req, res, next ) {
    return async (req, res, next) => {
        if(!httpArcjet) return next(); // if Arcjet is not initialized, skip security checks    

        try {
            const decision = await httpArcjet.protect(req); // this will evaluate the request against all configured rules
            if (decision.isDenied()) {
                if(decision.reason.isRateLimit()) {
                    return res.status(429).json({ error: "Too Many Requests" });
                }

                return res.status(403).json({ error: "Forbidden" });
            }
        } catch (err) {
            console.error("Arcjet middleware error:", err);
            return res.status(503).json({ error: "Internal Server Error" });
        }

        next(); // if all checks pass, proceed to the next middleware or route handler
    };
}