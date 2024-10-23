/**
 * Directly copied from https://github.com/redstone-finance/redstone-oracles-monorepo/blob/281e41517a54ae0d9a9c0c30c39d0ccf15950d68/packages/ton-connector/src/ton-utils.ts
 * because it's not exported from the package
 */
import { beginCell, TupleBuilder } from '@ton/core';
import { arrayify } from 'ethers/lib/utils';

export function createTupleItems(items: (bigint | boolean | number | string)[]) {
    const tuple = new TupleBuilder();

    items.forEach((value) => tuple.writeNumber(BigInt(value)));

    return tuple.build();
}

export function createBuilderFromString(value: string) {
    return beginCell().storeBuffer(Buffer.from(arrayify(value.startsWith('0x') ? value : '0x' + value)));
}
