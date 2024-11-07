import { TonClient } from "@ton/ton";
import { BlubboMaster, ConstantsByDeployment, TonClientWithFallbacks } from "../src";
import { getHttpEndpoint } from "@orbs-network/ton-access";

describe(`ton_client_with_fallbacks`, () => {
  it(`should get balance`, async () => {
    const tonClientWithFallbacks = new TonClientWithFallbacks({
      endpoint: `https://does.not.work`,
      }, [(async () => {
      const endpoint = await getHttpEndpoint({ network: `testnet` });
      return new TonClient({
        endpoint,
      }) 
    })()], {
      retryTimes: 1,
      retryIntervalMs: 2000,
    });
    const blubboMaster = await tonClientWithFallbacks.openWithFallbacks(BlubboMaster.createFromAddress(
      ConstantsByDeployment.testnet_2024_11_01_7513aa7.AddressBook.BLUBBO_MASTER,
    ))
    try {
      const reserve = await blubboMaster.callAsyncMethod(`getReserve`, 0n);
  
      console.log(reserve)
    } catch (e) {
      console.error(e);
      fail(e);
    }
  })
});