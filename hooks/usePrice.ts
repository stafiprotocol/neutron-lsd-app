import { useCallback, useEffect, useState } from "react";
import { getTokenPriceUrl } from "utils/configUtils";
import { useAppSlice } from "./selector";
import { useAppDispatch, useAppSelector } from "./common";
import { setTokenPrice } from "redux/reducers/TokenSlice";
import { RootState } from "redux/store";
import dayjs from "dayjs";

export function usePrice() {
  const { updateFlag } = useAppSlice();
  const dispatch = useAppDispatch();

  const { tokenPrice } = useAppSelector((state: RootState) => {
    return {
      tokenPrice: state.token.tokenPrice,
    };
  });

  const [gasPrice, setGasPrice] = useState(3);

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

  const fetchTokenPrice = useCallback(async () => {
    const currentTImestamp = dayjs().unix();
    if (currentTImestamp - updateFlag < 30) return; // 30s
    try {
      const response = await fetch(getTokenPriceUrl(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const resJson = await response.json();
      if (resJson) {
        const { usd } = resJson.binancecoin;
        dispatch(setTokenPrice(usd));
      }
    } catch (err: any) {}
  }, [updateFlag]);

  useEffect(() => {
    fetchGasPrice();
    fetchTokenPrice();
  }, [updateFlag]);

  return {
    gasPrice,
    tokenPrice,
  };
}
