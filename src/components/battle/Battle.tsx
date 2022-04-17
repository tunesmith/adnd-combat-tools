import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  ADD_COLUMN,
  ADD_ROW,
  DELETE_COLUMN,
  DELETE_ROW,
} from "../../helpers/BattleMessage";
import { deflate } from "zlib";
import CellOutput from "./CellOutput";
import { Column, useTable } from "react-table";
import styles from "./battle.module.css";
import BattleInput from "./BattleInput";
import getConfig from "next/config";
import { Creature, EmptyObject, State, StateRow } from "../../types/creature";
import { MONSTER } from "../../tables/attackerClass";

/**
 * TODO:
 *  - Compress data representation for slightly shorter urls
 *  - Allow classes to pick empty armor for if DM doesn't use weapon adjustments?
 * @constructor
 */
interface BattleProps {
  rememberedState?: State;
}
export interface ReducerAction {
  type: number;
  col?: number;
  row?: number;
  creature?: Creature;
}
const Battle = ({ rememberedState }: BattleProps) => {
  const { publicRuntimeConfig } = getConfig();
  const { NODE_ENV } = publicRuntimeConfig;
  const [encodedGridState, setEncodedGridState] = useState<string | undefined>(
    undefined
  );
  const idCounter = useRef<number>(0);
  const initialCreature: Creature = useMemo(
    () => ({
      key: 0,
      class: MONSTER,
      level: "1",
      armorType: 1,
      armorClass: 5,
      weapon: 1,
    }),
    []
  );
  const incCounter = () => {
    idCounter.current++;
    return idCounter.current;
  };

  const reducer = (thisState: State, action: ReducerAction): State => {
    switch (action.type) {
      case DELETE_COLUMN:
        return thisState.map((row) =>
          row.filter((_, index) => index !== action.col)
        );
      case DELETE_ROW:
        return thisState.filter((_, index) => index !== action.row);
      case ADD_COLUMN:
        return thisState.map((row, index) =>
          row.concat(
            index === 0 ? { ...initialCreature, key: incCounter() } : {}
          )
        );
      case ADD_ROW: {
        const innerLength = thisState[0]?.length || 0;
        const freshRow = [{ ...initialCreature, key: incCounter() }].concat(
          innerLength > 1 ? Array(innerLength - 1).fill({}) : []
        );
        return thisState.concat([freshRow]);
      }
      default: // CHANGE_CREATURE
        return thisState.map((outer: StateRow, outerIndex: number) => {
          if (outerIndex === action.row) {
            return outer.map(
              (inner: EmptyObject | Creature, innerIndex: number) => {
                if (innerIndex === action.col) {
                  if (action.creature) {
                    return action.creature;
                  } else {
                    console.error(
                      "Unable to change creature: returning unedited creature instead"
                    );
                    return inner;
                  }
                } else return inner;
              }
            );
          } else return outer.slice();
        });
    }
  };

  const emptyState = useMemo(
    () => [
      [
        {},
        { ...initialCreature, key: incCounter() },
        { ...initialCreature, key: incCounter() },
      ],
      [{ ...initialCreature, key: incCounter() }, {}, {}],
      [{ ...initialCreature, key: incCounter() }, {}, {}],
      [{ ...initialCreature, key: incCounter() }, {}, {}],
    ],
    [initialCreature]
  );

  const initialState: State = useMemo(() => {
    if (rememberedState) {
      return rememberedState;
    }
    return emptyState;
  }, [emptyState, rememberedState]);

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    deflate(JSON.stringify({ version: 4, state }), (err, buffer) => {
      if (err) {
        console.error("An error occurred:", err);
        process.exitCode = 1;
      }
      setEncodedGridState(encodeURIComponent(buffer.toString("base64")));
    });
  }, [state]);

  useEffect(() => {
    return () => {
      console.log("unmounting Battle");
    };
  }, []);

  useEffect(() => {
    if (encodedGridState) {
      window.history.replaceState(
        {},
        "",
        NODE_ENV !== "production"
          ? `/battle?s=${encodedGridState}`
          : `/adnd-combat-tools/battle?s=${encodedGridState}`
      );
    }
  }, [NODE_ENV, encodedGridState]);

  const getCellOutput = useCallback(
    (row, columnNumber) => {
      // We want to pass in the info from the column/row headers to calculate the intersecting cell.
      const stateRow: StateRow | undefined = state[row.row.index + 1];
      if (stateRow && state[0] && stateRow[0] && state[0][columnNumber]) {
        /**
         * It would be better if I could define this in the type definition, but
         * I'm not sure there's a way to say that for a row, the first element is
         * always Creature, and the remaining elements are empty. This would probably
         * require a new data structure in the future since the 2d grid is kind of
         * wasteful anyway.
         */
        return (
          <CellOutput
            red={stateRow[0] as Creature}
            green={state[0][columnNumber] as Creature}
          />
        );
      } else {
        return <></>;
      }
    },
    [state]
  );

  const columns: Column[] = useMemo<Column[]>(
    () =>
      [
        {
          Header: (
            <div className={styles["tableTitle"]}>
              AD&D
              <br />
              Battle Grid
            </div>
          ),
          accessor: "col0",
        },
      ].concat(
        state[0]
          ? state[0].slice(1).map((creature, index) => ({
              Header: (
                <BattleInput
                  key={creature.key}
                  row={0}
                  col={index + 1}
                  creature={creature as Creature}
                  dispatch={dispatch}
                />
              ),
              accessor: `col${index + 1}`,
              Cell: (row: StateRow) => getCellOutput(row, index + 1),
            }))
          : []
      ),
    [getCellOutput, state]
  );

  const data = useMemo(
    () =>
      state.slice(1).map((row, index) => {
        if (row[0]) {
          return {
            col0: (
              <BattleInput
                key={row[0].key}
                row={index + 1}
                col={0}
                creature={row[0] as Creature}
                dispatch={dispatch}
              />
            ),
          };
        } else {
          console.error(`Could note render BattleInput for row: ${index}`);
          return <></>;
        }
      }),
    [state]
  );

  const tableInstance = useTable({
    // @ts-ignore because I don't know how to type dynamic columns and rows
    columns,
    data,
  });

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  return (
    <div id={"app-modal"}>
      <div className={styles["container"]}>
        <div className={styles["addColumn"]}>
          <button
            className={styles["buttonAddColumn"]}
            onClick={() => dispatch({ type: ADD_COLUMN })}
          >
            +
          </button>
        </div>
        <table className={styles["myBorder"]} {...getTableProps()}>
          <thead>
            {
              // Loop over the header rows
              headerGroups.map((headerGroup) => {
                const { key, ...restHeaderProps } =
                  headerGroup.getHeaderGroupProps();
                return (
                  // Apply the header row props
                  <tr key={key} {...restHeaderProps}>
                    {
                      // Loop over the headers in each row
                      headerGroup.headers.map((column) => {
                        const { key, ...restColumnHeaderProps } =
                          column.getHeaderProps();
                        return (
                          // Apply the header cell props
                          <th key={key} {...restColumnHeaderProps}>
                            {
                              // Render the header
                              column.render("Header")
                            }
                          </th>
                        );
                      })
                    }
                  </tr>
                );
              })
            }
          </thead>
          <tbody {...getTableBodyProps()}>
            {
              // Loop over the table rows
              rows.map((row) => {
                // Prepare the row for display
                prepareRow(row);
                return (
                  // Apply the row props
                  // eslint-disable-next-line react/jsx-key
                  <tr {...row.getRowProps()}>
                    {
                      // Loop over the rows cells
                      row.cells.map((cell) => {
                        // Apply the cell props
                        return (
                          // eslint-disable-next-line react/jsx-key
                          <td {...cell.getCellProps()}>
                            {
                              // Render the cell contents
                              cell.render("Cell")
                            }
                          </td>
                        );
                      })
                    }
                  </tr>
                );
              })
            }
          </tbody>
        </table>
        <div className={styles["addRow"]}>
          <button
            className={styles["buttonAddRow"]}
            onClick={() => dispatch({ type: ADD_ROW })}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default Battle;
