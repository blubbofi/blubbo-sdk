import { ConstantsByDeployment, ContractInteraction } from "../src/index";
import { TonClient } from "@ton/ton";

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
          ConstantsByDeployment.testnet_2024_10_22_847a54a.Reserves.normal
            .TONCOIN,
        ),
      );
    } catch (e) {
      fail(e);
    }
  });
});
