import { useCallback, useEffect, useState } from "react";
import { getGasPriceUrl } from "utils/configUtils";
import { useAppSlice } from "./selector";

export function usePrice() {
  const { updateFlag } = useAppSlice();

  const [gasPrice, setGasPrice] = useState(0);
  const [tokenPrice, setTokenPrice] = useState(0);

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

  useEffect(() => {
    fetchGasPrice();
  }, [updateFlag]);

  return {
    gasPrice: 3,
    tokenPrice: 212,
    lsdTokenPrice: 212,
  };
}
