import { useCallback, useEffect, useState } from "react";
import { getGasPriceUrl } from "utils/configUtils";
import { useAppSlice } from "./selector";

export function usePrice() {
  const { updateFlag } = useAppSlice();

  const [gasPrice, setGasPrice] = useState(0);
  const [tokenPrice, setTokenPrice] = useState(0);
  const [lsdTokenPrice, setLsdTokenPrice] = useState(0);

  // todo:
  const fetchGasPrice = useCallback(async () => {
    try {
      // const response = await fetch(getGasPriceUrl(), {
      //   method: "GET",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });
      // const resJson = await response.json();
      // if (resJson && resJson.code === 200) {
      //   const { standard, priceUSD } = resJson.data;
      //   setGasPrice(standard);
      //   setTokenPrice(priceUSD);
      // }
    } catch (err: any) {}
  }, []);

  // const fetchTokenPrice = useCallback(async () => {
  //   try {
  //     const response = await fetch(getTokenPriceUrl(), {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     const resJson = await response.json();
  //     if (resJson) {
  //       console.log({ resJson });
  //       // const { usd } = resJson.binancecoin;
  //       // setTokenPrice(usd);
  //     }
  //   } catch (err: any) {}
  // }, []);

  // const fetchLsdTokenPrice = useCallback(async () => {
  //   try {
  //     const response = await fetch(getLsdTokenPriceUrl(), {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     const resJson = await response.json();
  //     if (resJson) {
  //       const { usd } = resJson["stafi-staked-bnb"];
  //       setLsdTokenPrice(usd);
  //     }
  //   } catch (err: any) {}
  // }, []);

  useEffect(() => {
    fetchGasPrice();
    // fetchTokenPrice();
    // fetchLsdTokenPrice();
  }, [updateFlag]);

  return {
    gasPrice: 3,
    tokenPrice: 212,
    lsdTokenPrice: 212,
  };
}
