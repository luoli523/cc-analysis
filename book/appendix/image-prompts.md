# 系列文章配图 Prompt

> 统一风格：现代科技风格的架构图/概念图，深色背景（#0d1117 或深蓝黑色），霓虹蓝/紫/青色调的发光线条和节点，扁平化设计，无照片质感，适合技术博客配图。16:9 比例。

---

## 第 01 篇：512K 行代码，一个终端里的 Agent Runtime

### IMG_01_COVER
**文件名**: `images/01-cover.png`

```
A wide cinematic illustration of a futuristic terminal interface floating in dark space. The terminal window shows glowing code streams and interconnected neural pathways inside it, symbolizing an AI agent runtime. The terminal has a subtle purple-blue glow. Around it, translucent layers orbit like shields — representing security, memory, tools, and rendering systems. Title text area at bottom. Dark background (#0d1117). Modern tech illustration style, flat design with subtle gradients and neon glow effects. No photorealism. 16:9 aspect ratio.
```

---

### IMG_01_TECH_STACK
**文件名**: `images/01-tech-stack.png`

```
A horizontal layered architecture diagram on dark background. Five distinct horizontal layers stacked vertically, each a rounded rectangle with a subtle glow border. From bottom to top: "Runtime: Bun" (cyan glow), "Language: TypeScript" (blue glow), "UI: React + Ink + Yoga" (purple glow), "Protocols: MCP + LSP" (magenta glow), "AI: Anthropic API" (warm orange glow). Each layer has a small icon on the left. Connecting lines between layers show data flow. Clean, minimal, modern tech diagram style. Dark background. 16:9.
```

---

### IMG_01_DATA_FLOW
**文件名**: `images/01-data-flow.png`

```
A technical flowchart diagram on dark background showing the Claude Code data pipeline. At top, a glowing input terminal icon labeled "User Input". An arrow flows down into a large central rounded rectangle labeled "ReAct Loop" containing five circular nodes arranged in a clockwise cycle: "Context Prep" → "Model Call" → "Tool Exec" → "Collect" → "Decide". The cycle has glowing animated arrows between nodes. Below the main loop, a smaller box labeled "Ink Renderer" with sub-labels "React → Yoga → ANSI". On the right side of the main loop, a vertical cascade of 7 small shield icons labeled "L1-L7 Recovery". Modern flat tech diagram, neon blue and purple accents on dark background. 16:9.
```

---

### IMG_01_SEVEN_LAYER_RECOVERY
**文件名**: `images/01-seven-layer-recovery.png`

```
A vertical waterfall/cascade diagram on dark background showing 7 recovery layers. Seven horizontal bars descending like a staircase from left to right, each progressively deeper in color intensity from light cyan to deep purple. Each bar is labeled: L1 "Autocompact 80%" (lightest), L2 "Snip", L3 "Microcompact", L4 "Context Collapse", L5 "Reactive Compact", L6 "Token 8K→64K", L7 "Multi-turn Recovery" (deepest/most intense glow). Arrows connect each layer to the next, suggesting fallthrough. A small red "413 Error" spark triggers L4-L5. A small orange "Truncated" spark triggers L6-L7. Clean minimal style, dark background, neon glow effects. 16:9.
```

---

### IMG_01_MEMORY_LAYERS
**文件名**: `images/01-memory-layers.png`

```
A pyramid/stack diagram on dark background showing 5 memory layers. Five horizontal slabs stacked from bottom (widest) to top (narrowest), like a layered cake or geological strata. Bottom layer (widest, cyan): "Short-term: Session Messages" with a clock icon showing milliseconds. Second layer (blue): "Working: Task States" with a gear icon. Third layer (purple): "Long-term: Memory Directory" with a folder icon and "4 types" annotation. Fourth layer (magenta): "Summary: AI Digest" with a document icon. Top layer (narrowest, warm gold): "Checkpoint: Session Persistence" with a save/disk icon. A vertical timeline arrow on the left goes from "milliseconds" at bottom to "permanent" at top. Modern tech illustration, dark background, subtle glow. 16:9.
```

