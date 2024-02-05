import BN from "bn.js";
import { toBN } from "web3-utils";

export function formatNumber(
  num: string | number | undefined,
  options: {
    decimals?: number;
    fixedDecimals?: boolean;
    withSplit?: boolean;
    toReadable?: boolean;
    roundMode?: "round" | "floor" | "ceil";
    prefix?: string;
    hideDecimalsForZero?: boolean;
  } = {}
) {
  if (num === undefined || num === "") {
    return "--";
  }
  if (isNaN(Number(num))) {
    return "--";
  }

  let decimals = options.decimals === undefined ? 6 : options.decimals;
  const withSplit = options.withSplit === undefined ? true : options.withSplit;
  const fixedDecimals =
    options.fixedDecimals === undefined ? true : options.fixedDecimals;
  const toReadable =
    options.toReadable === undefined ? true : options.toReadable;
  const roundMode = options.roundMode || "floor";
  const hideDecimalsForZero = !!options.hideDecimalsForZero;
  let suffix = "";

  if (hideDecimalsForZero && Number(num) === 0) {
    return "0";
  }

  let newNum = "0";
  if (toReadable && Number(num) >= 1000000000) {
    newNum = Number(num) / 1000000000 + "";
    suffix = "B";
    decimals = 3;
  } else if (toReadable && Number(num) >= 1000000) {
    newNum = Number(num) / 1000000 + "";
    suffix = "M";
    decimals = 3;
  } else if (toReadable && Number(num) >= 1000) {
    newNum = Number(num) / 1000 + "";
    suffix = "K";
    decimals = 3;
  } else {
    newNum = num + "";
  }

  const roundMethod =
    roundMode === "floor"
      ? Math.floor
      : roundMode === "ceil"
      ? Math.ceil
      : Math.round;

  newNum =
    roundMethod(Number(newNum) * Math.pow(10, decimals)) /
      Math.pow(10, decimals) +
    "";

  if (fixedDecimals) {
    newNum = Number(newNum).toFixed(decimals);
  }

  if (Number(newNum) === 0 && Number(num) > 0) {
    newNum = `<${options.prefix || ""}${1.0 / Math.pow(10, decimals)}`;
  } else {
    newNum = (options.prefix || "") + newNum;
  }

  if (withSplit) {
    var parts = newNum.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    newNum = parts.join(".") + suffix;
  } else {
    newNum = newNum + suffix;
  }

  return newNum;
}

export function formatLargeAmount(amount: string | number) {
  if (!isNaN(Number(amount)) && Number(amount) > 1000) {
    return formatNumber(amount, { decimals: 2 });
  }
  return formatNumber(amount, { decimals: 4 });
}

export function chainAmountToHuman(
  num: string | number | undefined,
  decimals: number = 6
) {
  if (num === "" || num === undefined || num === null || isNaN(Number(num))) {
    return "--";
  }
  const factor = Math.pow(10, decimals) + "";

  return Number(num) / Number(factor) + "";
}

export function stakeAmountToBn(
  amount: string | number,
  decimals: number = 6
): BN {
  const precision = decimals; // 10^9
  const intAmount = Number(amount) * Math.pow(10, precision);
  return new BN(intAmount).mul(new BN(Math.pow(10, precision)));
}

export function amountToChain(
  input: string | number | undefined,
  decimals: number = 6
): string {
  if (isNaN(Number(input)) || input === undefined) {
    return "--";
  }
  let factor = Math.pow(10, decimals) + "";

  const multiplyRes = toBN(Number(input) * 1000000 + "").mul(
    toBN(Number(factor) / 1000000)
  );
  const res = formatScientificNumber(multiplyRes);
  return res;
}

function formatScientificNumber(x: any): string {
  if (Math.abs(x) < 1.0) {
    var e = parseInt(x.toString().split("e-")[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      x = "0." + new Array(e).join("0") + x.toString().substring(2);
    }
  } else {
    var e = parseInt(x.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      x += new Array(e + 1).join("0");
    }
  }
  return x.toString();
}

export function getRefinedStakedAmount(
  lsdTokenAmount: string | undefined,
  lsdRate: string | undefined
): string {
  if (!lsdTokenAmount || !lsdRate) {
    return "--";
  }
  const stakedAmount = Number(lsdTokenAmount) * Number(lsdRate);
  const temp = stakedAmount * 1000000;
  if (temp < 10) {
    return stakedAmount + "";
  } else {
    const result = Math.ceil(temp) / 1000000;
    return result + "";
  }
}
