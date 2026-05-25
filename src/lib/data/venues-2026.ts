// Static venue mapping for FIFA World Cup 2026 group stage.
// Keyed by football-data.org external match ID.
// Used as fallback when the API does not return venue data.
export const VENUES_BY_EXTERNAL_ID: Record<number, string> = {
  // Group A — MEX, RSA, KOR, CZE
  537327: 'Estadio Azteca',         // MEX vs RSA
  537328: 'Estadio Akron',          // KOR vs CZE
  537329: 'Mercedes-Benz Stadium',  // CZE vs RSA
  537330: 'Estadio Akron',          // MEX vs KOR
  537331: 'Estadio Azteca',         // CZE vs MEX
  537332: 'Estadio BBVA',           // RSA vs KOR

  // Group B — CAN, BIH, QAT, SUI
  537333: 'BMO Field',              // CAN vs BIH
  537334: "Levi's Stadium",         // QAT vs SUI
  537335: 'SoFi Stadium',           // SUI vs BIH
  537336: 'BC Place',               // CAN vs QAT
  537337: 'BC Place',               // SUI vs CAN
  537338: 'Lumen Field',            // BIH vs QAT

  // Group C — BRA, MAR, HAI, SCO
  537339: 'MetLife Stadium',        // BRA vs MAR
  537340: 'Gillette Stadium',       // HAI vs SCO
  537341: 'Lincoln Financial Field',// BRA vs HAI
  537342: 'Gillette Stadium',       // SCO vs MAR
  537343: 'Hard Rock Stadium',      // SCO vs BRA
  537344: 'Mercedes-Benz Stadium',  // MAR vs HAI

  // Group D — USA, PAR, AUS, TUR
  537345: 'SoFi Stadium',           // USA vs PAR
  537346: 'BC Place',               // AUS vs TUR
  537347: "Levi's Stadium",         // TUR vs PAR
  537348: 'Lumen Field',            // USA vs AUS
  537349: 'SoFi Stadium',           // TUR vs USA
  537350: "Levi's Stadium",         // PAR vs AUS

  // Group E — GER, CUR, CIV, ECU
  537351: 'NRG Stadium',            // GER vs CUR
  537352: 'Lincoln Financial Field',// CIV vs ECU
  537353: 'BMO Field',              // GER vs CIV
  537354: 'Arrowhead Stadium',      // ECU vs CUR
  537355: 'MetLife Stadium',        // ECU vs GER
  537356: 'Lincoln Financial Field',// CUR vs CIV

  // Group F — NED, JPN, SWE, TUN
  537357: 'AT&T Stadium',           // NED vs JPN
  537358: 'Estadio BBVA',           // SWE vs TUN
  537359: 'NRG Stadium',            // NED vs SWE
  537360: 'Estadio BBVA',           // TUN vs JPN
  537361: 'Arrowhead Stadium',      // TUN vs NED
  537362: 'AT&T Stadium',           // JPN vs SWE

  // Group G — BEL, EGY, IRN, NZL
  537363: 'Lumen Field',            // BEL vs EGY
  537364: 'SoFi Stadium',           // IRN vs NZL
  537365: 'SoFi Stadium',           // BEL vs IRN
  537366: 'BC Place',               // NZL vs EGY
  537367: 'BC Place',               // NZL vs BEL
  537368: 'Lumen Field',            // EGY vs IRN

  // Group H — ESP, CPV, KSA, URY
  537369: 'Mercedes-Benz Stadium',  // ESP vs CPV
  537370: 'Hard Rock Stadium',      // KSA vs URY
  537371: 'Mercedes-Benz Stadium',  // ESP vs KSA
  537372: 'Hard Rock Stadium',      // URY vs CPV
  537373: 'Estadio Akron',          // URY vs ESP
  537374: 'NRG Stadium',            // CPV vs KSA

  // Group I — FRA, SEN, IRQ, NOR
  537391: 'MetLife Stadium',        // FRA vs SEN
  537392: 'Gillette Stadium',       // IRQ vs NOR
  537393: 'Lincoln Financial Field',// FRA vs IRQ
  537394: 'MetLife Stadium',        // NOR vs SEN
  537395: 'Gillette Stadium',       // NOR vs FRA
  537396: 'BMO Field',              // SEN vs IRQ

  // Group J — ARG, ALG, AUT, JOR
  537397: 'Arrowhead Stadium',      // ARG vs ALG
  537398: "Levi's Stadium",         // AUT vs JOR
  537399: 'AT&T Stadium',           // ARG vs AUT
  537400: "Levi's Stadium",         // JOR vs ALG
  537401: 'AT&T Stadium',           // JOR vs ARG
  537402: 'Arrowhead Stadium',      // ALG vs AUT

  // Group K — POR, COD, UZB, COL
  537403: 'NRG Stadium',            // POR vs COD
  537404: 'Estadio Azteca',         // UZB vs COL
  537405: 'NRG Stadium',            // POR vs UZB
  537406: 'Estadio Akron',          // COL vs COD
  537407: 'Hard Rock Stadium',      // COL vs POR
  537408: 'Mercedes-Benz Stadium',  // COD vs UZB

  // Group L — ENG, CRO, GHA, PAN
  537409: 'AT&T Stadium',           // ENG vs CRO
  537410: 'BMO Field',              // GHA vs PAN
  537411: 'Gillette Stadium',       // ENG vs GHA
  537412: 'BMO Field',              // PAN vs CRO
  537413: 'MetLife Stadium',        // PAN vs ENG
  537414: 'Lincoln Financial Field',// CRO vs GHA
}
