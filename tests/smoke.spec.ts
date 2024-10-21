import { Address } from "@ton/core";
import { BeachMaster } from "../src/index";
import { TonClient } from "@ton/ton";

describe("Smoke tests", () => {
  it(`should get reserve`, async () => {
    const client = new TonClient({
      endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
    });
    const beachMaster = BeachMaster.createFromAddress(
      Address.parseRaw(
        "0:2f26bab1011a5ece744b210240c651611815216b7eec32c3442968c5e9d186b5",
      ),
    );
    const beachMasterContract = client.open(beachMaster);
    try {
      await beachMasterContract.getReserve(0n);
    } catch (e) {
      fail(e);
    }
  });
});