---

### IMG_01_SECURITY_LAYERS
**文件名**: `images/01-security-layers.png`

```
A concentric circles / fortress rings diagram on dark background. Six concentric rings viewed from above, like a target or fortress blueprint. Innermost ring (brightest, red-orange glow): "Sandbox" with a lock icon. Second ring (orange): "Permission Mode". Third ring (yellow): "Rule Matching (8 sources)". Fourth ring (green): "Command Validation (23 checks)". Fifth ring (cyan): "Path Verification". Outermost ring (blue): "Content Detection". An arrow labeled "Tool Call" pierces through all rings from outside to inside. Each ring has small shield icons. The overall feeling is of layered defense. Dark background, neon glow style. 16:9.
```

---

### IMG_01_MULTI_AGENT
**文件名**: `images/01-multi-agent.png`

```
A hub-and-spoke diagram on dark background showing multi-agent orchestration. Center: a large glowing hexagonal node labeled "Coordinator" with a crown/star icon. Three spokes radiate outward to three different agent types, each in a distinct color: Top-right (cyan): "Sub-Agent" with a Git branch icon inside a dashed worktree boundary. Bottom (purple): "In-Process Teammate" with a shared-memory icon showing overlapping circles. Top-left (magenta): "Remote Agent" with a cloud/network icon. Between the coordinator and agents, bidirectional arrows labeled "SendMessage" and "task-notification". A small folder icon labeled "Scratchpad" sits between the agents showing shared knowledge. Modern flat tech diagram, dark background, neon accents. 16:9.
```

---

### IMG_01_NO_INDEX
**文件名**: `images/01-no-index-philosophy.png`

```
A split-screen comparison illustration on dark background. Left side (grayed out, dimmer): traditional code indexing approach — icons for "Embedding DB", "AST Parser", "Code Graph", "Symbol Table" connected by complex tangled lines, labeled "Traditional: Index First, Query Later". Right side (bright, vibrant neon glow): Claude Code's approach — a single magnifying glass icon labeled "Grep/Glob" pointing directly at a file tree, with a brain icon (LLM) above it, connected by a simple straight arrow, labeled "Claude Code: Search Live, Reason Direct". A large "VS" divider in the center. The right side is clearly presented as the chosen path (brighter, cleaner). Dark background, modern minimal tech style. 16:9.
```

---

## 第 02 篇：ReAct 循环（待写）

### IMG_02_COVER
**文件名**: `images/02-cover.png`

```
A dramatic close-up illustration of a glowing mechanical heart made of circuit board traces and code streams, beating with rhythmic pulse waves radiating outward. The heart shape is formed by a circular loop arrow (representing while(true)), with five chambers/segments glowing in sequence: cyan, blue, purple, magenta, gold — representing the 5 phases. Each pulse sends ripples of light outward. Dark space background with subtle grid lines. Modern tech illustration, neon glow, no photorealism. 16:9.
```

### IMG_02_FIVE_PHASES
**文件名**: `images/02-five-phases.png`

```
A circular flow diagram on dark background showing the 5 phases of the ReAct loop. Five large circular nodes arranged in a pentagon/circle, connected by thick glowing arrows in clockwise direction. Phase 1 "Context Prep" (cyan, scissors icon) → Phase 2 "Model Streaming" (blue, wave/stream icon) → Phase 3 "Tool Execution" (purple, wrench icon running parallel lines) → Phase 4 "Attachment Collection" (magenta, paperclip icon) → Phase 5 "Continue or Stop?" (gold, diamond decision icon). In the center, text "while(true)" in monospace font with a subtle rotating glow. The arrow from Phase 3 has a special "parallel" indicator showing streaming execution. Dark background, neon circuit style. 16:9.
```

### IMG_02_STREAMING_EXECUTOR
**文件名**: `images/02-streaming-executor.png`

