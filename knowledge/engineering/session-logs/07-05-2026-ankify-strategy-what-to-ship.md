# 07-05-2026 — Ankify strategy: what should I ship to make money?

## The question Drew opened with
"What should I code/ship? I have Ankify hosted but I don't think it's a good enough plan to make money. Open to continuing it or starting new."

Ankify = web app, med/PA students upload lecture PDFs → GPT-4o Vision generates Anki cards → export `.apkg`. v1 shipped ~April 2026. Stack: Vite frontend (Vercel) + Express/Prisma backend + FastAPI ai-server on EC2. Repo: `/Users/drewmeyer/Projects/ankify`.

## The decisive fact
**Live since ~April, basically zero users.** ~3 months. That reframes everything: zero users after 3 months live is a **distribution problem, not a product-quality problem**. Starting something new would repeat the same movie — build well, deploy, get zero users again — because the broken thing isn't in the code.

Also key: "not good enough to pay for" is Drew's own admission a **fear**, not a conclusion from data. Nobody's used it, so there's no evidence either way. Ankify isn't a failed business; it's an **untested** one. And Drew himself immediately said it genuinely provides real utility (2 hrs → 20 min on a daily task, for students who already pay $500+/yr for UWorld). His judgment already contradicts his fear.

## Drew's two real objections + my read
1. **Unit economics** (the substantive one): ~$0.20–$1.00/generation on GPT-4o Vision. At $20/mo flat with ~5 decks/week (~20/mo), heavy users go underwater. → Real but the *most solvable* concern. Levers, in order of power:
   - **Model swap is the whole ballgame** — GPT-4o Vision is frontier overkill for slide→card. A mini/flash-tier vision model (gpt-4o-mini, Gemini Flash, Haiku-class) is typically a 5–20x cost cut → $1 deck becomes $0.05–0.20. Problem largely dissolves at the model layer. Drew flagged this instinct himself.
   - Don't sell all-you-can-eat — credits/tiers so cost tracks revenue.
   - Charge *more* by being worth more — cloze, and especially **image occlusion** (huge in med Anki, a genuine 2-hr manual task) → $30–40/mo product.
   - You don't need to solve this before testing willingness to pay; 20 test users cost ~$20–40 total.
2. **"Make it free — recreate Anki on the web but better"** → I pushed back hard. This is the **engineer's avoidance escape hatch**: when *charging* feels scary, the brain offers a bigger, "bolder" project so you never have to sell. Why it's a trap: free = $0 = literal opposite of the goal; competes with 15 yrs of Anki ecosystem + FSRS + **AnkiHub (VC-backed, doing exactly this)**; violates his own "ship ONE product, 2hr/day, first paying customers" constraint.

## The real growth edge
Drew has **never sold anything / never convinced anyone to pay.** He's a strong builder — building is his comfort zone *and his trap.* The 180-day reinvention's "act from strength / do the uncomfortable thing" here = learning distribution + the ask for money. That's the actual skill unlock, not more code.

## The plan we landed on (TOMORROW'S FIRST BLOCK STARTS HERE)
Don't start new. Don't go free. Don't add features. Instead:
1. **Swap ai-server to a cheap vision model**, confirm card quality holds. Only bit of coding on the critical path — makes economics real + lets him test pricing without bleeding.
2. **Get it in front of 10–20 real med students** (med-student friend + class group chat, r/medicalschool, r/Anki, a med Discord). Need ten humans, not a growth engine.
3. **Watch 2–3 use it on their real lecture** — learn if the wedge (*your* slides vs. premade AnKing decks) is right. First real data he's ever had.
4. **Make the small ask** — Gumroad/Stripe payment link, "$10/mo, here's the link." Three yeses ≠ zero. Converts "not good enough to pay for" from fear → tested fact.

Headline: **Cut the model cost, then go get ten med students and ask three of them for $10.** That's the next two weeks.

## Open thread for tomorrow
I offered two entry points; Drew is deciding where to start. Pick by where discomfort is highest:
- (a) Dig into `ai-server` code, scope the cheap-model swap concretely.
- (b) Draft the outreach + a "what I watch for" user-test script.

## How Drew seemed
Honest and self-aware — named his own fear out loud ("part of me tells myself it's not good enough"). Engaged seriously with the pushback rather than defending. Good sign. The block is a real one; he wants to start here tomorrow.
