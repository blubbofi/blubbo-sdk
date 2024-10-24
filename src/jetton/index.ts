import { Address, TonClient } from "@ton/ton";
import { JettonMinter } from "./jetton_minter";
import { JettonWallet } from "./jetton_wallet";

export * from "./jetton_constants";
export * from "./jetton_minter";
export * from "./jetton_wallet";

/**
 * Get a jetton wallet for an owner address.
 * Works on standard jetton minter/wallet contracts.
 * Does not work on nonstandard jetton minter contracts that DO NOT
 * implement `get_wallet_address`.
 */
export async function getStandardJettonWalletForAddress(args: {
  tonClient: TonClient;
  address: {
    owner: Address;
    jettonMinter: Address;
  };
}) {
  const minter = args.tonClient.open(
    JettonMinter.createFromAddress(args.address.jettonMinter),
  );
  const jettonWalletAddress = await minter.getWalletAddress(args.address.owner);
  const jettonWallet = args.tonClient.open(
    JettonWallet.createFromAddress(jettonWalletAddress),
  );

  return jettonWallet;
}
