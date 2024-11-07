import { hexlify, toUtf8Bytes } from "ethers/lib/utils";

export class RedstoneOracleConstants {
  static DATA_FEEDS = ["TON", "USDT"];
  static HEXLIFIED_DATA_FEEDS = RedstoneOracleConstants.DATA_FEEDS.map(
    (dataFeedId) => RedstoneOracleConstants.hexlifyStr(dataFeedId),
  );
  static DATA_SERVICE_ID = "redstone-primary-prod";
  static UNIQUE_SIGNERS_COUNT = 3 as const;
  static GATEWAY_URLS = [
    "https://oracle-gateway-1.a.redstone.finance",
    "https://oracle-gateway-2.a.redstone.finance",
  ];
  static MAX_TIMESTAMP_DEVIATION_MS = 30 * 1000;
  static REDSTONE_DECIMALS = 8 as const;

  // Directly copied from https://github.com/evaafi/merkle-oracles-pub/blob/fbe3a92ba82553359815bda43d64f0997665e43a/src/constants.ts#L1
  static PRICE_TTL_MS = 30 * 1000;
  static ORACLE_RETRY_COUNT = 3;
  static ORACLE_RETRY_DELAY_MS = 1000;
  static RPC_RETRY_COUNT = 2;
  static RPC_RETRY_DELAY_MS = 1000;
  // Direcly copied from https://github.com/redstone-finance/redstone-oracles-monorepo/blob/281e41517a54ae0d9a9c0c30c39d0ccf15950d68/packages/evm-connector/contracts/data-services/PrimaryProdDataServiceConsumerBase.sol#L19-L31
  static AUTHORIZED_SIGNER_ADDRESSES = [
    "0x8BB8F32Df04c8b654987DAaeD53D6B6091e3B774",
    "0xdEB22f54738d54976C4c0fe5ce6d408E40d88499",
    "0x51Ce04Be4b3E32572C4Ec9135221d0691Ba7d202",
    "0xDD682daEC5A90dD295d14DA4b0bec9281017b5bE",
    "0x9c5AE89C4Af6aA32cE58588DBaF90d18a855B6de",
  ];
  static AUTHORIZED_SIGNER_ADDRESSES_BIGINT_SET = new Set(
    RedstoneOracleConstants.AUTHORIZED_SIGNER_ADDRESSES.map((address) =>
      BigInt(address),
    ),
  );

  static hexlifyStr(value: string): string {
    return hexlify(toUtf8Bytes(value));
  }
}
