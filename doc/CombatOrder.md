# Combat Order

The goal here is a particular output. A clear ordering of who moves when, 
labeled by segment if appropriate.

This can be represented internally as a dag, and the tsort could order by 
the segment property, if present.

Drawing this visually would be fun, but a challenge, as nodes in the same 
segment should be vertically aligned.

Unclear whether two actions in the same segment can be ordered, or if they 
should always be considered simultaneous. I believe they are ordered.

We do not concern ourselves with *outcome* of events - just when they 
activate.

## Inputs

Distance: This is relevant for charging and closing. At this point,
  it does *not* seem relevant for range or area of effect, unless
  there is an implied velocity of a spell effect.

Target: Each attacker has to pick a target for certain combat 
  operations.

Movement rate: Relevant for charging, closing, and also if dexterity
  adjustments apply.

Initiative roll: obviously

Combat choice: A - H, probably more detail

Number of attacks (melee): Needed for initiative scheduling

Firing rate (missile): There's a question of whether to consider these
  one attack routine, or separate attacks. This can be set in preferences.

Weapon reach: Used for resolving charges

Dexterity: Necessary for the following reasons:
  - Missile initiative bonus, if movement rate is 12"
  - Reaction bonus, to disable surprise, if movement rate is 12"
  - This might not be necessary for timing/scheduling though
 
Casting time: For spell scheduling
 - There is the question of whether spells start casting on segment one
 - Probably a preferences choice

Magical device activation time: If applicable

Weapon speed factor: Useful for tied initiative, and for weapon against spell

Surprise offense: I think this may not be necessary for scheduling. It's
  more for determining if surprise exists. There's also the question of
  whether it propagates.

Surprise defense: I think this may not be necessary for scheduling. It's
  more for determining if surprise exists. There's also the question of
  whether it propagates.

Special weapon properties:
  - Crossbow of speed
  - Short sword of quickness
  - Scimitar of speed

Missile firing rate for surprise:
  - Very relevant for surprise scheduling
  - Firing rate should be a preference (nocked / cocked / loaded)

Bow/crossbow specialist before initiative: Relevant for scheduling

Encumbrance: Encumbered can't charge. Maybe ignore?

General: Custom action duration, like drinking a potion. Maybe ignore.

Overlap from previous segments/rounds: Casting time, etc.

## Who knows what?

Each player should store:
- Movement rate (should also work for encumbrance)
- Dexterity (missile, reaction)
- Surprise offense (does it propagate?) (may not be necessary)
- Surprise defense ("only surprised x% of the time") (may not be necessary)
- Weapon proficiencies (for penalties and attacks per round)
- UA: weapon specialization for melee/missile (ugh)

Weapon should store:
- Firing rate
- Weapon reach
- Weapon speed factor
- Special properties (weapons of speed)

Source/target should store:
- Distance, only if appropriate combat option is selected?
  - Distance might not be necessary for spell ranges, unless travel time matters

Battle grid should store:
- Target
- Initiative roll
- Combat choice (A-H)
- Casting time
- Magical device activation time
- General action duration
- Overlap from previous rounds (most relevant for surprise)

Preferences should store:
- Missile firing rate per segment for surprise
  - FR (bow = 2)
  - FR/FR * 3 (bow = 3) (assumes each fire is a separate attack)
  - FR * 3 (bow = 6)
  - FR * 3 if nocked, otherwise FR (bow = 6 or 2)
  - FR * 3 for round, per 10 segment (bow = 0.6)
  - FR * 3 for round, per 6 segment (bow = 1)
- When casting time starts by default
  - Start of round
  - Segment of opponents initiative die

## First step

Weapons are done:
 - length/reach (for ranges, I picked the middle)
 - speed factor (for range, I picked the middle)
 - firing rate for missile

## Status

What's left:

- Player
- Source/Target
- Battle Grid
- Preferences

Next up: Player... secondary screen? Only on combat screen?
  - Mvmt Rate
  - Dexterity (For missile, initiative, reaction)
  - Weapon proficiencies

Launch combat screen from battle grid? When do I prompt for 
extra player information? What does this do to battle grid state?
All in one page? Shared state? Hmm...

What's interesting though is that not all the properties from 
the Battle Grid are relevant anymore.

Name: still relevant
Class: still relevant
Level: still relevant - is this different, though? Currently, it's combat level.
Weapon: still relevant
Armor Type: not relevant
Armor Class: not relevant

Problem: Someone could be a 20th level MU and a 5th level Fighter. Most
advantageous combat level might be MU, while specialization... 

I'm starting to go the other way. Maybe I just ask for "melee attacks" 
or "# of melee attack routines" and have that set per round. Then I also
don't have to take level into account.
