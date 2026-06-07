/* eslint-disable @typescript-eslint/no-unused-vars */

import { CURRENCIES, CurrencyCode } from './currencies';

type Assert<T extends true> = T;
type Includes<Union, Member> = Member extends Union ? true : false;

type _vndIsSupabaseCurrency = Assert<Includes<CurrencyCode, 'VND'>>;
type _myrIsSupabaseCurrency = Assert<Includes<CurrencyCode, 'MYR'>>;
type _cnyIsSupabaseCurrency = Assert<Includes<CurrencyCode, 'CNY'>>;
type _thbIsSupabaseCurrency = Assert<Includes<CurrencyCode, 'THB'>>;
type _aedIsSupabaseCurrency = Assert<Includes<CurrencyCode, 'AED'>>;

const requiredCurrencyCodes = [
  CURRENCIES.VND.code,
  CURRENCIES.MYR.code,
  CURRENCIES.CNY.code,
  CURRENCIES.THB.code,
  CURRENCIES.AED.code,
] satisfies CurrencyCode[];
