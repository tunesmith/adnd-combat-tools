### Room no monster

- Door 14: room
- Room 15: 20x40
- Exits 12: zero exits
- Contents 15: monster and treasure
- Monster level 17: Two
- Monster 22: Character party

Result: Detail mode looks good; but compact mode says:

> Beyond the door is a room.
>
> The room is rectangular and 20' x 40'. A monster and treasure are present. TODO treasure. There are no other doors. Check once per 10' for 25% chance of secret door (characters would still need to detect).

In other words, no output about the monster.

### Room Level

Rolling for a monster in a room appears not to pay attention to level, always defaulting to level 1. For instance, if I am Dungeon Level 4, when I'm in a room that indicates a monster is present, when it comes time to roll the monster level, I get a monster level of 1 on a roll of 1-16 (indicating it is assuming I'm on Dungeon Level 1), when I should only get a monster level of 1 on a roll of 1-5 (since I'm on Dungeon level 4).
