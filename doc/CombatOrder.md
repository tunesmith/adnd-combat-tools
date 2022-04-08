# Combat Order

The goal here is a particular output. A clear ordering of who moves when, 
labeled by segment if appropriate.

This can be represented internally as a dag, and the tsort could order by 
the segment property, if present.

Drawing this visually would be fun, but a challenge, as nodes in the same 
segment should be vertically aligned.

Unclear whether two actions in the same segment can be ordered, or if they 
should always be considered simultaneous.

For now, we will disregard surprise. We will assume combat rounds only.

We do not concern ourselves with *outcome* of events - just when they 
activate.

## Inputs

Inputs are many!

- Distance
- Target
- Movement rate
- Initiative roll
- Combat choice
- Number of attacks (melee)
- Firing rate
- Weapon reach
- Dexterity (missile, for initiative, 12" restriction on bonus)
- Dexterity (reaction, for surprise, 12" restriction on bonus)
- Casting time
- Weapon speed factor
- Surprise offense (does it propagate?)
- Surprise defense (does it propagate?)
- Crossbow of speed, short sword of quickness, scimitar of speed?
- Missile firing rate for surprise? (Nocked / cocked / loaded?)
- Bow/crossbow specialist before initiative
- Encumbrance (encumbered can't charge) - maybe ignore?
- Magical device activation time
- General action duration (drink potion)
- Overlap from previous rounds (casting time, etc)

## Who knows what?

Each player should store:
- Movement rate (should also work for encumbrance)
- Dexterity (missile, reaction)
- Surprise offense (does it propagate?) (may not be necessary)
- Surprise defense ("only surprised x% of the time") (may not be necessary)

Player/weapon should store:
- Number of attacks (melee) - derived from level if proficient?
  - If I derive from level, then I'd have to know if the player 
    is proficient in the weapon they are using.
  - I think I need to do that, yeah.
- UA: specialization (bow/crossbow) (not yet)

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
- Combat choice: 
- Casting time
- Device activation time
- General action duration
- Overlap from previous rounds (most relevant for surprise)

Preferences should store:
- Missile firing rate per segment for surprise
  - FR (bow = 2)
  - FR * 3 (bow = 6)
  - FR * 3 if nocked, otherwise FR (bow = 6 or 2)
  - FR * 3 for round, per 10 segment (bow = 0.6)
  - FR * 3 for round, per 6 segment (bow = 1)
- When casting time starts by default
  - Start of round
  - Segment of opponents initiative die

## First step

Well, I already want to compress the weapon tables for the battle grid.
So I could make them rows with ids, and add reach, speed factor, and
firing rate.

I don't think I want to account for special properties of weapons.

## Status

Okay, this is done. For the weapons with ranges, I cried uncle and
only gave those weapons the numbers in the middle.

What's left:

- Player
- Player/Weapon
- Source/Target
- Battle Grid
- Preferences