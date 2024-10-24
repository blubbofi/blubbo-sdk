import {
  ConstantsByDeployment,
  ContractInteraction,
  getStandardJettonWalletForAddress,
} from "../src/index";
import { Address, TonClient } from "@ton/ton";

describe("Smoke tests", () => {
  it(`should get reserve`, async () => {
    const client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
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
});
