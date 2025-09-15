import { useEffect, useState } from 'react';
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const BASE = 'USD';
const CURRENCIES = ['USD', 'GBP', 'RUB', 'IDR'] as const;
type CurrencyData = {
  date: string;
} & {
  [K in (typeof CURRENCIES)[number]]: number;
};
function buildDates() {
  const dates = [];
  const now = new Date();
  for (let i = 26; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

async function fetchRates(date: string) {
  const res = await fetch(
    `https://api.exchangerate.host/${date}?base=${BASE}&symbols=${CURRENCIES.join(',')}`
  );
  return res.json();
}

function computeIndices(data) {
  const idx: Record<string, number[]> = {};
  CURRENCIES.forEach((c) => (idx[c] = []));
  CURRENCIES.forEach((c) => idx[c].push(100));
  for (let i = 1; i < data.length; i++) {
    CURRENCIES.forEach((c) => {
      const ratio = data[i].rates[c] / data[i - 1].rates[c];
      idx[c].push(idx[c][i - 1] * ratio);
    });
  }
  return idx;
}

export default function StrengthChart() {
  const [data, setData] = useState<CurrencyData[]>([]);
  useEffect(() => {
    (async () => {
      const dates = buildDates();
      const arr = [];
      for (const d of dates) {
        const res = await fetchRates(d);
        arr.push(res);
      }
      const idx = computeIndices(arr);
      setData(
        dates.map((d, i) => ({
          date: d,
          USD: idx.USD[i],
          GBP: idx.GBP[i],
          RUB: idx.RUB[i],
          IDR: idx.IDR[i],
        }))
      );
    })();
  }, []);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis domain={['auto', 'auto']} />
        <Tooltip />
        <Legend />
        {CURRENCIES.map((cur) => (
          <Line
            key={cur}
            type="monotone"
            dataKey={cur}
            stroke={
              {
                USD: '#8884d8',
                GBP: '#82ca9d',
                RUB: '#ff7300',
                IDR: '#0088FE',
              }[cur]
            }
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
