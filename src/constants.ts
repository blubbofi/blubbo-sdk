import { Address, toNano } from "@ton/core";
import { buildCellFromBocHex } from "./utils";

export const Lock = Object.freeze({
  UNLOCKED: 1n,
  LOCKED: 2n,
});

export const Opcode = Object.freeze({
  WITHDRAW_FROM_WALLET_TO_BEACH_MASTER: 1050,
  BORROW_FROM_WALLET_TO_BEACH_MASETER: 1090,
});

class AddressBook {
  public static testnet_2024_10_22_847a54a = Object.freeze({
    BEACH_MASTER: Address.parseRaw(
      "0:2f26bab1011a5ece744b210240c651611815216b7eec32c3442968c5e9d186b5",
    ),
    SOTW: Address.parseRaw(
      "0:6fd156e77b1532a3481b9c068ac218f8d94f8ce3d6b4b5f05813426693f0151a",
    ),
    MOCK_USDT_JETTON_MINTER: Address.parseRaw(
      "0:040b09b56d82c6503da20fe67a4ad6f963f34a37cdf3e1b47155eef0d26595d3",
    ),
  });
}

class Reserves {
  public static testnet_2024_10_22_847a54a = Object.freeze({
    normal: {
      TONCOIN: 0,
      USDT: 1,
    } as const,
    reverse: {
      0: "TONCOIN",
      1: "USDT",
    } as const,
    symbol: {
      0: "TON",
      1: "USDT",
    } as const,
    name: {
      0: "Toncoin",
      1: "Tether",
    },
  });
}

class Fee {
  public static testnet_2024_10_22_847a54a = Object.freeze({
    DEPOSIT: {
      TONCOIN: toNano("0.2"),
      OTHER: {
        TOTAL: toNano("0.2"),
        FORWARD: toNano("0.1"),
      },
    },
    WITHDRAW: {
      TONCOIN: toNano("0.17"),
      OTHER: toNano("0.17"),
    },
    BORROW: {
      TONCOIN: toNano("0.17"),
      OTHER: toNano(`0.17`),
    },
    REPAY: {
      TONCOIN: toNano("0.17"),
      OTHER: {
        TOTAL: toNano("0.2"),
        FORWARD: toNano("0.1"),
      },
    },
  });
}

class Config {
  public static testnet_2024_10_22_847a54a = Object.freeze({
    PAYLOAD: buildCellFromBocHex({
      bocHex: `b5ee9c724101090100de0002013801030118000002010000000055534454020112010000000000544f4e08014a00000502000000000000000000000000009c5ae89c4af6aa32ce58588dbaf90d18a855b6de0401440200000000000000000000000000dd682daec5a90dd295d14da4b0bec9281017b5be050144020000000000000000000000000051ce04be4b3e32572c4ec9135221d0691ba7d2020601440200000000000000000000000000deb22f54738d54976c4c0fe5ce6d408e40d8849907014402000000000000000000000000008bb8f32df04c8b654987daaed53d6b6091e3b774080000de146516`,
    }),
    SIGNATURE: buildCellFromBocHex({
      bocHex: `b5ee9c72410101010042000080b36f07b0ce06bdc33ee4ec8a836ba72cf85c160f7a007efcbe2c72034ce5e9f8beaaa56325734944fa954b2888b5ca477f910638ee1d770fefa7d12d4f4e79065d3c1570`,
    }),
  });
}

export const ConstantsByDeployment = {
  testnet_2024_10_22_847a54a: {
    AddressBook: AddressBook.testnet_2024_10_22_847a54a,
    Reserves: Reserves.testnet_2024_10_22_847a54a,
    Fee: Fee.testnet_2024_10_22_847a54a,
    Config: Config.testnet_2024_10_22_847a54a,
  },
};

export type ConstantsByDeployment =
  (typeof ConstantsByDeployment)[keyof typeof ConstantsByDeployment];
