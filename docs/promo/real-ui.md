# Real UI-kit components in a video

**Default kit: Knowns UI** (https://ui.knowns.dev). Any video, short or promo, that needs interface-quality
components takes them from it rather than building new ones (SOUL §5, `docs/soul/03-visuals.md`). When the film
is about another product that has its own kit, use that product's kit instead.

When the product has a component kit (a registry of React components), the film can show the **real
component** instead of a look-alike (aesthetics Q1). A real component is the product's own pixels and
behaviour; but it is built for a live web page, and Remotion renders each frame on its own. This is the
recipe, with what broke.

## When to reach for the kit

For anything **AI-related** (a chat input, an agent that is thinking, a cited answer, a tool call, a graph of
agents and tools, a stream of tokens), use the product's own kit rather than drawing it: these are the moments
where a look-alike is most visibly fake and where the real component already says the right thing (a thinking
panel that shows "Looked for earlier decisions: nothing found" explains why an agent asks again, better than
any caption). Draw only what the kit does not have (a chat bubble, a counter, big type), in the same style.
Which kit component for which moment:

| Moment | Component |
|---|---|
| you type to the agent | `ChatComposer` (value controlled by the frame) |
| the agent works before it answers; it finds nothing | `ThinkingState` (steps appear and finish by frame; `elapsed` fixed) |
| the agent answers, with sources and citations | `AiAnswer` |
| the agent calls a tool; arguments, wait, result | `ToolCallCard` (developer audiences only) |
| who talks to whom | `AgentGraph` (few actors only: it shrinks to fit) |
| a decision, a file, a place a thing lives | `Card` + `Tag` |
| a command, a diff, a terminal | `CodeBlock` (`copy={false}`, `wrapToggle={false}`, the code string grows by frame) |
| a count that climbs | `NumberTicker` (remount per value with `key={n}`) |
| an agent's plan with checks | `AgentPlan` (fixed `now`) |
| a product flow, right or wrong | blocks such as `OnboardingChecklist`, `SetupWizard` (controlled `steps` / `current`) |
| the whole film's background | a background block (Node Field, Dot Spotlight, Flickering Grid), redrawn per frame (see Traps) |

## Recipe

0. **Fetch from the registry** with `curl -sf https://ui.knowns.dev/r/<name>.json` (each item lists its files with
   their content and its `registryDependencies`; follow them for the closure). Python's default client is
   refused by the site; curl and the shadcn CLI are not.
1. **Copy the registry closure into the video**, keeping the registry's paths (`knowns-ui/lib/...`,
   `knowns-ui/ui/...`) and rewriting the `@/registry/...` alias imports to relative ones. Find the
   closure by following imports from the components you want; install only the small dependencies they
   name (for example `class-variance-authority`). A video never imports another video, so each film that
   uses them carries its own copy.
2. **Build the stylesheet once, offline.** The components are Tailwind v4 classes. Put a `theme.css`
   next to them (`@import "tailwindcss"`, `@source` the component and scene folders, the kit's design
   tokens, and your recolouring of those tokens), then `bun run css <id>` writes `knowns-ui.css`, which
   the entry imports. Recolour by tokens (`.dark { --card: ... }`), never by editing the components. Re-run
   it when you add a class.
3. **Make each frame a pure function of the frame.** Remotion screenshots frame by frame; anything that
   runs on wall-clock time lands on a different state each time. For each component:
   - state comes from props, computed from the frame (a `status`, a growing `text`, a list that gains
     one item per beat);
   - fix the clocks the component reads (`now`, `clock`), and turn off real-time reveals and intros
     (`reveal={false}`, `intro={false}`);
   - add `*, *::before, *::after { animation: none !important; transition: none !important; }` to the
     film's CSS so no entrance animation is captured half way;
   - give it a fixed width and height so it never waits for a layout observer;
   - **prove it:** render the same frame twice and compare file hashes.
4. **Wrap each component in a small file** (`answer.tsx`, `graph.tsx`) that turns frames into props, so a
   scene reads like a sentence.
5. **Size it for a phone.** Web components draw about 13 px type. On a 1080 px frame that is unreadable
   (aesthetics C7). Use CSS `zoom` (layout-level, stays sharp) with a narrow design width: a panel designed
   at 322 px and zoomed 2.4× fills the 774 px column with about 31 px type. Keep the result inside the safe
   area (§7a), and check it on a still at thumbnail size.

