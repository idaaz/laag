# LAAG Structural UI Redesign Spec

## 1. Design Brief
- Product: LAAG Discipline OS.
- Goal: fast, compact, self-explanatory interface for Tasks, Habits, Logs, Analytics, Achievements, Tracking, Settings, auth, and prototype flow.
- Baseline kept: existing data hooks, queries, XP logic, timer completion, and reminder persistence.
- Visual direction: compact cards, strong contrast, one-word actions, and visible state.
- Grid: `12` desktop columns, `6` tablet columns, `1` mobile column.
- Spacing: `12px` gutters, `16px` outer margin, `8px` vertical rhythm.
- Motion: informative only with `160ms`, `200ms`, `220ms`, and `300ms` timing tokens.

## 2. Component Spec Sheet
- `TopNav`
Purpose: app-level brand, rail controls, auth control entry.
Props: `initialEmail`, `railExpanded`, `onToggleRail`, `onToggleMobileRail`, `unreadCount`.
States: default, hover, focus-visible, collapsed rail toggle, mobile trigger.
Keyboard: toggle buttons are tab reachable and Enter/Space clickable.
ARIA: `aria-controls`, `aria-expanded`, labeled notification button.

- `SideRail`
Purpose: section navigation.
Props: `expanded`, `mobileOpen`, `onCloseMobile`.
States: desktop expanded/collapsed, mobile open/closed, active route.
Keyboard: links tab in route order; Escape closes mobile rail.
ARIA: `aria-label` on desktop and mobile rail, `aria-current="page"` on active link.

- `SectionHeader`
Purpose: section title + short subtitle + actions.
Props: `title`, `description`, `icon`, `actions`, `className`.
States: static layout with responsive action placement.
Keyboard: inherited from action controls.
ARIA: region label for section controls.

- `Card` (`AppCard` and `ui/card`)
Purpose: compact information container.
Props (`AppCard`): `title`, `hint`, `actions`, `padded`, plus div attributes.
States: default, hover elevation, focus-visible on child controls.
Keyboard: card content controls remain primary interaction targets.
ARIA: optional section semantics for grouped controls.

- `CompactListItem`
Purpose: dense row item for habits/achievements.
Props: `label`, `meta`, `icon`, `controls`, `selected`, `onClick`.
States: default, selected, hover, focus.
Keyboard: full-row button semantics.
ARIA: `aria-pressed` for selected state.

- `InlineEditor`
Purpose: inline editable single field.
Props: `value`, `label`, `onSave`, `onCancel`, `placeholder`, `disabled`.
States: idle, editing, saving, disabled.
Keyboard: Enter saves via form submit, tab order includes Save/Cancel.
ARIA: input `aria-label`, icon actions labeled Save/Cancel.

- `QuickActionBar`
Purpose: one-word high-frequency actions.
Props: `actions[]`.
Action props: `id`, `label`, `icon`, `onRun`, `disabled`, `tooltip`, `announce`.
States: idle, `160ms` press scale, `200ms` fill, disabled.
Keyboard: all actions are buttons; Enter/Space triggers.
ARIA: toolbar role and labeled action buttons.

- `FloatingActionButton`
Purpose: mobile primary action.
Props: `label`, `icon`, `onClick`, `className`, `disabled`.
States: idle, hover lift, active press, disabled.
Keyboard: full button semantics.
ARIA: explicit `aria-label`.

- `Micro-toast` (`ui/toast`)
Purpose: short success/warn/error confirmation.
API: `pushToast(title, description?)`.
States: enter, visible, timed exit.
Keyboard: non-blocking.
ARIA: `role="status"`, `aria-live="polite"`, `aria-atomic="true"`.

- `OnboardingHints`
Purpose: first-run 3-step hint strip.
Props: `storageKey`, `steps`.
States: staggered reveal, dismissed.
Keyboard: dismiss button tab reachable.
ARIA: status region labeled onboarding hints.

