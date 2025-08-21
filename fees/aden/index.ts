import { Adapter, FetchOptions } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
import { httpGet } from "../../utils/fetchURL";

interface DailyStats {
  date: string;
  dateString: string;
  createdAt: string;
  updatedAt: string;
  builderFee: string;
  takerVolume: string;
  makerVolume: string;
  activeUser: number;
}

const methodology = {
  Fees: "ADEN charges builder fees on taker volume. Fee rate started at 0.05 bps (0.0005%) from Aug 13, increased to 0.3 bps (0.003%) from Aug 18, 2025",
  Revenue: "100% of builder fees go to ADEN protocol as revenue",
  ProtocolRevenue: "All trading fees are retained by ADEN protocol treasury",
};

const fetch = async (_t: number, _: any, { startOfDay }: FetchOptions) => {
  // Using new Orderly API endpoint that provides builder fees
  const dailyStats: DailyStats[] = await httpGet(
    "https://api.orderly.org/md/volume/builder/daily_stats?broker_id=aden"
  );

  // Find the stats for the requested date
  const targetDate = new Date(startOfDay * 1000).toISOString().split("T")[0];
  const dayStats = dailyStats.find((day) => 
    day.date.startsWith(targetDate)
  );

  if (!dayStats) {
    return {
      dailyFees: "0",
      dailyRevenue: "0",
      dailyProtocolRevenue: "0",
      timestamp: startOfDay,
    };
  }

  // Use builderFee directly from API
  const dailyFees = parseFloat(dayStats.builderFee || "0");
  const dailyRevenue = dailyFees; // 100% of fees go to protocol
  const dailyProtocolRevenue = dailyFees; // All fees go to treasury

  return {
    dailyFees: dailyFees.toString(),
    dailyRevenue: dailyRevenue.toString(),
    dailyProtocolRevenue: dailyProtocolRevenue.toString(),
    timestamp: startOfDay,
  };
};

const adapter: Adapter = {
  adapter: {
    // ADEN operates on Solana, Arbitrum, and BNB Chain through Orderly Network
    // Using BSC as the main chain since the API aggregates all chains data
    [CHAIN.BSC]: {
      fetch,
      start: '2025-08-13', // BuilderFee started from Aug 13, 2025
      meta: {
        methodology
      }
    },
  },
};

export default adapter;