## The product's own repo (no registry)

When the film is about a product whose source you have (the owner's app, not a published kit), use its
components straight from the repo. Same rules as above, plus:

1. **Copy, never import across repos.** Copy the atoms and molecules the film needs, and the pure helpers they use
   (types, filters, sorters), into `src/videos/<id>/<folder>/` (e.g. `mg-ui`). Make `@/...` imports relative.
   Leave the product's organisms behind: they carry routing, data loading and hooks a film does not need; compose
   the page in a small film file with the site's own markup and class names instead.
2. **Shim the framework.** `next/link` becomes a plain `<a>`; copy-to-clipboard and analytics become no-ops; an
   `<img>` becomes Remotion's `<Img>` (the frame waits for it) without lazy loading or fade-in. Write every change
   in a `NOTICE.md` in the folder.
3. **The stylesheet is the site's own.** Copy its global CSS as `<folder>/theme.css`, add `@source "./"` and
   `@source "../scenes.tsx"`, turn CSS motion off, and build it with `bun run css <id> --dir <folder>`
   (writes `<folder>/<folder>.css`; import it in `entry.tsx`). If the theme hangs off `<html>` (`data-theme`),
   set that attribute once when the film module loads.
4. **Real data, read once and kept.** Take the catalog from the live page (a server-rendered page often embeds it
   in its payload) or from what the page shows in a browser, save it as `src/videos/<id>/<data>.json` with the
   date and source, and save every image it needs under `public/capture/<id>/` so a render never hits the
   network. When the payload and the live page disagree (a cached page, a fresher client fetch), the live page
   is what viewers see: use its lists and counts, and say so in the brief.
5. **Size by design width.** Lay a pane out at a phone-like CSS width (about 400 px: three icon columns) and zoom
   it to the panel; breakpoints follow the frame's 1080 px viewport, not the pane, so desktop variants apply.
6. **Undefined in a payload.** React Server Component payloads write `undefined` as the string `"$undefined"`,
   which is truthy: strip those keys when you save the data.

## Traps seen

- A helper that spreads a `transform` (a rise or fade) after your own `transform: scale(...)`
  overwrites the scale. Put them on two elements.
- **Do not recolour the kit to a palette made for the film.** A film whose cards were recoloured to the
  shorts-kit navy and cyan no longer looked like Knowns UI; the owner caught it. Keep the kit's own dark
  tokens and draw the non-kit parts (type, background) in them too.
- **Background blocks run on requestAnimationFrame** with mutable state. Redraw them per frame from the kit's
  own pure helpers instead (Node Field: `makeNodes`, `stepNodes`, `linkAlpha` from `bg-utils.ts`, one fixed
  step per frame from a fixed seed, drawn as SVG), and cache the states so frame N is the same in every render.
- Text and number components that follow a value through an effect (`NumberTicker`) keep the first value
  across frames: give them `key={value}` so each value mounts fresh.
- A `Tag` inside a narrow zoomed box truncates its label ("Deci…"): give the zoom box room for the label.
- Blocks lay out for their width: a `SetupWizard` in a narrow design width shows its stepper vertically and
  runs long. Clip it to a height with a fade, or widen the design width.
- A graph component fits its whole canvas into the frame it is given: more nodes means smaller nodes.
  A `horizontal` layout stacks a few siblings vertically and keeps the nodes large on a tall frame.
- Some components show code or JSON (a tool-call card): right for a developer audience, wrong for the
  moment a viewer is still learning what the product is for (aesthetics C3).
- Components with a real-time animation loop or a resize observer are not deterministic by default;
  treat each as unproven until the hash test passes.
- Citation chips and tooltips that need hover are never shown; do not plan a shot around them.

## Licence

Your own product's components are yours. Another vendor's kit needs its licence text and notices kept
with the copied files.

## Change log

| Date | Change | Why |
| --- | --- | --- |
| 2026-11-09 | Knowns UI is the default kit for every video; registry fetch, more components, traps (recolouring, backgrounds, ticker, tag, wizard) | owner: videos that need quality components use Knowns UI instead of new drawings; a promo first built in the kit's default look had to be redone in Knowns UI |
| 2026-11-09 | "The product's own repo" (copy, shims, NOTICE, `bun run css --dir`, live data kept locally, design width, `$undefined`) | the MacGrove ad moved from page captures to the site's own components from the owner's repo |
