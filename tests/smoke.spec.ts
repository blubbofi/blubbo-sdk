import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, ".env") });

import {
  ConstantsByDeployment,
  ContractInteraction,
  getStandardJettonWalletForAddress,
  BeachUserUtils,
  BeachMaster,
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
    const client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
      apiKey: TONCENTER_API_KEY,
    });
    const contractInteraction = new ContractInteraction({
      client,
      addressBook: {
        beachMaster:
          ConstantsByDeployment.testnet_2024_10_22_847a54a.AddressBook
            .BEACH_MASTER,
        sotw: ConstantsByDeployment.testnet_2024_10_22_847a54a.AddressBook.SOTW,
      },
      constantsByDeployment: ConstantsByDeployment.testnet_2024_10_22_847a54a,
    });
    try {
      await contractInteraction.beachMaster.getReserve(
        BigInt(
          ConstantsByDeployment.testnet_2024_10_22_847a54a.Reserves.bySymbol.TON
            .id,
        ),
      );
    } catch (e) {
      fail(e);
    }
  });

  it(`should get jetton wallet for owner address`, async () => {
    const client = new TonClient({
      // We're on mainnet for this one
      endpoint: "https://toncenter.com/api/v2/jsonRPC",
      apiKey: TONCENTER_API_KEY,
    });

    // https://tonviewer.com/EQAVkAV5mRv5O1H6qZNRuhY4FdJlInqoz4n-_LThUZ0TbJxE/jetton/EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav
    const expectedJettonWalletAddress = Address.parse(
      `EQC0yj5mT3jND5VWPCpAC_nqErRMtXyurNO291J4PcWjmi1I`,
    );

    const jettonWalletAddress = await getStandardJettonWalletForAddress({
      tonClient: client,
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
      jettonWalletAddress.address.equals(expectedJettonWalletAddress),
    ).toBe(true);
  });

  it(`should give beach user address testnet_2024_10_25_687c2cb`, async () => {
    const ownerAddress = Address.parse(
      `EQC0yj5mT3jND5VWPCpAC_nqErRMtXyurNO291J4PcWjmi1I`,
    );
    const calculatedAddress =
      BeachUserUtils.testnet_2024_10_25_687c2cb.calculateUserBeachUserAddress(
        ownerAddress,
        ConstantsByDeployment.testnet_2024_10_25_687c2cb.AddressBook
          .BEACH_MASTER,
        ConstantsByDeployment.testnet_2024_10_25_687c2cb.Config.BEACH_USER,
      );

    const client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
      apiKey: TONCENTER_API_KEY,
    });
    const bm = client.open(
      BeachMaster.createFromAddress(
        ConstantsByDeployment.testnet_2024_10_25_687c2cb.AddressBook
          .BEACH_MASTER,
      ),
    );
    const answerfromBlockchain = await bm.getBeachUserAddress(ownerAddress);

    expect(calculatedAddress.equals(answerfromBlockchain)).toBe(true);
  });
});
