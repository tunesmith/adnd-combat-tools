import { useCallback, useMemo, useReducer, useRef } from "react";
import { useTable, Column } from "react-table";
import styles from "./battle.module.css";
import BattleInput from "./BattleInput";
import CellOutput from "./CellOutput";
import {
  ADD_COLUMN,
  ADD_ROW,
  DELETE_COLUMN,
  DELETE_ROW,
} from "../../helpers/BattleMessage";

/**
 * TODO:
 *  - Expanded armor types for better display
 *  - Minimum cell width to fit font?
 *  - Confirmation portal for deletion
 *  - Shareable url - compress data representation
 * @constructor
 */
const Battle = () => {
  const idCounter = useRef<number>(0);
  const initialCreature = useMemo(
    () => ({
      class: "monster",
      level: "1",
      armorType: " ",
      armorClass: 5,
      weapon: "Natural Weapon (Monster)",
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
          row.filter((col, index) => index !== action.col)
        );
      case DELETE_ROW:
        return thisState.filter((row, index) => index !== action.row);
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

  const initialState = useMemo(
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

  const [state, dispatch] = useReducer(reducer, initialState);

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
            <div className={styles.tableTitle}>
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
      <div className={styles.container}>
        <div className={styles.addColumn}>
          <button
            className={styles.buttonAddColumn}
            onClick={() => dispatch({ type: ADD_COLUMN })}
          >
            +
          </button>
        </div>
        <table className={styles.myBorder} {...getTableProps()}>
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
        <div className={styles.addRow}>
          <button
            className={styles.buttonAddRow}
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
