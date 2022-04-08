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

/**
 * TODO:
 *  - Compress data representation for slightly shorter urls
 *  - Allow classes to pick empty armor for if DM doesn't use weapon adjustments?
 * @constructor
 */
interface Creature {
  class: string;
  level: string;
  armorType: number;
  armorClass: number;
  weapon: number;
}
interface BattleProps {
  rememberedState?: (Creature | {})[][];
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
      class: "monster",
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

  const reducer = (thisState, action) => {
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
            index === 0 ? { key: incCounter(), ...initialCreature } : {}
          )
        );
      case ADD_ROW: {
        const innerLength = thisState[0].length;
        const freshRow = [{ key: incCounter(), ...initialCreature }].concat(
          innerLength > 1 ? Array(innerLength - 1).fill({}) : []
        );
        return thisState.concat([freshRow]);
      }
      default: // CHANGE_CREATURE
        return thisState.map((outer, outerIndex) => {
          if (outerIndex === action.row) {
            return outer.map((inner, innerIndex) => {
              if (innerIndex === action.col) {
                return action.creature;
              } else return inner;
            });
          } else return outer.slice();
        });
    }
  };

  const emptyState = useMemo(
    () => [
      [
        {},
        { key: incCounter(), ...initialCreature },
        { key: incCounter(), ...initialCreature },
      ],
      [{ key: incCounter(), ...initialCreature }, {}, {}],
      [{ key: incCounter(), ...initialCreature }, {}, {}],
      [{ key: incCounter(), ...initialCreature }, {}, {}],
    ],
    [initialCreature]
  );

  const initialState: (Creature | {})[][] = useMemo(() => {
    if (rememberedState) {
      return rememberedState;
    }
    return emptyState;
  }, [emptyState, rememberedState]);

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    deflate(JSON.stringify({ version: 3, state }), (err, buffer) => {
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
    (row, columnNumber) => (
      <CellOutput
        red={state[row.row.index + 1][0]}
        green={state[0][columnNumber]}
      />
    ),
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
        state[0].slice(1).map((creature, index) => ({
          Header: (
            <BattleInput
              key={creature.key}
              row={0}
              col={index + 1}
              creature={creature}
              dispatch={dispatch}
            />
          ),
          accessor: `col${index + 1}`,
          Cell: (row) => getCellOutput(row, index + 1),
        }))
      ),
    [getCellOutput, state]
  );

  const data = useMemo(
    () =>
      state.slice(1).map((row, index) => {
        return {
          col0: (
            <BattleInput
              key={row[0].key}
              row={index + 1}
              col={0}
              creature={row[0]}
              dispatch={dispatch}
            />
          ),
        };
      }),
    [state]
  );

  const tableInstance = useTable({
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
