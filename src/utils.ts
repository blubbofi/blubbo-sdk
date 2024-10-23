import { Cell } from "@ton/core";

export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function buildCellFromBocHex({ bocHex }: { bocHex: string }): Cell {
  assert(!bocHex.startsWith("0x"), `Expected bocHex to not start with 0x`);

  const cells = Cell.fromBoc(Buffer.from(bocHex, "hex"));

  assert(cells.length === 1, `Expected exactly one cell in the boc`);

  const cell = cells[0]!;

  return cell;
}
