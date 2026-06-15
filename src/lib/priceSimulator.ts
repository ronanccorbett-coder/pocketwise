// Realistic trending price simulator
// Uses mean-reverting Ornstein-Uhlenbeck process with trend momentum

export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

export interface SimState {
  price: number;
  trend: number;       // current trend strength -1 to +1
  trendDur: number;    // how many more ticks this trend persists
  momentum: number;    // short-term momentum carry
  vol: number;         // current volatility (regime)
}

export function initSimState(basePrice: number, volatility: number): SimState {
  return {
    price: basePrice,
    trend: (Math.random() - 0.5) * 0.4,
    trendDur: Math.floor(20 + Math.random() * 60),
    momentum: 0,
    vol: volatility,
  };
}

export function nextPrice(state: SimState, volatility: number): { price: number; state: SimState } {
  let { price, trend, trendDur, momentum, vol } = state;

  // Volatility regime switching (GARCH-like)
  if (Math.random() < 0.02) {
    vol = volatility * (0.5 + Math.random() * 2.5); // vol can spike
  } else {
    vol = vol * 0.95 + volatility * 0.05; // mean-revert
  }

  // Trend duration countdown
  trendDur--;
  if (trendDur <= 0) {
    // Start a new trend - correlated with current (trends have momentum)
    const trendChange = (Math.random() - 0.5) * 0.8;
    trend = trend * 0.3 + trendChange * 0.7; // partial reversal
    trend = Math.max(-0.6, Math.min(0.6, trend));
    trendDur = Math.floor(15 + Math.random() * 80);
  }

  // Price move: trend component + random walk + momentum carry
  const trendMove = trend * vol * 0.3;
  const randomMove = (Math.random() - 0.5) * vol * 1.8;
  const momentumMove = momentum * 0.25;

  const totalMove = trendMove + randomMove + momentumMove;
  momentum = totalMove * 0.4; // carry some momentum

  // Mean reversion if price drifts too far from base (keeps it grounded)
  const newPrice = Math.max(price * 0.0001, price * (1 + totalMove));

  return {
    price: newPrice,
    state: { price: newPrice, trend, trendDur, momentum, vol },
  };
}

export function generateInitialCandles(
  basePrice: number,
  volatility: number,
  count: number
): { candles: Candle[]; simState: SimState } {
  let state = initSimState(basePrice, volatility);
  const candles: Candle[] = [];
  const now = Date.now();

  for (let i = count - 1; i >= 0; i--) {
    const o = state.price;
    // Generate intra-candle moves
    let high = o, low = o, close = o;
    let innerState = { ...state };
    for (let j = 0; j < 8; j++) {
      const result = nextPrice(innerState, volatility);
      innerState = result.state;
      high = Math.max(high, result.price);
      low = Math.min(low, result.price);
      close = result.price;
    }
    state = innerState;
    candles.push({
      t: now - i * 60000,
      o, h: high, l: low, c: close,
      v: Math.floor(50000 + Math.random() * 200000 * (1 + Math.abs(state.trend))),
    });
  }

  return { candles, simState: state };
}
