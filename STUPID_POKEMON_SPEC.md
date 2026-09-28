
# The Stupidest Pokémon Ever — Design Spec

Source: `The Stupidest Pokémon Ever - Google Gemini.pdf` (298 pages, exported 9/6/2026), a single continuous Gemini chat in which the user brainstorms deliberately game-breaking custom Pokémon, abilities, moves, and an entire custom metagame. This document reconstructs the full design history in one place, noting where later turns revised or replaced earlier decisions.

**Important scope note:** This PDF's content (the "Stupid" trio, the corporate/pop-culture roster, "Pokémon Rose Gold") is a *separate, self-contained personal project* from the upstream-style formats already in this repo's `config/formats.ts` (`[Gen 9 Champions]`, `National Dex 35 Pokes`, the `Artemis` mod, ZUBL, etc.). Nothing in this PDF mentions those formats. The only overlap with the actual `StupidShowdown` codebase is four of the custom species currently in `data/pokedex.ts` — Nahida, Vergil, Jetstream Sam, Nilou — which appear here in much more elaborate conceptual form than their current (simple, single-ability, flat-100-stat) implementation. See "Implementation Notes" and "Open Questions" at the bottom.

---

## Overview / Concept

The chat starts as a joke: "let's build the most stupid pokemon ever" by stacking as many broken abilities as possible onto one Pokémon via a custom `As One`-style combined ability, then running the damage math to absurd, physics-breaking extremes (comedic tone throughout — Gemini plays along with mock-serious "Smogon tier list" and "patch notes" framing, LinkedIn-layoff jokes for legendaries who get power-crept, "war crime" / "warcrime_super_soldiers" folder framing, etc.).

This escalates through several phases:
1. **Mega Scizor "Rose Gold"** — a single mon stacked with 20+ abilities, conceived as a hidden postgame Easter-egg superboss for the user's GBA ROM hack **Pokémon Rose Gold** (built on `pokeemerald-expansion`).
2. **A friend's parallel project**, **Dracannon** (an F-22 Raptor–themed Steel/Dragon/"Fairy" fakemon), leading to head-to-head battle-math comparisons between the two.
3. **Mega Diancie "Volcano Obsidian"** and **Mega Gallade "Sky Thief"** get the same treatment, forming a trio ("the Stupid trio" / "the Hoenn Trio" homage to Kyogre/Groudon/Rayquaza) that the user decides to keep as a permanent hard-drive vault of "irradiated kryptonian viltrumite warcrime super soldiers" rather than put in Rose Gold.
4. The trio gets ported to the idea of a **Pokémon Showdown custom server**, then a **custom VGC "Restricted" format** ("[VGC 2026] The Unholy Trinity") where standard box-art Ubers are ordinary fodder and the trio are the only "Restricted" (1-per-team) slots.
5. This snowballs into a full **custom metagame ("the 'Stupid' tier")** with a large supporting roster of non-restricted custom "mons" — many of them jokes based on real-world brands/products (Microsoft Azure, AWS, Flex Seal, Ibuprofen, Vicks VapoRub, Hitachi power tools, Darude) and pop-culture crossover characters (Devil May Cry, Metal Gear Rising, Team Fortress 2, Genshin Impact, Ultrakill, Ninjago, BTD6, Zenless Zone Zero, Hermitcraft/Minecraft).
6. The back half of the document is largely **theorycrafting the resulting metagame**: an arms race between a "Terminal Stall" defensive core and the "Stupid trio" as the only reliable wallbreakers, culminating in a self-aware discussion of why the format works ("it's a rock-paper-scissors of nuclear warheads") and a final capstone unit (Grian) designed to feel like "everything wrong with the game."

Tone: constant, deliberate absurdist escalation — Gemini narrates each addition as apocalyptic ("you didn't just build a Pokémon, you built a war crime"), and the user periodically injects real competitive-mechanics knowledge (priority brackets, crit mechanics, weather-override rules, Fortemons) to make the escalation *mechanically consistent* rather than just hand-waved.

---

## The "Stupid" Trio (the Restricted "Kings")

All three eventually share a large baseline of abilities (see "Shared Trio Traits" below) on top of individual signature kits. They are explicitly framed as a Kyogre/Groudon/Rayquaza pastiche, with Gallade as the Rayquaza-equivalent apex (see "Format & Metagame Design").

### 1. Mega Scizor — "Rose Gold" / "Torrential Scizor" / "Scizor-Stupid"

- **Source/Inspiration:** Started as a joke about Mega Scizor's real ability, As One (Calyrex) being wasted on "Unnerve"; built as the opposite extreme.
- **Typing:** Bug/Steel (unchanged from canon).
- **Base stats:** Deliberately kept at **standard Mega Scizor stats** (BST 500: HP 70 / Atk 130 / Def 100 / SpA 55 / SpD 80 / Spe 65) — the joke is that a perfectly normal-looking stat screen hides a completely broken ability stack. Confirmed and never changed later in the doc.
- **Cosmetic gimmick:** Shell recolored "light orangey-pink" (rose gold); flavor name "Rose Gold" / "good as (rose) gold."
- **Mega item:** Custom mega stone, the **Rosegoldite** (in the ROM-hack framing) / kept as `Scizorite` in the early Showdown framing before being renamed.
- **Ability (combined "As One" mega ability), final/cumulative list:**
  Technician, Iron Fist, Regenerator, Primordial Sea, Water Bubble, Steelworker, Steely Spirit, **Teravolt** (final choice; Turboblaze was the original pick "for the comedy," swapped to Teravolt once the trio's Reshiram/Zekrom-signature split was formalized as Scizor=Teravolt / Diancie=Turboblaze), Tinted Lens, Skill Link, Sniper, Air Lock, Adaptability, Tough Claws, Rain Dish, Swift Swim, Magic Guard, Serene Grace, Well-Baked Body, Sturdy, Filter, Fur Coat, Ice Scales, Solid Rock, Stamina, Pressure. Plus the final shared-trio additions: Tough Claws (dup, already listed), Supreme Overlord, No Guard, **Magic Bounce** (added on the very last page, applied to all three retroactively), **Cataclysm** (shared, see below).
- **Held item:** Rosegoldite/Scizorite (mega stone); Life Orb viable once Magic Guard removes recoil.
- **Signature move: Scizor Shock.**
  - *v1 (page 129):* physical Electro Shot clone (Electric) that boosts Attack instead of Special Attack, with a charge turn skipped in rain.
  - *v2/FINAL (page 172, explicit user correction — supersedes v1):* Electric, 20 BP, hits **10 times** like Population Bomb, has a charge turn that grants **+1 Attack**, and the charge turn is **bypassed in rain** (i.e., resolves instantly under Primordial Sea/Rain Dance). Each of the 10 hits is ≤60 BP so it also triggers Technician.
- **Other signature-adjacent moves used in calcs:** Jet Punch, Bullet Punch, Double Iron Bash (confirmed to actually be flagged as a punching move in-game, which the user caught), Flip Turn, Surging Strikes, Pin Missile.
- **Role in weather war:** Because his *unmodified* base Speed (75) is lower than Diancie's (110) and Groudon-Primal's (90)/etc., Scizor's Primordial Sea usually resolves *last* and overwrites opposing weather — a deliberate mechanical point the user made (slower Primal-weather user wins the weather war on simultaneous entry). Swift Swim then doubles his effective Speed to 704 in his own rain.
- **Weakness/counterplay explicitly identified:** Volcanion (Water Absorb + Steel resist) is the original hard-counter before Turboblaze/Teravolt were added to bypass ability-based answers; Primal Groudon's Desolate Land evaporating his rain is the second identified counter (solved via Air Lock/Cloud Nine, then made moot once Primordial Sea's "already-active Primal weather can't be overwritten by a later Primal weather while the original setter is still in" rule was clarified). Rocky Helmet/contact punishers are identified as a real-competitive-mechanics counter to his 10-hit Scizor Shock — then immediately voided because he has Magic Guard.

