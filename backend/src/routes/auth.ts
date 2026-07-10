import { Router, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../lib/errors";

const router = Router();

if (config.google.clientId && config.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email from Google"));

          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
            },
            create: {
              googleId: profile.id,
              email,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
            },
          });

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      },
    ),
  );
}

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req: Request, res: Response) => {
    const user = req.user as { id: string } | undefined;
    if (!user) {
      res.redirect("/login?error=auth_failed");
      return;
    }

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    res.redirect(`${config.corsOrigin}/auth/callback?token=${token}`);
  },
);

router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.authUser });
});

if (process.env.NODE_ENV === "development") {
  router.post(
    "/dev-login",
    asyncHandler(async (_req: Request, res: Response) => {
      const user = await prisma.user.upsert({
        where: { googleId: "dev-user" },
        update: {},
        create: {
          googleId: "dev-user",
          email: "dev@ankify.local",
          name: "Dev User",
          avatar: null,
        },
      });

      const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      res.json({ token, user });
    }),
  );
}

export default router;
