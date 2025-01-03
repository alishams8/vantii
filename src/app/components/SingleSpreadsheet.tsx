import React, { useState } from 'react';
import { SpreadsheetData } from '@/types';

interface SingleSpreadsheetProps {
  spreadsheet: SpreadsheetData;
  setSpreadsheet: (spreadsheet: SpreadsheetData) => void;
}

const SingleSpreadsheet: React.FC<SingleSpreadsheetProps> = ({
  spreadsheet,
  setSpreadsheet,
}) => {
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const handleAddColumn = () => {
    const currentColumns = spreadsheet.rows[0]?.cells.length || 0;
    
    const position = window.prompt(`Enter the position where you want to add the column (1 to ${currentColumns + 1}):`);
    const columnIndex = position ? parseInt(position) - 1 : null;

    if (columnIndex === null || isNaN(columnIndex) || columnIndex < 0 || columnIndex > currentColumns) {
      alert("Please enter a valid column position");
      return;
    }

    const newRows = spreadsheet.rows.map((row: Row) => {
      const newCells = [...row.cells];
      newCells.splice(columnIndex, 0, { value: "" });
      return {
        ...row,
        cells: newCells
      };
    });

    setSpreadsheet({
      ...spreadsheet,
      rows: newRows
    });
  };

  const handleDeleteColumn = () => {
    const position = window.prompt("Enter the column number you want to delete (1 to " + spreadsheet.rows[0]?.cells.length + "):");
    const columnIndex = position ? parseInt(position) - 1 : null;

    if (columnIndex === null || isNaN(columnIndex) || columnIndex < 0 || columnIndex >= spreadsheet.rows[0]?.cells.length) {
      alert("Please enter a valid column number");
      return;
    }

    if (spreadsheet.rows[0]?.cells.length <= 1) {
      alert("Cannot delete the last column");
      return;
    }

    const newRows = spreadsheet.rows.map((row: Row) => ({
      cells: row.cells.filter((_: Cell, index: number) => index !== columnIndex)
    }));

    setSpreadsheet({
      ...spreadsheet,
      rows: newRows
    });
  };

  const handleAddRow = () => {
    const position = window.prompt("Enter the position where you want to add the row (1 to " + (spreadsheet.rows.length + 1) + "):");
    const rowIndex = position ? parseInt(position) - 1 : null;

    if (rowIndex === null || isNaN(rowIndex) || rowIndex < 0 || rowIndex > spreadsheet.rows.length) {
      alert("Please enter a valid row position");
      return;
    }

    const numberOfColumns = spreadsheet.rows[0]?.cells?.length || 1;
    const newRow = {
      cells: Array(numberOfColumns).fill(null).map(() => ({ value: "" }))
    };

    const newRows = [
      ...spreadsheet.rows.slice(0, rowIndex),
      newRow,
      ...spreadsheet.rows.slice(rowIndex)
    ];

    setSpreadsheet({
      ...spreadsheet,
      rows: newRows
    });
  };

  const handleDeleteRow = () => {
    const position = window.prompt("Enter the row number you want to delete (1 to " + spreadsheet.rows.length + "):");
    const rowIndex = position ? parseInt(position) - 1 : null;

    if (rowIndex === null || isNaN(rowIndex) || rowIndex < 0 || rowIndex >= spreadsheet.rows.length) {
      alert("Please enter a valid row number");
      return;
    }

    if (spreadsheet.rows.length <= 1) {
      alert("Cannot delete the last row");
      return;
    }

    const newRows = spreadsheet.rows.filter((_: Row, index: number) => index !== rowIndex);

    setSpreadsheet({
      ...spreadsheet,
      rows: newRows
    });
  };

  const normalizedRows = spreadsheet?.rows?.map((row: Row) => ({
    ...row,
    cells: row.cells?.map((cell: Cell) => ({
      value: cell?.value || ""
    })) || []
  })) || [];

  return (
    <div className="w-full overflow-x-auto bg-gray-100 p-4">
      {/* Multiple style approaches to override with darker blue tone */}
      <div className="flex items-center mb-6 px-2 w-full [&>*]:!text-[#182558]">
        <h2 
          className="text-lg font-medium w-full break-all !text-[#182558]"
          style={{ 
            color: '#182558 !important',
            WebkitTextFillColor: '#182558',
            '--tw-text-opacity': '1',
            '--text-color': '#182558'
          }}
        >
          {spreadsheet.title || "Untitled Spreadsheet"}
        </h2>
      </div>

      <div className="relative">
        {/* Column numbers */}
        <div className="flex ml-8">
          <div className="w-8" />
          {normalizedRows[0]?.cells.map((_, index) => (
            <div
              key={index}
              className="flex justify-center min-w-[150px] text-gray-400 text-sm"
              style={{ color: '#9CA3AF' }}
            >
              {index + 1}
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Row numbers */}
          <div className="flex flex-col">
            {normalizedRows.map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-center w-8 h-[41px] text-gray-400 text-sm"
                style={{ color: '#9CA3AF' }}
              >
                {index + 1}
              </div>
            ))}
          </div>

          {/* Spreadsheet table */}
          <div className="flex-grow">
            <table className="w-full border-collapse bg-gray-100">
              <tbody>
                {normalizedRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="h-[41px]">
                    {row.cells.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex}
                        className="border border-gray-300 p-0 bg-gray-50"
                      >
                        <input
                          type="text"
                          value={cell.value}
                          aria-label={`Cell ${rowIndex + 1}-${cellIndex + 1}`}
                          onChange={(e) => {
                            const newSpreadsheet = {
                              ...spreadsheet,
                              rows: spreadsheet.rows.map((r: Row, rIndex: number) => 
                                rIndex === rowIndex
                                  ? {
                                      ...r,
                                      cells: r.cells.map((c: Cell, cIndex: number) =>
                                        cIndex === cellIndex
                                          ? { value: e.target.value }
                                          : c
                                      )
                                    }
                                  : r
                              )
                            };
                            setSpreadsheet(newSpreadsheet);
                          }}
                          style={{
                            color: 'black',
                            width: '100%',
                            padding: '8px',
                            border: 'none',
                            outline: 'none',
                            backgroundColor: '#F9FAFB',
                            minWidth: '150px',
                            height: '41px'
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Updated buttons section with explicit style overrides */}
      <div className="flex justify-center items-center gap-2 mt-6 border-t border-gray-300 pt-4 bg-gray-100">
        <button
          onClick={handleAddColumn}
          className="px-3 py-1 text-sm rounded"
          style={{ 
            color: 'black',
            backgroundColor: '#F3F4F6',
            border: 'none',
            background: '#F3F4F6',
            boxShadow: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none'
          }}
        >
          Add Column
        </button>

        <div className="w-px h-6 bg-gray-300" />

        <button
          onClick={handleDeleteColumn}
          className="px-3 py-1 text-sm rounded"
          style={{ 
            color: 'black',
            backgroundColor: '#F3F4F6',
            border: 'none',
            background: '#F3F4F6',
            boxShadow: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none'
          }}
        >
          Delete Column
        </button>

        <div className="w-px h-6 bg-gray-300" />

        <button
          onClick={handleAddRow}
          className="px-3 py-1 text-sm rounded"
          style={{ 
            color: 'black',
            backgroundColor: '#F3F4F6',
            border: 'none',
            background: '#F3F4F6',
            boxShadow: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none'
          }}
        >
          Add Row
        </button>

        <div className="w-px h-6 bg-gray-300" />

        <button
          onClick={handleDeleteRow}
          className="px-3 py-1 text-sm rounded"
          style={{ 
            color: 'black',
            backgroundColor: '#F3F4F6',
            border: 'none',
            background: '#F3F4F6',
            boxShadow: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none'
          }}
        >
          Delete Row
        </button>
      </div>
    </div>
  );
};

export default SingleSpreadsheet;


