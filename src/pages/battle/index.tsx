import { useMemo, useReducer, useRef } from "react";
import { useTable, Column } from "react-table";
import styles from "./battle.module.css";
import BattleInput from "./BattleInput";
import CellOutput from "./CellOutput";

/**
 * TODO:
 *  - Add rows/columns
 *  - Expanded armor types for better display
 *  - Minimum cell width to fit font?
 * @constructor
 */
const Battle = () => {
  const initialCreature = {
    class: "monster",
    level: "1",
    armorType: " ",
    armorClass: 5,
    weapon: "Natural Weapon (Monster)",
  };
  const initialState = [
    [{}, initialCreature, initialCreature],
    [initialCreature, {}, {}],
    [initialCreature, {}, {}],
    [initialCreature, {}, {}],
  ];
  const reducer = (thisState, action) => {
    // TODO add a type for changing a cell, below.
    // TODO then a type for adding a column, adding a row,
    // TODO then a type for removing a column, removing a row
    // Try transpose, remove row, transpose back? Faster than removing column?
    //  https://stackoverflow.com/questions/17428587/transposing-a-2d-array-in-javascript
    switch (action.type) {
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

  const [state, dispatch] = useReducer(reducer, initialState);

  const getCellOutput = (row, columnNumber) => (
    <CellOutput
      red={state[row.row.index + 1][0]}
      green={state[0][columnNumber]}
    />
  );

  const columns = useMemo<Column[]>(
    () => [
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
      {
        Header: (
          <BattleInput
            key={"0-1"}
            row={0}
            col={1}
            creature={state[0][1]}
            dispatch={dispatch}
          />
        ),
        accessor: "col1",
        Cell: (row) => getCellOutput(row, 1),
      },
      {
        Header: (
          <BattleInput
            key={"0-2"}
            row={0}
            col={2}
            creature={state[0][2]}
            dispatch={dispatch}
          />
        ),
        accessor: "col2",
        Cell: (row) => getCellOutput(row, 2),
      },
    ],
    [state]
  );
  const data = useMemo(
    () => [
      {
        col0: (
          <BattleInput
            key={"1-0"}
            row={1}
            col={0}
            creature={state[1][0]}
            dispatch={dispatch}
          />
        ),
      },
      {
        col0: (
          <BattleInput
            key={"2-0"}
            row={2}
            col={0}
            creature={state[2][0]}
            dispatch={dispatch}
          />
        ),
      },
      {
        col0: (
          <BattleInput
            key={"3-0"}
            row={3}
            col={0}
            creature={state[3][0]}
            dispatch={dispatch}
          />
        ),
      },
    ],
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
      <table className={styles.myBorder} {...getTableProps()}>
        <thead>
          {
            // Loop over the header rows
            headerGroups.map((headerGroup) => (
              // Apply the header row props
              <tr {...headerGroup.getHeaderGroupProps()}>
                {
                  // Loop over the headers in each row
                  headerGroup.headers.map((column) => (
                    // Apply the header cell props
                    <th {...column.getHeaderProps()}>
                      {
                        // Render the header
                        column.render("Header")
                      }
                    </th>
                  ))
                }
              </tr>
            ))
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
                <tr {...row.getRowProps()}>
                  {
                    // Loop over the rows cells
                    row.cells.map((cell) => {
                      // Apply the cell props
                      return (
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
    </div>
  );
};

export default Battle;
