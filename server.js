const http = require("node:http");
const https = require("node:https");

const PORT = process.env.PORT || 3000;

// IMPORTANT:
// When we put the server online, store your real API key
// as an environment variable called TWELVE_DATA_API_KEY.
const API_KEY = process.env.TWELVE_DATA_API_KEY || "";

const allowedIntervals = [
  "5min",
  "15min",
  "1h",
  "4h",
  "1day"
];

const server = http.createServer(async (req, res) => {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // -----------------------------------------
  // SERVER STATUS
  // -----------------------------------------

  if (req.url === "/api/status") {

    sendJSON(res, 200, {
      online: true,
      app: "TradeLab",
      marketAPI: API_KEY ? "configured" : "not configured"
    });

    return;
  }

  // -----------------------------------------
  // MARKET DATA
  // Example:
  // /api/market?symbol=EUR/USD&interval=15min
  // -----------------------------------------

  if (req.url.startsWith("/api/market")) {

    try {

      const requestURL =
        new URL(
          req.url,
          `http://localhost:${PORT}`
        );

      const symbol =
        requestURL.searchParams.get("symbol")
        || "EUR/USD";

      const interval =
        requestURL.searchParams.get("interval")
        || "15min";

      const outputsize =
        requestURL.searchParams.get("outputsize")
        || "100";

      // Validate timeframe
      if (!allowedIntervals.includes(interval)) {

        sendJSON(res, 400, {
          success: false,
          error: "Unsupported timeframe",
          allowedIntervals
        });

        return;
      }

      // Don't allow the browser to provide the API key.
      if (!API_KEY) {

        sendJSON(res, 500, {
          success: false,
          error:
            "TWELVE_DATA_API_KEY is not configured on the server."
        });

        return;
      }

      const apiURL =
        "https://api.twelvedata.com/time_series" +
        "?symbol=" +
        encodeURIComponent(symbol) +
        "&interval=" +
        encodeURIComponent(interval) +
        "&outputsize=" +
        encodeURIComponent(outputsize) +
        "&apikey=" +
        encodeURIComponent(API_KEY);

      const data =
        await fetchJSON(apiURL);

      if (data.status === "error") {

        sendJSON(res, 400, {
          success: false,
          error: data.message || "Market API error"
        });

        return;
      }

      const candles =
        Array.isArray(data.values)
        ? data.values
            .slice()
            .reverse()
            .map(candle => ({
              time: candle.datetime,
              open: Number(candle.open),
              high: Number(candle.high),
              low: Number(candle.low),
              close: Number(candle.close),
              volume:
                candle.volume
                ? Number(candle.volume)
                : null
            }))
        : [];

      sendJSON(res, 200, {
        success: true,
        symbol: data.meta?.symbol || symbol,
        interval,
        candles
      });

    } catch (error) {

      console.error(error);

      sendJSON(res, 500, {
        success: false,
        error: "Could not retrieve market data."
      });

    }

    return;
  }

  // -----------------------------------------
  // 404
  // -----------------------------------------

  sendJSON(res, 404, {
    error: "Route not found"
  });

});


// -----------------------------------------
// HELPERS
// -----------------------------------------

function sendJSON(res, statusCode, data) {

  res.writeHead(statusCode, {
    "Content-Type": "application/json"
  });

  res.end(
    JSON.stringify(data)
  );

}


function fetchJSON(url) {

  return new Promise((resolve, reject) => {

    https.get(url, response => {

      let body = "";

      response.on(
        "data",
        chunk => body += chunk
      );

      response.on(
        "end",
        () => {

          try {

            resolve(
              JSON.parse(body)
            );

          } catch (error) {

            reject(error);

          }

        }
      );

    }).on(
      "error",
      reject
    );

  });

}


// -----------------------------------------
// START SERVER
// -----------------------------------------

server.listen(
  PORT,
  () => {

    console.log(
      `TradeLab server running on port ${PORT}`
    );

  }
);