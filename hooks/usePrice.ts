import { useCallback, useEffect, useRef, useState } from "react";
import { getTokenPriceUrl } from "utils/configUtils";
import { useAppSlice } from "./selector";
import { useAppDispatch, useAppSelector } from "./common";
import { setNtrnPrice, setTokenPrice } from "redux/reducers/TokenSlice";
import { RootState } from "redux/store";
import dayjs from "dayjs";
import { useDebouncedEffect } from "./useDebouncedEffect";

export function usePrice() {
  const updateTimestampRef = useRef<number>(0);
  const { updateFlag } = useAppSlice();
  const dispatch = useAppDispatch();

  const { tokenPrice, ntrnPrice } = useAppSelector((state: RootState) => {
    return {
      tokenPrice: state.token.tokenPrice,
      ntrnPrice: state.token.ntrnPrice,
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
    if (currentTImestamp - updateTimestampRef.current < 30) return; // 30s
    updateTimestampRef.current = currentTImestamp;
    try {
      const response = await fetch(getTokenPriceUrl(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const resJson = await response.json();
      if (resJson) {
        const { usd } = resJson.cosmos;
        dispatch(setTokenPrice(usd));
        const { usd: ntrnUsd } = resJson["neutron-3"];
        dispatch(setNtrnPrice(ntrnUsd));
      }
    } catch (err: any) {}
  }, [dispatch]);

  useDebouncedEffect(
    () => {
      fetchTokenPrice();
    },
    [fetchTokenPrice],
    1500
  );

  return {
    gasPrice,
    ntrnPrice,
    tokenPrice,
  };
}
