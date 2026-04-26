import type { FxRatesContextValue } from './lib/useFxRates'
import type { GeoCurrenciesContextValue } from './lib/useGeoCurrencies'

export type SiteOutletContext = FxRatesContextValue & GeoCurrenciesContextValue
