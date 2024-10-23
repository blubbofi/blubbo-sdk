import { Address, toNano } from "@ton/core";

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
      TONCOIN: 0n,
      USDT: 1n,
    } as const,
    reverse: {
      0: "TONCOIN",
      1: "USDT",
    } as const,
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

export const ConstantsByDeployment = {
  testnet_2024_10_22_847a54a: {
    AddressBook: AddressBook.testnet_2024_10_22_847a54a,
    Reserves: Reserves.testnet_2024_10_22_847a54a,
    Fee: Fee.testnet_2024_10_22_847a54a,
  },
};

export type ConstantsByDeployment =
  (typeof ConstantsByDeployment)[keyof typeof ConstantsByDeployment];
