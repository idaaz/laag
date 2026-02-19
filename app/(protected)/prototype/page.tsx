"use client";

import { FlaskConical } from "lucide-react";
import { CreateStartLogPrototype } from "@/components/prototype/CreateStartLogPrototype";
import { PageFrame } from "@/components/structure/PageFrame";
import { SectionHeader } from "@/components/structure/SectionHeader";

const scaffold = `<!-- HTML -->
<main class="flow">
  <input aria-label="Task name" />
  <button>Create</button>
  <button>Start</button>
  <button>Log</button>
  <div role="progressbar"></div>
  <p aria-live="polite" class="sr-only"></p>
</main>

/* CSS */
.flow { display:grid; gap:12px; }
button:active { transform:scale(.97); transition:160ms; }
.progress { transition:width 300ms linear; }
@media (prefers-reduced-motion: reduce) { * { transition:none; } }

// JS
create.onclick = () => toast("Create");
start.onclick = () => announce("Pomodoro started, 25 minutes");
log.onclick = () => toast("Log");`;

export default function PrototypePage() {
  return (
    <PageFrame
      header={
        <SectionHeader
          title="Prototype"
          description="Create, start, log flow scaffold."
          icon={<FlaskConical className="h-5 w-5" />}
        />
      }
    >
      <div className="col-span-full lg:col-span-6">
        <CreateStartLogPrototype />
      </div>
      <div className="col-span-full lg:col-span-6 rounded-xl border border-border/80 bg-card/85 p-3">
        <h2 className="text-sm font-semibold mb-2">HTML/CSS/JS Scaffold</h2>
        <pre className="text-xs overflow-auto whitespace-pre-wrap leading-5">
          <code>{scaffold}</code>
        </pre>
      </div>
    </PageFrame>
  );
}
