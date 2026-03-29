import type { PartyResult } from '../models/character/characterSheet';
import type { MonsterLevel } from '../features/monsters/monsterLevel/monsterLevelTable';
import type { Human } from '../features/monsters/human/humanTable';
import type { MonsterOne } from '../features/monsters/monsterOne/monsterOneTables';
import type { MonsterTwo } from '../features/monsters/monsterTwo/monsterTwoTable';
import type {
  MonsterThree,
  DragonThree,
} from '../features/monsters/monsterThree/monsterThreeTables';
import type {
  MonsterFour,
  DragonFourYounger,
  DragonFourOlder,
} from '../features/monsters/monsterFour/monsterFourTables';
import type {
  MonsterFive,
  DragonFiveYounger,
  DragonFiveOlder,
} from '../features/monsters/monsterFive/monsterFiveTables';
import type {
  MonsterSix,
  DragonSix,
} from '../features/monsters/monsterSix/monsterSixTables';
import type {
  MonsterSeven,
  DragonSeven,
} from '../features/monsters/monsterSeven/monsterSevenTables';
import type {
  MonsterEight,
  DragonEight,
} from '../features/monsters/monsterEight/monsterEightTables';
import type {
  MonsterNine,
  DragonNine,
} from '../features/monsters/monsterNine/monsterNineTables';
import type {
  MonsterTen,
  DragonTen,
} from '../features/monsters/monsterTen/monsterTenTables';
import type { DungeonLevelResultOutcomeEvent } from './outcomeEventPrimitives';

type MonsterTextOutcomeEvent<
  Kind extends string,
  TResult
> = DungeonLevelResultOutcomeEvent<Kind, TResult> & {
  text?: string;
  party?: PartyResult;
};

type DragonTextOutcomeEvent<
  Kind extends string,
  TResult
> = DungeonLevelResultOutcomeEvent<Kind, TResult> & {
  text: string;
};

export type MonsterOutcomeEvent =
  | DungeonLevelResultOutcomeEvent<'monsterLevel', MonsterLevel>
  | MonsterTextOutcomeEvent<'monsterOne', MonsterOne>
  | MonsterTextOutcomeEvent<'monsterTwo', MonsterTwo>
  | MonsterTextOutcomeEvent<'monsterThree', MonsterThree>
  | MonsterTextOutcomeEvent<'monsterFour', MonsterFour>
  | MonsterTextOutcomeEvent<'monsterFive', MonsterFive>
  | MonsterTextOutcomeEvent<'monsterSix', MonsterSix>
  | MonsterTextOutcomeEvent<'monsterSeven', MonsterSeven>
  | MonsterTextOutcomeEvent<'monsterEight', MonsterEight>
  | MonsterTextOutcomeEvent<'monsterNine', MonsterNine>
  | MonsterTextOutcomeEvent<'monsterTen', MonsterTen>
  | DragonTextOutcomeEvent<'dragonThree', DragonThree>
  | DragonTextOutcomeEvent<'dragonFourYounger', DragonFourYounger>
  | DragonTextOutcomeEvent<'dragonFourOlder', DragonFourOlder>
  | DragonTextOutcomeEvent<'dragonFiveYounger', DragonFiveYounger>
  | DragonTextOutcomeEvent<'dragonFiveOlder', DragonFiveOlder>
  | DragonTextOutcomeEvent<'dragonSix', DragonSix>
  | DragonTextOutcomeEvent<'dragonSeven', DragonSeven>
  | DragonTextOutcomeEvent<'dragonEight', DragonEight>
  | DragonTextOutcomeEvent<'dragonNine', DragonNine>
  | DragonTextOutcomeEvent<'dragonTen', DragonTen>
  | MonsterTextOutcomeEvent<'human', Human>;