```
A timeline/Gantt chart style diagram on dark background showing streaming tool execution. Horizontal timeline at top. A blue stream bar labeled "Model Output (streaming)" runs across the full width. Below it, as the model outputs tool_use blocks (marked as small blue diamonds on the stream), tool execution bars begin immediately — "Tool A" (green bar starts at diamond 1), "Tool B" (cyan bar starts at diamond 2, runs parallel to A), "Tool C" (purple bar starts at diamond 3). Some bars overlap showing concurrent execution. A label "isConcurrencySafe: true" points to the overlapping bars. At the right end, a "yield results" collection point. Contrast with a grayed-out "Sequential (naive)" row at bottom showing tools running one after another. Dark background, clean technical diagram. 16:9.
```

### IMG_02_RECOVERY_CASCADE
**文件名**: `images/02-recovery-cascade.png`

```
A detailed decision tree / flowchart on dark background showing the 7-layer recovery mechanism. Starting from top-left with "API Error" node (red glow). Branches split by error type: "413 Prompt Too Long" goes right through L4 "Context Collapse" → if failed → L5 "Reactive Compact" → if failed → "Surface Error". "Max Output Tokens" goes down through L6 "8K→64K Escalate" → if still truncated → L7 "Recovery Message (x3)" → if exhausted → "Surface Error". Proactive layers L1-L3 shown as a pre-check stage before the API call. Each node has a small colored indicator (green=success, red=fail). Success paths loop back to "Retry" which returns to the main loop. Clean flowchart style with rounded rectangles and diamond decisions, neon accents on dark background. 16:9.
```

---

## 第 03 篇：Prompt 缓存分割与四级压缩（待写）

### IMG_03_COVER
**文件名**: `images/03-cover.png`

```
An illustration of a large glowing document being compressed through a funnel-like mechanism. The document at top is wide and bright (full context). It passes through four increasingly narrow filter stages, each a glowing ring: cyan "Snip", blue "Microcompact", purple "Autocompact", red "Reactive Compact". At the bottom, a compact, dense glowing core emerges — smaller but preserving key patterns visible as bright spots. Token cost counters decrease at each stage. Dark background with subtle dollar signs fading in the background representing cost savings. Modern tech illustration. 16:9.
```

### IMG_03_CACHE_SPLIT
**文件名**: `images/03-cache-split.png`

```
A horizontal bar diagram on dark background showing prompt cache splitting strategy. A long horizontal bar representing the full system prompt. The left portion (larger, ~70%) glows with a solid steady blue and is labeled "Static (Cached)" with sub-labels: "Identity", "Guidelines", "Tool Schemas". A cache icon (snowflake) marks it. The right portion (~30%) pulses with animated magenta and is labeled "Dynamic (Uncached)" with sub-labels: "Memory", "Git Status", "Environment". A "cache_control: ephemeral" tag marks the boundary. Above the bar, a "Cache Hit Rate" meter showing high percentage. Below, cost comparison: cached section shows "$" (cheap), dynamic shows "$$$" (expensive). Clean technical diagram, dark background. 16:9.
```

### IMG_03_FOUR_LEVELS
**文件名**: `images/03-four-levels.png`

```
Four horizontal panels stacked vertically on dark background, each showing a compression level with before/after. Level 1 "Snip" (cyan): conversation timeline with old messages fading/cutting off, recent messages bright. Level 2 "Microcompact" (blue): tool result blocks shrinking while preserving cache markers. Level 3 "Autocompact" (purple): entire conversation collapsing into a structured 9-section summary document with glowing section headers. Level 4 "Reactive Compact" (red, with "413" error badge): emergency full compression with a "smart recovery" arrow showing key files being restored. Each level has a token count indicator decreasing. Modern infographic style, dark background. 16:9.
```

---

## 第 04 篇：Tool System 设计（待写）

### IMG_04_COVER
**文件名**: `images/04-cover.png`

