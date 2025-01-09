import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, ".env") });

import {
  ConstantsByDeployment,
  ContractInteraction,
  getStandardJettonWalletForAddress,
  OwnerUpgradable,
  BlubboMaster,
  TonClientWithFallbacks,
} from "../src/index";
import { Address, TonClient } from "@ton/ton";

const TONCENTER_API_KEY = process.env["TONCENTER_API_KEY"] as
  | string
  | undefined;

if (!TONCENTER_API_KEY) {
  throw new Error("TONCENTER_API_KEY env variable is required");
}

describe("Smoke tests", () => {
  it(`should get reserve`, async () => {
    const tonClientWithFallbacks = new TonClientWithFallbacks(
      {
        endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
        apiKey: TONCENTER_API_KEY,
      },
      [],
      {
        retryTimes: 3,
        retryIntervalMs: 2000,
      },
    );
    const contractInteraction = new ContractInteraction({
      client: tonClientWithFallbacks,
      addressBook: {
        blubboMaster:
          ConstantsByDeployment.testnet_2024_10_22_847a54a.AddressBook
            .BLUBBO_MASTER,
        sotw: ConstantsByDeployment.testnet_2024_10_22_847a54a.AddressBook.SOTW,
      },
      constantsByDeployment: ConstantsByDeployment.testnet_2024_10_22_847a54a,
    });
    await contractInteraction.init();
    await contractInteraction.blubboMaster.callAsyncMethod(
      `getReserve`,
      BigInt(
        ConstantsByDeployment.testnet_2024_10_22_847a54a.Reserves.bySymbol.TON
          .id,
      ),
    );
  });

  it(`should get jetton wallet for owner address`, async () => {
    const tonClientWithFallbacks = new TonClientWithFallbacks(
      {
        // We're on mainnet for this one
        endpoint: "https://toncenter.com/api/v2/jsonRPC",
        apiKey: TONCENTER_API_KEY,
      },
      [],
      {
        retryTimes: 3,
        retryIntervalMs: 2000,
      },
    );

    // https://tonviewer.com/EQAVkAV5mRv5O1H6qZNRuhY4FdJlInqoz4n-_LThUZ0TbJxE/jetton/EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav
    const expectedJettonWalletAddress = Address.parse(
      `EQC0yj5mT3jND5VWPCpAC_nqErRMtXyurNO291J4PcWjmi1I`,
    );

    const jettonWalletContract = await getStandardJettonWalletForAddress({
      tonClient: tonClientWithFallbacks,
      address: {
        owner: Address.parse(
          `UQAVkAV5mRv5O1H6qZNRuhY4FdJlInqoz4n-_LThUZ0TbMGB`,
        ),
        // Mainnet tsTON jetton minter
        jettonMinter: Address.parse(
          `EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav`,
        ),
      },
    });

    expect(
      jettonWalletContract
        .getPrimary()
        .address.equals(expectedJettonWalletAddress),
    ).toBe(true);
  });

  it(`should give a correct blubbo user address on testnet_2025_01_09_5bb79bf`, async () => {
    const ownerAddress = Address.parse(
      `EQC0yj5mT3jND5VWPCpAC_nqErRMtXyurNO291J4PcWjmi1I`,
    );
    const calculatedAddress =
      OwnerUpgradable.calculate_owner_upgradable_address(
        ownerAddress,
        ConstantsByDeployment.testnet_2025_01_09_5bb79bf.AddressBook
          .BLUBBO_MASTER,
        ConstantsByDeployment.testnet_2025_01_09_5bb79bf.Config
          .OWNER_UPGRADABLE,
      );

    const client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
      apiKey: TONCENTER_API_KEY,
    });
    const bm = client.open(
      BlubboMaster.createFromAddress(
        ConstantsByDeployment.testnet_2025_01_09_5bb79bf.AddressBook
          .BLUBBO_MASTER,
      ),
    );
    const answerfromBlockchain = await bm.getBlubboUserAddress(ownerAddress);

    expect(calculatedAddress.equals(answerfromBlockchain)).toBe(true);
  });
});