## 3. Annotated Wireframes
- Global Shell
Desktop: `TopNav` full width, content region split into `SideRail` + content panel.
Tablet/Mobile: rail switches to slide drawer.
Spacing: outer `16px`, all internal lanes use `12px` gap.

- Dashboard (`12` cols)
Cols `1-12`: metric strip (`4` cards, 3 cols each).
Cols `1-8`: recover card + flags panel.
Cols `9-12`: onboarding hints + timer.

- Tasks (`12` cols)
Cols `1-12`: single operations panel with filters and table list.
Mobile: FAB `New` fixed bottom-right.

- Habits (`12` cols)
Cols `1-12`: compact list item stack with inline action controls.
Dialogs: create/edit/log overlays.

- Logs (`12` cols)
Cols `1-4`: metric triplet.
Cols `1-8`: logger form panel.
Cols `9-12`: timeline panel with ghost-fill triggers.

- Analytics (`12` cols)
Row 1: XP (`1-8`) + Balance (`9-12`).
Row 2: Heat (`1-7`) + Screen/Study (`8-12`).
Row 3: Mood (`1-7`) + indices (`8-12`).

- Achievements (`12` cols)
Cols `1-8`: unlocked achievement list.
Cols `9-12`: unlock badges.

- Tracking (`12` cols)
Cols `1-12`: searchable table panel.

- Settings (`12` cols)
Row 1: extension id strip (`1-12`).
Rows 2+: paired cards in two `6`-col spans: Theme, Discipline, Lock, Export.

- Auth
Desktop split: left brand panel + right auth form panel.
Tablet/mobile stacks to one column.

## 4. Interaction + Animation Table
| Interaction | Trigger | Motion | Timing | Easing | Reduced Motion |
|---|---|---|---|---|---|
| Primary action press | Button down | scale `1 -> 0.97` | `160ms` | `var(--ease-soft)` | no scale |
| Primary action success fill | Post-press | bg/border fill | `200ms` | `var(--ease-soft)` | instant color swap |
| Micro-toast | Action success | fade + translateY | `220ms` in/out | `var(--ease-soft)` | no animation |
| SideRail mobile panel | Open/close | slide + fade | `220ms` | ease-out | instant position |
| Progress bars | Timer/prototype updates | width transition | `300ms` | linear | immediate width |
| Onboarding reveal | first-run hints | small y+opacity stagger | `220ms` each | ease-out | static reveal |
| Hover affordance | pointer hover | subtle bg/elevation | `200ms` | `var(--ease-soft)` | static |
| Focus affordance | keyboard focus | visible ring | immediate | n/a | same |

## 5. Prototype Scaffold
- Route: `/prototype`
- Component: `components/prototype/CreateStartLogPrototype.tsx`
- Flow: Create task -> Start deep work -> Log completion.
- Behavior:
`Create` sets task state + toast.
`Start` only enabled after create; announces `Pomodoro started, 25 minutes`.
`Log` only enabled after start; marks completion and updates progress.
- Accessibility:
Live region announces flow state.
Buttons and input are keyboard reachable.
Disabled states are visibly distinct.

## 6. Accessibility Notes
- Focus ring: global focus-visible ring token in `app/globals.css`.
- Keyboard first: nav, dialogs, toolbars, and action buttons are native controls.
- Live updates: micro-toast and explicit live-region messaging for timer/prototype updates.
- Motion preference: `prefers-reduced-motion` globally disables long transitions/animations.
- Contrast: semantic palette updated for AA-friendly text/background pairings.

## 7. Acceptance Checklist
- [x] All main pages use compact grid-aligned structure with `16px` outer margins and `12px` gutters.
- [x] Controls use one-word or short labels.
- [x] Motion timings implemented with reduced-motion fallback.
- [x] Keyboard path exists for nav/actions/forms.
- [x] Screen-reader status announcements added for dynamic flow states.
- [x] Prototype flow scaffold included with HTML/CSS/JS snippet and working route.