```
An illustration of 50 glowing tool icons arranged in a honeycomb grid pattern, each hexagon containing a distinct tool symbol (terminal, file, search, globe, agent figure, etc.). All hexagons connect to a central bright core labeled "Tool<I,O,P>" representing the unified type contract. Some hexagons have lock icons (permission-gated), some have eye icons (read-only). A few hexagons at the edges are dimmed with "deferred" labels. The overall shape suggests a modular, pluggable architecture. Dark background with subtle circuit traces connecting hexagons. 16:9.
```

### IMG_04_TOOL_PIPELINE
**文件名**: `images/04-tool-pipeline.png`

```
A horizontal pipeline/funnel diagram on dark background showing the tool filtering chain. Starting from left with a large group of 50 tool icons labeled "getAllBaseTools()". Arrow passes through Filter 1 "Feature Flags (DCE)" — some tools disappear. Then Filter 2 "filterToolsByDenyRules()" — more removed. Then Filter 3 "getTools(permContext)" — mode-based filtering. Then Filter 4 "assembleToolPool()" — MCP tools merge in from a side input. Final output: a sorted, deduplicated tool list labeled "Ready for API". A "sort by name → cache stability" annotation on the final output. Clean flow diagram with neon accents. 16:9.
```

### IMG_04_TOOL_ANATOMY
**文件名**: `images/04-tool-anatomy.png`

```
An exploded/blueprint diagram of a single tool module on dark background. A central rounded rectangle labeled "BashTool/" with six component layers pulled apart like an exploded mechanical drawing: top-left "BashTool.tsx" (execution logic, gear icon), top-right "prompt.ts" (model instructions, document icon), middle-left "UI.tsx" (React component, screen icon), middle-right "inputSchema" (Zod schema, bracket icon), bottom-left "bashSecurity.ts" (security checks, shield icon), bottom-right "bashPermissions.ts" (permission rules, lock icon). Connecting lines show how they plug into the central Tool<I,O,P> interface. Labels for each: "call()", "description()", "renderToolUseMessage()", "checkPermissions()". Dark background, blueprint style with neon cyan lines. 16:9.
```

---

## 第 05 篇：五层记忆体系（待写）

### IMG_05_COVER
**文件名**: `images/05-cover.png`

```
An illustration of a glowing brain made of layered translucent shells on dark background. Five concentric shells from inner to outer: innermost (bright, fast pulse) = short-term memory, second = working memory with gear icons, third = long-term memory with file/folder icons, fourth = summary memory with document condensation effect, outermost (solid, stable glow) = checkpoint/persistence with a save icon. The brain sits above a terminal window. Neural pathway lines connect the layers. Time scale labels on the right: "ms", "minutes", "days", "sessions", "permanent". Modern sci-fi illustration, dark background. 16:9.
```

### IMG_05_LONG_TERM_RETRIEVAL
**文件名**: `images/05-long-term-retrieval.png`

```
A diagram on dark background showing LLM-based memory retrieval. Left side: a grid of small markdown file icons in a folder labeled "~/.claude/memory/", each with a tiny label (filename + one-line description). An arrow labeled "manifest (names + descriptions)" goes to center: a large brain/LLM icon labeled "Sonnet" with a thought bubble "Which 5 are most relevant?". From the brain, 5 arrows point to 5 highlighted file icons (glowing brighter than others) labeled "Top-5 selected". A crossed-out embedding/vector-DB icon in the corner with "No Embedding DB needed" label. Clean technical diagram showing the simplicity of the approach. Dark background, neon accents. 16:9.
```

---

## 第 06 篇：安全纵深防御（待写）

### IMG_06_COVER
**文件名**: `images/06-cover.png`

