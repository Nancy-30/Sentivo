# AI Engineer Take-Home Assignment
## Audio Intent & Sentiment Analyzer

Welcome, and thanks for taking the time to work on this. The goal of this assignment is to give us a window into how you think about building small, real-world AI systems end-to-end — from API integration and prompt design to UX and engineering hygiene.

---

## 🎯 The Problem

Customer-facing teams (sales, support, success) sit on thousands of hours of call recordings, and most of it goes unanalyzed. We want a lightweight tool that turns a single call recording into something useful in under a minute.

**Build a web application that:**
1. Lets a user **upload an audio file** (e.g. a call recording) **OR record a conversation live** through the browser microphone.
2. Sends the audio to **Google Gemini** for processing.
3. Returns and displays:
   - **Intent** — what the conversation is fundamentally about. Single primary intent is fine; multiple intents with confidence is better.
   - **Sentiment** — overall sentiment of the conversation, and ideally a breakdown (e.g. caller vs. agent, or sentiment progression across the call).
4. Presents the output in a **clean, usable UI**.

That's the core. How you get there is up to you.


---

## 🔧 Constraints & Requirements

### Must-have
- **Gemini API** for the audio understanding step. We'll provide an API key — please don't commit it. Gemini supports native audio input on the recent models, so you do not have to use a separate ASR step unless you want to.
- **Audio input via both upload and live mic recording.** Both paths should work.
- **A backend** (Python preferred — FastAPI, Flask, anything you like) handling the Gemini call. Don't call Gemini directly from the browser; we don't want keys in client-side code.
- **A frontend** that's reasonable to look at and use. Doesn't need to be fancy — clarity beats decoration.
- **Supported formats:** at minimum MP3 and WAV. Handle audio up to ~10 minutes gracefully.
- **A README** in your repo with setup steps, architecture notes, and the design decisions you made (and why).

### Nice-to-have (any of these score points, none are required)
- Live transcript streaming as the recording happens or playback progresses.
- Speaker diarization (who said what).
- Sentiment timeline across the call instead of a single score.
- Multi-intent detection with confidence scores.
- A short conversation summary alongside intent/sentiment.
- Caching so re-analyzing the same file is instant.
- Deployment (Vercel/Render/Fly/HF Spaces — wherever you like).
- Tests (even a couple — we care about the instinct, not the coverage number).

### Out of scope
- Auth, multi-user accounts, persistent databases — skip all of that.
- Mobile-optimized layouts — desktop browser is fine.

---

## 📦 Deliverables

1. **GitHub repo** (public or private — if private, share access with `<your-github-handle-here>`).
2. **README** covering:
   - Setup instructions (we should be able to clone and run in under 5 minutes).
   - Architecture diagram or a few sentences on how data flows.
   - Your prompt(s) for Gemini and a note on why you wrote them that way.
   - Trade-offs you made and what you'd do with another week.
3. **A 2–3 minute demo video** (Loom / screen recording) walking through the app with one sample upload and one live recording. Don't over-rehearse it.

---

## 🧭 How We'll Evaluate

We're not grading you on a checklist; we're trying to understand how you build. Roughly in order of weight:

1. **Does it work?** Both audio paths produce sensible intent and sentiment on a real call.
2. **Prompt and pipeline design.** How thoughtfully you ask Gemini for what you need. Schema-constrained output, few-shot examples, handling of long audio, graceful failure — these all show up here.
3. **Code quality.** Readable, organized, not over-engineered. We'd rather see 200 clean lines than 2000 messy ones.
4. **UX judgment.** Does the interface make the output easy to act on?
5. **Communication.** Your README and demo video tell us how you think.

We are explicitly **not** evaluating:
- Visual polish beyond "clearly laid out and uncluttered".
- Framework choice — use what you're fastest in.
- Test coverage percentages.

---

## ⏱️ Time & Submission

- **Deadline:** `18th May 2026 (Monday)` (let us know if you need an extension; that's never a problem).
- **Submit by:** replying to the assignment email with the repo link and demo video.

---

## ❓ Questions

Ping us anytime. We'd rather answer a question than have you guess at intent. (Also, what's a more meta way to start a sentiment-and-intent assignment than by emailing your interviewer about intent?)

Good luck — looking forward to seeing what you build.
