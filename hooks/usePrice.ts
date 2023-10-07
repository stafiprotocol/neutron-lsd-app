import { useCallback, useEffect, useState } from "react";
import {
  getGasPriceUrl,
  getLsdTokenPriceUrl,
  getTokenPriceUrl,
} from "utils/configUtils";
import { useAppSlice } from "./selector";
import { useAppDispatch, useAppSelector } from "./common";
import { setTokenPrice } from "redux/reducers/TokenSlice";
import { RootState } from "redux/store";
import dayjs from "dayjs";
import { setLsdTokenPrice } from "redux/reducers/LsdTokenSlice";

export function usePrice() {
  const { updateFlag } = useAppSlice();
  const dispatch = useAppDispatch();

  const { tokenPrice, lsdTokenPrice } = useAppSelector((state: RootState) => {
    return {
      tokenPrice: state.token.tokenPrice,
      lsdTokenPrice: state.lsdToken.lsdTokenPrice,
    };
  });

  const [gasPrice, setGasPrice] = useState(0);

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
        console.log({ resJson });
        const { usd } = resJson.binancecoin;
        dispatch(setTokenPrice(usd));
      }
    } catch (err: any) {}
  }, [updateFlag]);

  const fetchLsdTokenPrice = useCallback(async () => {
    const currentTImestamp = dayjs().unix();
    if (currentTImestamp - updateFlag < 30) return; // 30s
    try {
      const response = await fetch(getLsdTokenPriceUrl(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const resJson = await response.json();
      if (resJson) {
        const { usd } = resJson["stafi-staked-bnb"];
        dispatch(setLsdTokenPrice(usd));
      }
    } catch (err: any) {}
  }, [updateFlag]);

  useEffect(() => {
    fetchGasPrice();
    fetchTokenPrice();
    fetchLsdTokenPrice();
  }, [updateFlag]);

  return {
    gasPrice: 3,
    tokenPrice,
    lsdTokenPrice,
  };
}
