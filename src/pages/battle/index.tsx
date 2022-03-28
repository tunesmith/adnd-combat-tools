import { useMemo, useReducer, useRef } from "react";
import { useTable, Column } from "react-table";
import styles from "./battle.module.css";
import BattleInput from "./BattleInput";
import CellOutput from "./CellOutput";

/**
 * TODO:
 *  - Monsters can wield weapons! Fix weapon options for monsters (both tools)
 *  - Why isn't armor/weapons being properly calculated for battle table?
 *  - Why can't I choose weapons for some rows/columns?
 *  - Look and feel
 *  - Add rows/columns
 * @constructor
 */
const Battle = () => {
  console.log("rendering Battle");
  const initialCreature = {
    class: "monster",
    level: "1",
    armorType: " ",
    armorClass: 5,
    weapon: "No Weapon (Monster)",
  };
  const initialState = [
    [{}, initialCreature, initialCreature],
    [initialCreature, {}, {}],
    [initialCreature, {}, {}],
    [initialCreature, {}, {}],
  ];
  // console.log("initialState", initialState);
  // const tempState = [...initialState];
  const previousState = useRef(initialState);
  const reducer = (thisState, action) => {
    // console.log(`row: ${action.row}; col: ${action.col}`);
    // console.log("creature: ", action.creature);
    const newState = thisState.map((outer, outerIndex) => {
      // console.log(`outerIndex: ${outerIndex}`);
      if (outerIndex === action.row) {
        // console.log("found row match");
        return outer.map((inner, innerIndex) => {
          // console.log(`innerIndex: ${innerIndex}`);
          if (innerIndex === action.col) {
            // console.log("found col match, returning action.creature");
            // console.log(action.creature);
            return action.creature;
          } else return inner;
        });
      } else return outer.slice();
    });
    // console.log("newState: ", newState);
    return newState;
    // const newState = [
    //   ...thisState,
    //   (thisState[action.row][action.col] = action.stats),
    //   // thisState(([action.row] = [initialCreature, {}, {}])),
    // ];
    // console.log(newState);
    // return newState;
    // return (...thisState);
    // console.log("thisState: ", thisState);
    // console.log("oldState: ", previousState.current);
    // // state[action.row][action.col] = action.stats;
    //
    // const newState = [
    //   ...thisState,
    //   (thisState[action.row] = [action.stats, {}, {}]),
    //   // (state[action.row][action.col] = action.stats)
    // ];
    // console.log("newState: ", newState);
    // previousState.current = newState;
    // return newState;
    // // state[action.row][action.col] = action.stats;
    // // return state;
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  // useEffect(() => {
  //   dispatch({
  //     row: 0,
  //     col: 2,
  //     creature: {
  //       class: "cleric",
  //       level: "6",
  //       weapon: "Hammer (hurled)",
  //       armorClass: 5,
  //       armorType: " ",
  //     },
  //   });
  // }, []);

  const columns = useMemo<Column[]>(
    () => [
      {
        Header: <div className={styles.tableTitle}>Battle Grid</div>,
        accessor: "col0",
      },
      {
        Header: () => (
          <BattleInput
            row={0}
            col={1}
            creature={state[0][1]}
            dispatch={dispatch}
          />
        ),
        accessor: "col1",
        Cell: (row) => {
          return (
            <CellOutput red={state[row.row.index + 1][0]} green={state[0][1]} />
          );
        },
      },
      {
        Header: (
          <BattleInput
            row={0}
            col={2}
            creature={state[0][2]}
            dispatch={dispatch}
          />
        ),
        accessor: "col2",
        Cell: (row) => {
          return (
            <CellOutput red={state[row.row.index + 1][0]} green={state[0][2]} />
          );
        },
      },
    ],
    [state]
  );
  const data = useMemo(
    () => [
      {
        col0: (
          <BattleInput
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
    // apply the table props
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
  );
};

export default Battle;