### 2. Mega Diancie — "Volcano Obsidian" / "Diancie-Stupid" (a.k.a. internal codename `SPECIES_DIANCIE_WARCRIME_V2`)

- **Source/Inspiration:** Built to fix Diancie's two glaring weaknesses (Water 2×, Steel 4×) by inverting them into healing triggers, then escalated the same way as Scizor.
- **Typing:** Rock/Fairy (unchanged).
- **Base stats — went through several revisions, FINAL state:**
  - HP **270** (given by moving her Attack and Special Attack down to 50/50 and dumping the 220 saved points into HP)
  - Attack **50**, Special Attack **50** (deliberately gutted — she doesn't need them, see Fortemons below)
  - Defense **160**, Special Defense **160** (kept at Mega-Diancie-defense-plus, explicitly *not* taking the canon Mega Diancie defensive stat cut)
  - Speed **110** (irrelevant thanks to Prankster/priority tools)
  - *(Earlier discarded intermediate states: kept canon Mega stats; then Def/SpD raised to 150/150 with Atk/SpA still 160/160 — both superseded by the final 50/50/160/160/270HP spread.)*
- **Held item — signature mechanic: "Red Orb Diancite Alloy."** Her mega stone doubles as her offense engine: it grants the **Fortemons** (a real Other Metagame ruleset) effect of "holding" the move **Body Press**, meaning *all* her attacking moves — physical **and** special — calculate damage off her **Defense** stat instead of Attack/SpAtk. This is why gutting her Atk/SpA to 50 doesn't matter and why "mixed Diancie" becomes viable (her V-create, Blue Flare, Sandsear Storm, etc. all scale off Defense).
- **Ability (combined "As One"), final/cumulative list:** Misty Surge, Prankster, Nature Power (interaction, not innate ability — see moves), Fairy Aura, Desolate Land, **Metal Muncher** (custom ability, see Custom Abilities), Earth Eater, Solid Rock, Rocky Payload, Pixilate, Solar Power, Magic Guard, Dazzling **and** Queenly Majesty (both, deliberately redundant "so the immunity message procs twice" — a pure comedy pick), **Turboblaze** (final; ignores opposing defensive abilities incl. Flash Fire, Sturdy, Metal Muncher-style absorbers), Sniper, Mega Launcher, Punk Rock, Adaptability, Chlorophyll, Rock Head, Clear Body, Good as Gold, Shield Dust, No Guard, Tough Claws, Supreme Overlord, **Thermal Core** (custom, see Custom Abilities), **Pixie Engine** (custom, see Custom Abilities), Sturdy, Magic Bounce (final page, shared), Cataclysm (shared).
- **Signature move: Diancie Blast.**
  - Type: Rock. Base Power: **120**.
  - Mechanically: copies **Meteor Beam**'s "charge turn grants a self-boost, then fires" structure, but copies **Solar Beam**'s rule that the charge turn is skipped instantly under harsh sunlight (works automatically thanks to her own Desolate Land).
  - Charge-turn boost: **originally +1 Special Attack** (page 64); **changed to +1 Defense** (page 72, explicit revision) once the Fortemons/Body Press item effect was added, so the self-boost directly feeds her Defense-scaled offense.
  - On-hit rider: copies **Diamond Storm**'s 50% chance to grant an *additional* +2 Defense.
  - **Priority correction (page 90, explicit user correction — supersedes earlier framing that implied Diancie Blast was priority via Prankster):** Diancie Blast itself is **not** a priority move. Diancie's actual priority options are: Prankster + **Nature Power** (which, under her own Misty Terrain, transforms into Moonblast, giving a de facto +1 priority Fairy STAB), **Pixilate Extreme Speed** (+2 priority, converted to Fairy), and **Accelerock** (+1 priority, Rock STAB).
- **Other moves used in the build (all scale off Defense via Fortemons):** V-create, Blue Flare, Sandsear Storm, Light of Ruin, Mind Blown, Chloroblast, Boomburst (converted to Fairy via Pixilate, further boosted by Punk Rock/Misty Terrain/Fairy Aura/Pixie Engine — the single highest damage output calculated in the whole document, ~3,000+ effective BP), Eruption.
- **Notable mechanic:** Because she has **Magic Guard**, her self-damage/recoil moves (Mind Blown's 50% max-HP cost, Chloroblast's 50% cost, Light of Ruin's 50% recoil, Life Orb recoil) are all fully negated — described as the "forbidden interaction" of the whole build.
- **Role in weather war:** Naturally faster (Speed 110) than Scizor's base 75, so on *simultaneous* entry her Desolate Land wins first — but Scizor's Primordial Sea, being the *slower* entrant, then **overwrites** hers per the weather-priority rule established for Scizor. This is why Diancie's kit was given Turboblaze/immunities rather than relying on keeping her own weather up against Scizor.
- **Explicitly identified matchup lore:** loses to Scizor's Jet Punch/Teravolt in most scenarios (Jet Punch OHKOs her under rain before she can act) unless she wins the priority race with Pixilate Extreme Speed; wins clean against everything else (Rayquaza, Primal Groudon, hypothetical max-investment Blissey with a fictional 4x resistance to her whole kit, etc.) via her spread nukes.

### 3. Mega Gallade — "Sky Thief" / "Project Sky Eater" / "Gallade-Stupid" (a.k.a. `Project Ragnarok Sky Eater` in one joke aside)

- **Source/Inspiration:** Started from the complaint that Mega Gallade (visually built around giant elbow blades) never got **Sharpness** and instead has the near-useless Inner Focus. Explicitly built to *dethrone Mega Rayquaza* as apex predator ("Sky Thief" steals Rayquaza's sky, Lugia's storm, Zekrom's lightning, Palkia's space).
- **Typing:** Psychic/Fighting (unchanged).
- **Base stats — "stat theft from Mega Gardevoir," FINAL:**
  - HP **68** (unchanged)
  - Attack **165** (unchanged, his natural strength)
  - Defense **115** (his old Special Defense value, 115, moved here)
  - Special Attack **165** ("stolen" wholesale from Mega Gardevoir's 165)
  - Special Defense **135** ("stolen" from Mega Gardevoir's 135)
  - Speed **110** (unchanged)
  - Net effect: turns Gallade into a fully mixed 165/165 attacker.
- **Held item — signature mechanic: "The Galladite of Overdosing."** His mega stone functions as a self-inflicted, permanent **Toxic Orb** — he badly poisons himself the moment he Mega Evolves.
- **Ability (combined "As One"), final/cumulative list, organized by the doc's own "core" groupings:**
  - *Atmospheric Core:* Levitate, Wind Rider, Wind Power, **Gamma Stream** (custom signature ability, see Custom Abilities).
  - *Chemical Adrenaline Core (enabled by the Toxic Orb mega stone):* Guts, Quick Feet, Toxic Boost, Marvel Scale, Poison Heal, (Flare Boost was tried and then explicitly *removed*, replaced by Thermal Exchange + Flash Fire, see below).
  - *Combat Mechanics Core:* Sharpness, Aerilate, Sniper, No Guard, Triage, Adaptability, Tough Claws, Gale Wings.
  - *Legendary Utility Core:* **Mold Breaker** (his personal ability-bypass flag — the trio's split is Scizor=Teravolt, Diancie=Turboblaze, Gallade=Mold Breaker), Pressure ("purely because the other two 'jits' [legendary dragon signatures] have theirs — pure flavor, functionally negligible given how fast fights end"), Flash Fire, Thermal Exchange, Dragon's Maw, **Steam Blaster** (custom, see Custom Abilities — belongs to Gallade only, not Diancie; this was explicitly corrected mid-document after Gemini misattributed it), pre-nerf **Protean** (see below), Supreme Overlord, Magic Guard, Tough Claws (dup), Sturdy, Magic Bounce (final page), Cataclysm (shared).
  - Also explicitly given: **every slicing move** in the game (huge coverage via Sharpness) — Kowtow Cleave/Night Slash, Sacred Sword, Leaf Blade, Aqua Cutter, Stone Axe, X-Scissor, Bitter Blade, and **Spacial Rend** (which the user pointed out is *not* on Bulbapedia's official "slicing moves" list despite its animation clearly being a Judgment Cut — treated in this build as a slicing move anyway, i.e. a deliberate homebrew ruling).
- **Pre-nerf Protean:** Added late; changes his type to match *every* move he selects (old Gen 6/7 Protean behavior — happens on every move, not just once per switch-in). Combined with Adaptability, this gives him a **guaranteed 2.0× STAB** on literally every attack, while letting him dynamically pick a resisting/immune defensive typing turn to turn.
- **Signature move: Gallade Gun.** Special Psychic move; an Eruption clone (base power scales with his current HP%, up to 150 BP at full health) — chosen specifically because, being Special and not a punch/slash, it isn't nullified by Primordial Sea's Fire-move-fails rule the way his Fire-typed Bitter Blade is.
- **Priority-stacking discovery (major mechanical set-piece, pages 151–156):** Gale Wings (+1 priority to Flying moves at 100% HP) and Triage (+3 priority to healing moves) **stack additively**. **Oblivion Wing** (Flying-type, natively heals 75% of damage dealt) is both, so it sits at **+4 priority** — the same bracket as Protect/Detect/King's Shield, one above Fake Out (+3). The user identified this as a genuine sequence-break: at full HP, Gallade can hit a target *before* their Protect activates. **Aerilate Fake Out** achieves the same +4 (native +3, Aerilate converts it to Flying, Gale Wings adds +1) — explicitly stated as the *only other move* (besides Oblivion Wing) capable of reaching +4 through this exact combo. Roost also reaches +4 (Triage +3, Gale Wings +1) but doesn't break Protect since it's non-damaging.
  - Because Magic Guard (hazard/chip immunity) + Sturdy keep him locked at 100% max HP whenever he isn't directly hit, his Gale Wings condition ("at 100% HP") is nearly always active.
- **Design decision — no Boomburst:** explicitly denied Boomburst ("tragic, I know") specifically *because* Aerilate+Adaptability+priority Boomburst would be too much even for this project; Boomburst was given to Diancie instead.
- **The Sam counter (major late-game reveal, pages 239–240):** the user pointed out that **Jetstream Sam** (see roster below) is the *only* thing in the format that can actually redirect/answer Gallade's +4 priority Oblivion Wing/Fake Out, via his own Prankster Follow Me reaching **+4 priority** (Follow Me's native +3, Prankster +1) and winning the speed tie, combined with Intimidate to blunt Gallade's physical side and Sam's Steel/Fire resists neutralizing the hit. Framed as an intentional/organic "self-correcting" balance discovery: the format's designated Incineroar-replacement utility mon turns out to be the *only* legal counter to the King, which the user treats as proof the design "did something right."
- **Position in the trio hierarchy:** Explicitly declared the strongest of the three once the Kyogre/Groudon/Rayquaza analogy was drawn — "Gallade is the Rayquaza," controlling the timeline itself rather than out-damaging the other two.

### Shared Trio Traits ("As One" baseline, all three)

Established incrementally, final shared set: **Adaptability** (2.0× STAB, applies even through Aerilate/Pixilate/Protean type conversions), **Pressure** (pure flavor), **Magic Guard** (total immunity to hazards/recoil/weather/status-tick damage), **Sturdy** (any hit from full HP leaves exactly 1 HP — deliberately paired with Magic Guard so hazard/weather chip can never pre-break it), **Tough Claws** (1.3× contact boost), each one's own **Mold-Breaker-family ability** (Scizor=Teravolt, Diancie=Turboblaze, Gallade=Mold Breaker — these bypass each other's/opponents' Sturdy, immunities, and defensive abilities), **Supreme Overlord** (+ up to 20% Atk/SpA per fainted ally), **No Guard** (100% accuracy for and against), and — introduced on the very last page as a retroactive addition — **Magic Bounce** (reflects the opponent's status moves back at them, explicitly called out as the answer to Grian's Prankster-status-move-spam strategy) and **Cataclysm** (custom shared ability, see below).

Cross-pair-only shared traits noted explicitly: Gallade & Scizor both have **Sharpness**; Gallade & Diancie both have **Sniper**.

Because Magic Guard blocks hazard/weather chip but does nothing against a *direct hit*, and Sturdy guarantees survival of exactly one direct hit from full HP, the user pointed out multi-hit moves (Scizor's 10-hit Scizor Shock, 3-hit Surging Strikes) are the only reliable way to break through another trio member's Sturdy — single big hits (Diancie Blast, Oblivion Wing) just tickle it down to 1 HP.

### Custom Shared Ability: Cataclysm

- **Design:** "Taking inspiration from chess" — when a Pokémon with Cataclysm faints, it explodes and instantly wipes the rest of its own team (i.e., an immediate loss for that player, like losing your King in chess).
- **Purpose:** The core balancing lever for using any trio member in standard play — running one is a huge power spike, but losing it is an instant match loss, so teams are built entirely around bodyguarding the "King." Also explicitly makes **Revival Blessing** (see Prince of Darkness below) unable to save a fallen King — the King's death ends the game before revival can matter.
- **Side effect on the format:** because the trio are this strong, the user's ruling is that standard "Restricted" legendaries (Zacian-Crowned, Miraidon, Koraidon, Primal Groudon/Kyogre, Calyrex forms, etc.) are simply **unrestricted** in this format — they're relegated to supporting cast ("Dukes") for the actual King.

---

## Custom Moves

| Move | Type/Category | Base Power | Mechanic | User |
|---|---|---|---|---|
| **Diancie Blast** | Rock, scales off Defense (Fortemons item) | 120 | Meteor-Beam-style self-charge (auto-skipped in Sun), charge turn grants **+1 Defense** (final; was +1 SpA originally), 50% chance of an additional +2 Defense on hit (Diamond Storm rider). Not priority itself. | Diancie |
| **Scizor Shock** | Electric, physical (scales off Atk via Fortemons‑equivalent? — no, off native Atk) | 20 BP ×10 hits (final version) | Charge turn (skipped in Rain) grants +1 Attack, then hits 10 times like Population Bomb; each 20 BP hit qualifies for Technician. *(Superseded v1: single-hit ~130 BP physical Electro Shot clone that boosted Attack instead of SpA.)* | Scizor |
| **Gallade Gun** | Psychic, special | Up to 150 (Eruption clone, scales with user's current HP%) | Chosen because it's Special (bypasses Primordial Sea's Fire-move-fails rule that neuters his Fire options). | Gallade |
| **Wyvern Missile** | Dragon (checks both Dragon **and** Fairy defensive typing simultaneously, like Flying Press) | ~90–100 baseline (Flying-Press-style dual coverage) | Damage calculated off the user's **Speed** stat instead of Attack/SpA (like Body Press uses Defense); gets STAB only once even though it's dual-typed for defensive calc purposes, matching Flying Press's rule. | Dracannon (friend's mon, not part of the trio) |

*(Other "signature" moves discussed, e.g. Nail Shot/Pneumatic Blast for the Hitachi NR83A3, are reflavored existing moves — Steel-type Spike Cannon and Flying-type Iron Head respectively — rather than new mechanical designs.)*

---

## Custom Abilities Glossary

| Ability | Effect | Owner(s) |
|---|---|---|
| **Metal Muncher** | Custom Earth-Eater clone: any Steel-type move that hits the user instead heals 25% max HP. | Diancie |
| **Thermal Core** | Custom Water-Bubble clone for Fire: halves incoming Fire-type damage, doubles the user's own outgoing Fire-type damage, grants immunity to freezing. | Diancie |
| **Pixie Engine** | Custom Misty-Terrain variant of Hadron Engine: on switch-in, sets Misty Terrain and grants the user a flat Special Attack boost (paralleling Hadron Engine's Electric-Terrain SpA boost). | Diancie |
| **Steam Blaster** | Custom dual-element Steelworker/Rocky-Payload equivalent: grants a flat 1.5× power boost to the user's own Fire-type **and** Water-type moves (fake STAB on both). Belongs to Gallade only (explicitly *not* Diancie — a mid-document misattribution was corrected). | Gallade |
| **Gamma Stream** (a.k.a. described once as "Project Ragnarok Sky Eater" flavor) | Custom four-effect signature: (1) sets permanent Delta Stream–style strong winds, neutralizing the user's Flying-type weaknesses; (2) auto-sets Tailwind on the user's side on entry; (3) grants a permanent +2 critical-hit-stage buff (Focus-Energy-equivalent); (4) grants a flat 1.5× damage boost to the user's Flying-type moves while the winds are active. | Gallade |
| **Fairy Armor** | Custom "3rd typing" ability: grants the user Fairy-type **defensive** properties (resistances/immunities) layered on top of their real typing, without necessarily granting Fairy STAB (STAB was a separate, explicit user add-on for Dracannon). | Dracannon |
| **Cannoneer** | Custom Strong-Jaw-style ability: boosts the power of all "ball and bomb" category moves (Shadow Ball, Sludge Bomb, Gyro Ball, Weather Ball, Mud Bomb, Focus Blast, Searing Shot, etc.) by a flat multiplier (implied ~1.5×, mirrored on Strong Jaw's math). | Navia, Demoman |
| **Chargin' Targe** | Custom ability: the user's **first** move used, if it is a slicing move *or* an explosive move (justified in-fiction by Demoman's Caber grenade shield item), gets a 1.5× power boost and is elevated to **+2 priority**. | Demoman |
| **Tornado of Creation** | Custom ability: user's Hurricane never misses, and its type dynamically changes to whichever of Fire / Electric / Ground / Ice would be super-effective against the target (Judgment/Revelation-Dance-style adaptive typing), while keeping native Flying STAB. | Lloyd |
| **Soulify** | Custom "Ghost-type Pixilate": converts Normal-type moves to Ghost-type with the standard Pixilate-style power boost (~1.2×). Notably used to make Extreme Speed a Ghost-type, un-resistible-by-Normal-immunity priority nuke. | Minos Prime |
| **Berry Delight** | (Uses the real, existing Gen 9 ability name/slot, but with a homebrewed trigger.) Does nothing by itself. If the Pokémon's active partner *also* has Berry Delight, **both** of their abilities transform into **Parental Bond** for the duration. Deliberately given to Miyabi (not a DMC character) rather than to Nero, framed in-universe as "Vergil has favorite children." | Vergil, Miyabi |
| **Entra JWT** | Custom Armor-Tail/Psychic-Terrain-style reskin: blocks priority moves from affecting the user (a "firewall" that "authenticates" priority actions and rejects unauthorized ones). Named after Microsoft's identity/auth product. | Microsoft Azure |
| **Sandstorm** (ability, distinct from the weather itself) | Custom Sand-Stream-equivalent signature: sets a permanent Sandstorm on switch-in. Pure thematic reference to the song "Sandstorm" by Darude. | Darude |
| **Cataclysm** | See "Shared Trio Traits" above — on fainting, instantly wipes the rest of the user's own team. | Scizor, Diancie, Gallade (shared) |
| **Imposter + Illusion (combo use)** | Not a new ability, but a deliberate combined-ability ruling: on switch-in, Illusion makes the user *appear* as the last party member visually, while Imposter is actually transforming into (copying stats/moves/boosts of) the opposing active Pokémon — with an explicit house-rule that Imposter **cannot** copy any of the "Stupid"/god-tier custom mons ("no Imposter can replicate godhood"). | Spy (TF2) |

---

## The Wider "Stupid" Tier Roster

The document explicitly catalogued this roster twice (pages 278–279 and again refined at 281–292); the table below merges both passes into the final state for each unit. All of these are unrestricted (non-Trio) custom "mons."

| Unit / Source | Typing | Ability / Signature Mechanic | Role / Gimmick |
|---|---|---|---|
| **Miyabi** (ZZZ) | Fire/Ice | Flash Fire (regular) + **Berry Delight** (combo w/ Vergil → Parental Bond) | Offensive check with strong dual coverage; pairs with Vergil for a Parental-Bond snowball. |
| **Vergil** (DMC) | *(typing not specified in this document — see Open Questions; actual repo has him as Ice/Dragon)* | **Sniper**, spams crit-fishing **Spatial Rend**; "modest stats otherwise"; also has **Berry Delight** (combo w/ Miyabi) | High-variance crit-based glass cannon; no trio-tier defensive baseline (no Sturdy/Magic Guard), so he dies to any real hit if he doesn't secure the KO first. |
| **Dante** (DMC) | Physical attacker | **Dancer** (not held back by Oricorio's stats) | Copies any dance move used by anyone on the field for free (Swords Dance, Dragon Dance, etc.), then attacks immediately after with Extreme Speed / Close Combat / (spicy) Fell Stinger. Explicitly repurposed mid-doc from an earlier scrapped "Contrary + Armor Cannon + Close Combat" concept once the user decided Dancer fit him better. Used offensively to piggyback off the user's own Volcarona (Quiver/Fiery Dance) or Kingambit (Swords Dance) in Doubles, not just defensively against opponents. |
| **Nilou** (Genshin) | Bulky Water (Vaporeon-tier bulk), good Special Attack | **Dancer** | Special mirror of Dante: bulky enough to safely "join the dance" off an opponent's or ally's boosting move (esp. own-team Volcarona) and convert it into a special sweep. |
| **Navia** (Genshin) | Ground | **Cannoneer** | "Ursaluna-tier" bulky-and-strong artillery piece (not mixed like Demoman — pure special/physical focus makes her hit harder per stat point). Coverage: Mud Bomb (via Cannoneer, hits harder than Earth Power), Sludge Bomb, Energy Ball, Weather Ball, Focus Blast, Searing Shot. Acts as a stationary wallbreaker/"siege engine," countering the Hitachi's utility role and complementing Demoman's speed. |
| **Demoman** (TF2) | Fire/Fighting | **Chargin' Targe** + **Cannoneer** (both) | "Schrödinger's set" — opponent can't tell if he's a Special Cannoneer bomber (Searing Shot/Aura Sphere, every ball/bomb move in the game) or a Physical Chargin'-Targe user (Sacred Sword/Bitter Blade at +2 priority with target's Defense halved) until he acts. Fast + strong, mirrors Iron Valiant's stat profile (vs. Navia's bulky-and-strong Ursaluna profile). |
| **Nahida** (Genshin) | Grass/Psychic | Grassy Surge (matches actual repo); flat 100 BST-all spread; learns **every** Grass-type move | "Universal pivot": 100 Speed lets her outspeed much of the tier for **Spore**; Cotton Guard (+3 Def) into Stored Power is her sweep engine; full Grass movepool gives her Synthesis/Leech Seed/hazard options too. |
| **Zhongli** (Genshin) | *(not specified — implied Rock/Steel-adjacent by flavor)* | **Solid Rock** only; no healing, no status/burn tools, no pivot moves | Stats = Shuckle's Defense/Special Defense (230/230) but **HP 255** (Blissey's HP) instead of Shuckle's 20. Pure hazard-stacking wall: sets Stone Axe, a custom **Steel Spikes**, and Spikes, then spams Roar/Dragon Tail (guaranteed to hit thanks to the trio-adjacent No Guard baseline) to phaze. Zero recovery is an intentional weakness — can be worn down if trapped. |
| **Spy** (TF2) | Dark/Ghost | **Imposter + Illusion** combo (see Custom Abilities); flat **100 HP** ("basically the only stat that matters") | Counter-intelligence: visually disguised as your last party slot, mechanically copying the opposing active Pokémon's stats/boosts/moves (except it cannot copy the Stupid trio). Used to blank an opponent's hazard-removal or setup sweeper. |
| **Prince of Darkness** (BTD6) | Pure Ghost | Custom ability: switching out restores 4 PP to all moves, at the cost of 10% max HP lost at the end of every turn; also has **Revival Blessing** | "Necromancer": PP-sustain engine and one-time teammate revival (cannot save a Cataclysm-triggering King's death — see Cataclysm). Very poor physical Defense, making him prime **Knock Off** bait. Blocks Rapid Spin (Ghost immunity) to protect Zhongli's hazards. |
| **Jetstream Sam** (MGR) | Fire/Steel | **Regenerator + Prankster + Intimidate** (triple ability); holds an **Air Balloon** | Explicitly built as "an industry plant to replace Incineroar." Movepool: Behemoth Blade, Bitter Blade, Follow Me (Prankster → +4 priority), Fake Out, Throat Chop, Taunt, Encore, Tailwind, Detect, Final Gambit, Parting Shot. Suffers extreme 4-move-slot syndrome (three distinct viable builds discussed: pure redirection/support, bulky-offense self-healing Bitter-Blade set, or a "super support" Prankster status-lock set). Air Balloon patches his one typing weakness (Ground); Regenerator makes the balloon's one-time-use limitation irrelevant since he heals back to full on every pivot anyway. **Turns out to be the only reliable answer to Gallade's +4 priority kit** (see Gallade write-up). |
| **Incineroar** | Dark/Fire (canon) | Canon Intimidate; **given Follow Me** as an add-on | Initially discussed as "still relevant" as a King-bodyguard/pivot; then explicitly **replaced/superseded** by Jetstream Sam once Sam was designed ("the industry plant"), per the user's own framing on page 229 ("no mechanical reason to ever click Incineroar again"). |
| **Microsoft Azure** | **Water/Steel** (revised from an initial unspecified typing once the user made the "underwater data centers" joke — Project Natick reference) | **Entra JWT** (custom, priority-blocking) | Premier Trick Room setter; flat 100 BST-all spread (mirrors AWS). Firewall utility shuts down the entire Jetstream Sam Prankster kit and other priority abusers. |
| **AWS (Amazon Web Services)** | Grass/Electric | **Technician + Guts + Grassy Terrain (setter) + Poison Heal + Grassy Glide** (five abilities); flat 100 BST-all spread | Physical hyper-specialist: auto-sets Grassy Terrain, so **Grassy Glide** gets +1 priority and stacks Technician + Terrain + STAB (~160 BP before items); running a Toxic Orb triggers Guts (1.5×) with zero downside via Poison Heal. Deliberately restricted to only **Grassy Glide and Spark** as physical STAB — everything else in her kit (Thunderbolt, Volt Switch, Leaf Storm, Giga Drain) is Special and thus wasted on her physical spread, creating her own 4-move-slot-syndrome joke. Countered by Azure's Trick Room + priority-block combo. |
| **Hitachi NR83A3 (framing nailer)** | Steel/Flying | **Chlorophyll + Skill Link** | The tier's "Great Tusk": full hazard control (sets **Steel Spikes** — the custom Steel-type entry hazard — and Spikes; also runs Defog **and** Rapid Spin) plus a 5-hit-move offensive kit (signature moves **Pneumatic Blast** = Flying-type Iron Head, **Nail Shot** = Steel-type Spike Cannon; also Bullet Seed, Pin Missile, Rock Blast, Scale Shot, U-turn). Doubles Speed via Chlorophyll under any of the team's Sun setters (Groudon-Primal, Diancie-Stupid, Mega Charizard Y, Torkoal, The Beatles). |
| **Flex Seal** | Dark/Poison | **Filter + Earth Eater** | Stats = Toxapex's spread; movepool = Alolan Muk's kit + Recover. Near-unkillable stall wall (immune to Ground, resists most super-effective hits by 25% via Filter) — but explicitly still dies to Scizor-Stupid's priority Jet Punch, used by the user as proof the Trio is a mandatory "anti-stall" pressure valve. |
| **The Beatles** | (band/ensemble unit, Sun-setter) | Custom signature "Sgt. Pepper's Lonely Hearts" (sets Harsh Sunlight; a 4-member-present bonus "Revolution 9" extends the weather to 8 turns) | A secondary/tertiary Sun-setter alongside Groudon-Primal, Charizard-Mega-Y, and Diancie-Stupid. Least fleshed-out unit in the doc — presented as more of a joke than a finished design. |
| **Darude** | (Sandstorm setter) | Custom **Sandstorm** ability (see Custom Abilities) | Pure environmental-disruption unit; the "Tyranitar" of this tier, setting up the sand-based archetype. |
| **DDT** | Dark/Steel | **Sand Rush** | The tier's "Excadrill" — sand-abusing speed-doubling closer. 600 BST (explicitly stated as the baseline for *all* custom non-restricted "characters" in this roster, to compete with real Ubers/Pseudo-legendaries). Framed as an Excadrill/Kingambit hybrid. |
| **Vicks VapoRub** | Ice/Water | (unspecified ability; sets **Snow** and **Aurora Veil**) | "Cold Storage" defensive specialist: Parting Shot to pivot, Scald to threaten burns, Aromatherapy as cleric utility. Hard-counters the Sun archetype by overwriting weather. Leads well with **Alolan Sandslash** (Slush Rush) for an aggressive "Frozen Infrastructure" opener. |
| **Mistral** (MGR) | Ice/Steel | (special attacker; secondary Snow-setter) | Sits on the field spamming Blizzard (never misses in Snow); backup Snow-setter for Vicks VapoRub teams. |
| **Eternamax Eternatus** | (canon Eternamax form) | (canon stats: 255/250/250 bulk) | The "raid boss" of the defensive core — used at its real, canonical stat line as the ultimate stall anchor; explicitly the toughest matchup discussed for the Trio (concluded Scizor-Stupid, via priority + Magic-Guard-protected multi-hit Jet Punch/Scizor Shock chip, is the best answer). |
| **Ibuprofen** | Poison (canon Alomomola stats) | **Regenerator** | "Poison-type Alomomola": U-turn/Regenerator pivot, Wish-passes health to teammates, Heal Bell cleric utility, Baneful Bunker punishes contact. The team's "healthcare/compliance" unit. |
| **Normal Chicken** | Pure Flying | **Reckless** or **Rock Head** (either, situational) | The tier's suicidal "Staraptor": Close Combat, Brave Bird, Head Smash — a glass-cannon wallbreaker meant to crack one defensive anchor (Zhongli/Flex Seal) and then die or pivot out. |
| **Raiden Shogun** (Genshin) | Electric (implied, via Hadron Engine) | **Hadron Engine**; moves **Thunderclap**, **Rising Voltage** | Speed comparable to Chandelure/Porygon-Z (i.e., mediocre — explicitly outsped by the Chicken, AWS, and even Nahida). Relies on Thunderclap's priority to compensate; Rising Voltage exploits her own Electric Terrain. The team's "Special executioner" counterpart to the (mostly physical) Stupid trio. |
| **Noelle** (Genshin) | Ground | (canon Blissey base-stat spread, but with **Physical and Special stats swapped** — i.e., huge Attack/Defense, mediocre SpA/SpD) | The joke is literally "physical Blissey." Ground typing (vs. Blissey's Normal) grants an Electric immunity, directly answering Raiden Shogun-style threats. Physical wall counterpart to the mostly-special "Terminal Stall" core. |
| **Monsoon** (MGR) | Electric/Steel | (Pelipper's movepool + Dragapult's speed spread) | "High-frequency" pivot: elite Speed (Dragapult-tier) but otherwise mid stats; kit = Pelipper utility + Thunder/Thunderbolt/Volt Switch for STAB. Scouts leads and maintains momentum. |
| **Grian** (Hermitcraft/Minecraft) | Ground/Flying | **Prankster + Regenerator** | The document's explicit final "capstone" design, intended to feel "like everything wrong with the game." Stats = Scream Tail's spread **+30 HP**. Ability-enabled infinite utility loop: Prankster **Spore** (breaks Spore's traditional slow/risky balancing entirely), Prankster **Glare** + Serene-Grace-boosted **Air Slash** for a paraflinch lock, Prankster **Tailwind**, **Encore**/**Taunt**/**Quash**/**Disable**/**Swagger**/**After You**/**Beat Up**/**Round**, **Follow Me**/**Wide Guard** for doubles, **Parting Shot + Regenerator** for a consequence-free pivot loop, **Shore Up** for sustained recovery, and **Diamond Storm**/**Stone Axe** for defense-boosting hazard-setting. Deliberately given *no offensive stat investment* despite carrying high-caliber attacking moves (**Fleur Cannon**, Play Rough, Headlong Rush, Brave Bird) — those exist purely so he isn't dead weight against a Taunt (Fleur Cannon still threatens damage) or against the Dark-types that would otherwise wall his all-status Prankster kit. Countered only by the Trio's shared **Magic Bounce** (added specifically in response to Grian, on the document's final page), which reflects his entire status-move toolkit back at him. |

---

## Format & Metagame Design

### Weather Access Tiers
Explicitly restricted to two classes:
- **Primal-weather-capable units** (can summon Desolate Land / Primordial Sea / Delta Stream): the full Stupid Trio (Gallade, Scizor, Diancie), canon Primal Groudon, canon Primal Kyogre, canon Mega Rayquaza, plus two more Genshin-sourced units **Mavuika** and **Neuvillette** (their specific typings/abilities for this purpose are not detailed beyond "Primal-tier"). Everyone else is "Tier 2" and must use ordinary weather (Sand, Snow, Terrain, Sun via non-Primal setters like The Beatles/Torkoal/Charizard-Y).
- Framed narratively as a caste system: Primal-tier units are "System Admins" who can overwrite anyone else's field state at will.

### The "[VGC 2026] The Unholy Trinity" Restricted Format
- Concept: standard box-art Ubers (Miraidon, Koraidon, Zacian-Crowned, Calyrex forms, Primal Groudon/Kyogre, Rayquaza, etc.) are treated as ordinary/common — no restriction — while the Stupid Trio are the only Restricted picks, capped at **1 per team**.
- A rough Showdown implementation sketch was produced (illustrative, not a finished ruleset): a `config/formats.ts` entry with `gameType: 'doubles'`, a `Limit One: Custom-Gallade, Custom-Scizor, Custom-Diancie` custom rule, plus matching `data/mods/gen9/pokedex.ts` and `data/mods/gen9/moves.ts` stub entries for the three customs and their signature moves.
- Later this restricted-format framing generalizes into a broader singles/doubles metagame described narratively rather than mechanically ruled: **Weather Offense favors Doubles** (multiple units benefit from one Primal-tier setter simultaneously), **Terminal Stall favors Singles** (attrition through the defensive core: Zhongli / Eternamax Eternatus / Ibuprofen / Flex Seal / Microsoft Azure).
- **Balance thesis (explicit, user-stated, page 275):** running one Stupid Trio member per team is treated as *mandatory*, compared to "opting out of a $5B government stimulus" — the defensive "Terminal Stall" core is so efficient that only the Trio's priority/ability-ignoring/multi-hit mechanics can reliably break it. Landorus-Therian was used as the explicit case study for a "normal" competitive staple rendered obsolete by this power level (Intimidate, U-turn, and Stealth Rock all lose relevance against a cast with Magic-Guard immunity, trio-tier bulk, and priority-ignoring executioners).
- "Normal" (non-custom) Pokémon identified as **still employed** in this meta, each for a specific niche: Corviknight (hazard removal/cleric), Garganacl (Salt Cure passive damage vs. huge-HP walls), Weavile (fast Knock-Off pressure/speed check), Toxapex (emergency special wall until "power-crept").

### Legacy/Prototype Units
Dante, Nilou, and Navia are explicitly framed at one point (page 281) as "legacy code" predating the Stupid Trio's dominance — then the user immediately corrects this characterization (page 283) by pointing out their Dancer/Cannoneer kits are still highly relevant, not obsolete; Gemini revises accordingly. Kept in the spec above with their corrected, final roles.

---

## Lore & Naming Conventions

- **Running bit — legendary layoffs:** every time the Stupid Trio invalidates a real legendary/mechanic, it's framed as that Pokémon getting laid off, complete with mock LinkedIn "#OpenToWork" posts (Kyogre, Groudon, Rayquaza, and later a Corviknight/"blue-collar workhorse" economic framing for the surviving "employed" mons).
- **"Warcrime Super Soldiers" vault:** the user's running name for the private (never-to-be-released-in-Rose-Gold) folder holding the Trio — `C:/Vault/Warcrime_Super_Soldiers/`, described as "irradiated kryptonian viltrumite" designs too dangerous to ship.
- **Sparda/DMC framing:** the user compared watching Rose-Gold-Scizor vs. Volcano-Diancie duke it out to "Sparda watching Dante and Vergil fight" — this comparison is the direct seed for later adding actual Dante/Vergil (and Miyabi, Nero-snub joke) units to the roster.
- **Corporate/consumer-product satire theme:** Microsoft Azure, AWS, Hitachi NR83A3 (a real framing nailer model), Flex Seal, Ibuprofen, Vicks VapoRub, Darude (the "Sandstorm" song) — an entire "industrial/infrastructure" sub-roster satirizing enterprise tech and household products, explicitly discussed as being in tension/arms-race with the Trio ("Industrial Stability vs. Trio Chaos").
- **Pop-culture crossover sourcing, by franchise:**
  - *Devil May Cry:* Dante, Vergil.
  - *Metal Gear Rising: Revengeance:* Jetstream Sam, Mistral, Monsoon.
  - *Team Fortress 2:* Spy, Medic (Ubercharge = mutual Protect + recharge turn, briefly floated then not developed further), Demoman/Demoknight (Chargin' Targe).
  - *Genshin Impact:* Nahida, Nilou, Navia, Furina, Zhongli, Noelle, Raiden Shogun, Mavuika, Neuvillette.
  - *Zenless Zone Zero:* Miyabi.
  - *Ultrakill:* Minos Prime (with a Judgment-move nod to the source game).
  - *Ninjago:* Lloyd.
  - *Bloons TD 6:* Prince of Darkness.
  - *Hermitcraft (Minecraft YouTuber):* Grian, the document's deliberately-obnoxious capstone design.
- **"Industry plant" joke:** Jetstream Sam is repeatedly called an "industry plant" specifically engineered to replace Incineroar as the format's must-run utility mon.
- **Furina's role** (Genshin): support piece with **Decorate** (+2/+2 Atk/SpA, priority-ish utility buff move), **Follow Me** (redirection), and Serene-Grace-boosted **Scald** (60% burn chance) — largely superseded in the "who redirects for the King" role once Jetstream Sam and Incineroar-with-Follow-Me were developed, but never explicitly retired.
- **Seviian Milotic** (a real Radical Red ROM hack custom form, not the user's own design) is discussed as a borrowed reference point: Ground/Fairy typing with Serene-Grace-boosted Scorching Sands/Moonblast/Dragon Breath, brought in as an off-the-shelf defensive pivot rather than an original creation.

---

## Implementation Notes (as discussed in-chat)

### Quick-and-dirty Showdown hacks (no code changes)
For a one-off Custom Game without touching server source: put the "base" ability (e.g. `As One (Glastrier)`) in the actual ability slot for teambuilder validation, then have both players manually run battle-console commands once the match starts, e.g.:
```
/addtierall, Technician, Iron Fist, Regenerator, Primordial Sea, Water Bubble, Steelworker, Steely Spirit
```
or, if that's unavailable/blocked, directly scripting it via the debug console:
```
/all pokemon.setAbility('Technician'); pokemon.setAbility('Iron Fist'); ...
```
(Both players must agree to allow script/debug commands in the Custom Game.) A Damage Calculator workaround was also suggested: fake the stacked modifiers by picking one representative ability plus a custom item-modifier text field.

### Proper Showdown server implementation (for a persistent custom mod)
- Add a merged multi-effect ability object to `data/abilities.ts` (or a `data/mods/<mod>/abilities.ts`), combining all the desired hooks (`onModifyMove`, `onModifyDamage`, `onModifySecondaries`, `onTryHit`, `onSwitchOut`, `onDamage` for Magic-Guard-style negation, `onModifyPriority` for the Gale-Wings+Triage stacking, etc.) into one ability ID (e.g. `asonescizor`).
- Point the species entry at that ability via `inherit: true` in `data/mods/<mod>/pokedex.ts` (e.g. `scizormega: { inherit: true, abilities: {0: "asonescizor"} }`).
- Register custom signature moves (Gallade Gun, Scizor Shock, Wyvern Missile, etc.) in `data/mods/<mod>/moves.ts`, including custom `basePowerCallback`s (HP%-scaling for Gallade Gun) and `onTryMove` charge-turn-skip logic (Scizor Shock in rain).
- Register the custom VGC restricted format in `config/formats.ts` with a `customRules` entry like `'Limit One: Custom-Gallade, Custom-Scizor, Custom-Diancie'` and an `onValidateSet` hook to redirect e.g. `Gallade-Mega` to a `Custom-Gallade` species ID.
- Explicitly called out as the **easiest of all implementation paths** discussed (see below) — "5 minutes."

### Alternative implementation path discussed: the `pokeemerald-expansion` GBA ROM hack (for "Pokémon Rose Gold")
Presented as the user's actual, real, in-progress project (the original motivating context for the Rose-Gold-Scizor superboss idea), ranked as the **second-easiest** path and "the perfect project choice" since custom species/abilities/mega-evolutions/items are just data-table edits in that codebase:
- Define a distinct internal species (e.g. `SPECIES_SCIZOR_ROSE_GOLD`) — same pattern as Ash-Greninja/Dusk-Lycanroc/Bloodmoon-Ursaluna — in `pokedex.h`, keeping identical base stats to normal Scizor (explicit design joke: "the funniest part is that it's all standard Scizor stats").
- Custom level-up learnset table in `src/data/pokemon/level_up_learnsets.h`.
- Custom Mega Evolution entry in `src/data/pokemon/mega_evolutions.h`, gated behind a new item (`ITEM_ROSEGOLDITE`).
- Because the engine only supports one ability slot, the many stacked passives are implemented as a single hardcoded species-ID check inline inside the damage-calculation function in `src/battle_util.c` (`CalculateRoseGoldDamage()`), rather than as a real modular "ability."
- Postgame delivery concept: a hidden, uncatchable (catch rate 0), uber-tier wild encounter or superboss trainer (jokingly suggested as "a cybernetic Steven Stone") in a cryptic location (e.g. a flooded facility echoing New Mauville), rewarding the player with the unique species + its custom mega stone on defeat.
- Explicitly **ruled out** as too painful: CFRU (Complete FireRed Upgrade — "mid-tier headache," restrictive memory/table structures) and modern console titles (SwSh/SV via a Switch emulator such as "Sudachi," a Yuzu fork) — the latter dismissed as "absolute masochism" since Mega Evolution's underlying state machine is stripped/absent in those game codebases and reverse-engineering compiled `.bcmd` battle-command binaries for a custom multi-ability species was judged infeasible.
- **Final recommendation given in-chat:** prototype on Showdown first to see the numbers/flinch-rate in action, then commit the finished design to the `pokeemerald-expansion` source as the real postgame Easter egg.

---

## Open Questions / TODO (flagged for human review)

1. **This entire document is unrelated to the repo's existing `Champions` / `35 Pokes` / `Artemis` / `ZUBL` formats.** Nothing here explains or connects to those — they appear to be pre-existing upstream-style content already in `config/formats.ts` from a different lineage of work. Confirm with the user whether "the Stupid tier" is meant to eventually become an actual playable format in this repo, or whether it's meant to stay conceptual/ROM-hack material.
2. **Vergil's typing is never stated in this PDF.** The current `data/pokedex.ts` entry gives him Ice/Dragon with a single ability, Sniper (matching one part of his PDF concept — "spams crits with sniper spatial rend"). The Ice/Dragon typing choice and the "modest stats otherwise" line from the PDF don't match the repo's flat-100-everything spread; worth confirming intent.
3. **Nilou's actual repo ability is Illuminate** (a famously "does nothing" ability), but every mention of her in this PDF is built entirely around **Dancer**. These are hard to reconcile — possibly Illuminate was a placeholder/joke slot chosen before Dancer was decided, or a separate, later joke not covered in this transcript. Worth double-checking against any subsequent conversation not captured in this PDF.
4. **Jetstream Sam's repo ability is Sharpness**, but every version of his kit discussed in the PDF centers on **Regenerator + Prankster + Intimidate** (no mention of Sharpness or slicing moves for him at all). Sharpness fits his sword-wielding character thematically but is a different mechanical direction than what's written here — confirm which is authoritative going forward.
5. **Nahida is the one clean match:** Grass/Psychic, Grassy Surge, matches the PDF's design intent (grass-terrain-setter, full grass movepool, Cotton Guard+Stored Power sweep plan) closely. The flat-100 BST and OU/DOU tier placement in `data/formats-data.ts` also line up with the "flat 100-in-everything" pattern repeated for several units in this doc (Nahida, Azure, AWS).
6. **Zhongli's typing is never explicitly stated** — only his stat spread (Shuckle defenses + Blissey HP) and ability (Solid Rock) are given. Flavor implies Rock and/or Steel but this is inferred, not stated.
7. **Scizor Shock has two incompatible definitions in the transcript** — an early single-hit "boosted Electro Shot" version and a later, explicitly-corrected 10-hit "Electric Population Bomb" version. This spec treats the second as authoritative per the user's own "Now, it's..." correction, but flag in case the earlier version was actually preferred for actual implementation.
8. **Diancie Blast's charge-turn boost also has two versions** (+1 SpA, then revised to +1 Def) — same treatment; second version (+1 Def) is authoritative here because it's what makes the later Fortemons/Body-Press mixed-attacker plan work, and all subsequent math in the document uses the +1 Def version.
9. **No formal banlist/ruleset was ever written down** for "the Stupid tier" as a whole (weather-access restriction and the "1 Trio member, everything else legal" rule are the only hard rules stated); the "Terminal Stall vs. Weather Offense" archetype split and the "which normal mons still have jobs" discussion are analysis/flavor, not codified rules. If this is to become an actual Showdown format, a real ruleset/banlist still needs to be authored from scratch.
10. **The Beatles unit is the least developed** — no stats, no full movepool, no confirmed final ability (a signature "Sgt. Pepper's Lonely Hearts" ability was proposed but never revisited or confirmed as final, unlike every other unit in the roster).
11. **Mavuika and Neuvillette's specific typings/abilities were never detailed** beyond "have Primal weather access" — worth clarifying if they're meant to get the full custom treatment or just Primal-weather flags on their canon selves.