```
A dramatic fortress cross-section illustration on dark background. Six concentric defensive walls/rings viewed in isometric perspective, each wall a different color from outer to inner: blue, cyan, green, yellow, orange, red. Small shield icons and scanning beams line each wall. A command "rm -rf /" in red text approaches from outside and gets blocked/shattered at the first wall. Fragments of increasingly sophisticated attacks try to penetrate deeper walls but all get stopped. At the very center, a protected terminal icon glows safely. Labels for each wall visible. Dark cinematic atmosphere with neon security scan effects. 16:9.
```

### IMG_06_BASH_PARSER
**文件名**: `images/06-bash-parser.png`

```
A technical diagram on dark background showing the pure TypeScript Bash parser pipeline. Left: raw bash command string "git commit -m 'fix' && curl evil.com" in a terminal box. Center: a parser box labeled "TS Bash Parser (130KB)" with two constraint badges: "50ms timeout" (clock icon) and "50K nodes max" (counter icon). The parser produces an AST tree visualization (nodes and branches) in the middle. Right: 23 security check modules as a checklist grid, each with a pass/fail indicator. Three checks are red (failed): "Command Substitution", "Shell Metacharacters", "Dangerous Patterns". Output: "BLOCKED" in red. Clean technical flow diagram, dark background. 16:9.
```

---

## 第 07 篇：投机执行与状态管理（待写）

### IMG_07_COVER
**文件名**: `images/07-cover.png`

```
A split illustration on dark background. Left half: a semi-transparent ghost/overlay of a file being edited — representing speculative execution happening in a shadow filesystem. The overlay has a dotted border and "Overlay FS" label. Right half: the real filesystem with solid borders. An arrow from overlay to real labeled "User confirms ✓" (green) shows files materializing. Another arrow from overlay to a trash can labeled "User rejects ✗" (red) shows instant cleanup. A stopwatch icon shows "0ms perceived latency". Modern tech illustration with transparency effects, dark background. 16:9.
```

### IMG_07_SPECULATION_FLOW
**文件名**: `images/07-speculation-flow.png`

```
A sequence diagram on dark background showing the speculative execution flow. Three swim lanes: "Main Thread", "Speculation Agent (Overlay)", "User". Main Thread sends suggestion to Overlay. Overlay starts executing tools in overlay filesystem (writing files shown as ghost icons). Meanwhile, User sees the suggestion prompt. Two paths branch: Path A (green, "Accept"): overlay files copied to real cwd, transcript updated, timeSavedMs logged. Path B (red, "Reject"): overlay deleted, state reset to idle, no trace left. A timeline at bottom shows that tool execution happens DURING user decision time — that's the latency hiding. Clean sequence diagram style with neon accents. 16:9.
```

---

## 第 08 篇：多 Agent 编排（待写）

### IMG_08_COVER
**文件名**: `images/08-cover.png`

```
An orbital diagram on dark background showing multi-agent orchestration. A central large planet/sphere labeled "Coordinator" with a command center aesthetic. Three different types of satellites orbit it: blue satellites "Sub-Agents" in isolated bubbles (Git Worktree shells), purple satellites "In-Process Teammates" sharing an atmosphere ring, magenta distant satellites "Remote Agents" connected by long-range beams. Communication lines (SendMessage) pulse between all entities. A shared folder icon "Scratchpad" floats in the orbital plane. Task notification XML tags float as data packets between satellites and the central planet. Cosmic tech illustration, dark space background with neon orbital paths. 16:9.
```

### IMG_08_COORDINATOR_ROLES
**文件名**: `images/08-coordinator-roles.png`

```
A organizational chart / role diagram on dark background. Top: "Coordinator" node (gold crown icon). Below it, four worker role cards arranged horizontally: "General Purpose" (blue, Swiss army knife icon) — "research, explore, execute". "Explore Agent" (cyan, magnifying glass icon, "READ-ONLY" badge) — "find files, search patterns". "Plan Agent" (purple, blueprint icon, "READ-ONLY" badge) — "design strategy, identify files". "Verification Agent" (red, target/crosshair icon, "ADVERSARIAL" badge) — "find bugs, break assumptions". Each card lists its allowed/denied tools. Arrows from Coordinator to each role. Clean card-based layout, dark background, neon borders. 16:9.
```

---

## 第 09 篇：自定义 Ink 渲染引擎（待写）

### IMG_09_COVER
**文件名**: `images/09-cover.png`

```
A dramatic cross-section illustration of the terminal rendering pipeline on dark background. A React component tree (JSX elements as glowing nodes) at top flows down through labeled transformation stages: "React Reconciler" → virtual DOM tree, "Yoga Layout" → positioned boxes with measurements, "renderNodeToOutput" → operation queue (write/blit/shift icons), "Screen Buffer" → 2D cell grid with colored cells, "Diff Engine" → minimal ANSI patches, "stdout" → a terminal screen at the bottom showing formatted text with syntax highlighting. Each stage is a horizontal band with distinct color. Arrows flow vertically downward. Modern tech blueprint style. 16:9.
```

### IMG_09_INCREMENTAL_RENDER
**文件名**: `images/09-incremental-render.png`

```
A before-after comparison diagram on dark background showing incremental rendering. Left: "Previous Frame" — a terminal screen buffer grid with cells. Right: "Next Frame" — same grid with a few cells changed (highlighted in yellow). Center: the diff process — only changed cells are transmitted (shown as small colored patches flying from left to right). Unchanged regions have a "BLIT" label (copied directly). A DECSTBM scroll region is shown with hardware scroll arrows. Performance badge: "~60fps, minimal ANSI output". Cell structure detail in corner: { char, width, styleId, hyperlinkId }. Clean technical diagram, dark background. 16:9.
```

---

## 第 10 篇：Bridge 与协议层（待写）

### IMG_10_COVER
**文件名**: `images/10-cover.png`

```
An illustration on dark background showing the Bridge system connecting multiple platforms. Center: a glowing bridge/gateway structure labeled "Bridge System". Connected to it via glowing cables: left — a terminal window "CLI", top — VS Code icon "IDE Extension", right — a browser window "Web (claude.ai)", bottom — a phone icon "Mobile". The bridge internally shows WebSocket and HTTP protocol symbols. JWT token icons rotate around the bridge. A "v1/v2 Transport" toggle switch on the bridge. All connections are bidirectional with data packets flowing. Dark background, network topology style with neon connections. 16:9.
```

---

## 第 11 篇：Skill / Plugin / Hook 扩展体系（待写）

### IMG_11_COVER
**文件名**: `images/11-cover.png`

```
A spectrum/gradient bar diagram on dark background showing the three extension layers as a continuum from declarative to imperative. Left end (warm gold, "Declarative"): "Skills" — represented as prompt cards/templates with frontmatter headers, 6 source icons below. Center (purple, "Compositional"): "Plugins" — represented as packaged modules with install/update lifecycle icons. Right end (cyan, "Imperative"): "Hooks" — represented as event triggers with lightning bolt icons, "6 types × 24 events" label. A gradient bar connects all three, showing the spectrum. Below each: example use case in small text. Clean modern infographic, dark background. 16:9.
```

---

## 第 12 篇：总结 — 10 个 Agent 工程模式（待写）

### IMG_12_COVER
**文件名**: `images/12-cover.png`

```
A reference card / cheat sheet style illustration on dark background. A large card with rounded corners containing a 2×5 grid of 10 pattern icons, each a small square with a distinct symbol and short label: 1. Loop (circular arrow), 2. Cache Split (split bar), 3. 4-Level Compress (funnel), 4. Fail-Closed (locked lock), 5. 5-Layer Memory (pyramid), 6. Speculative Exec (ghost file), 7. Defense-in-Depth (concentric rings), 8. Transport Abstract (plug/socket), 9. Intern Pool (grid cells), 10. Extension Spectrum (gradient bar). Title at top: "10 Agent Engineering Patterns". Subtitle: "from Claude Code". Clean reference card design, dark background with subtle glow. 16:9.
```
