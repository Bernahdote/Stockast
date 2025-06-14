import yfinance as yf
import pandas as pd
import pandas_ta as ta

def get_technical_summary(ticker: str) -> str:
    # --- Step 1: Download historical data
    data = yf.download(ticker, period="3mo", interval="1d")

    if data.empty:
        return f"Could not download data for ticker: {ticker}"

    # --- Step 2: Flatten MultiIndex columns if they exist
    if isinstance(data.columns, pd.MultiIndex):
        data.columns = [col[0] for col in data.columns]

    # --- Step 3: Drop missing values
    data = data.dropna(subset=["Close"])

    # Check if data is sufficient for MACD and other indicators
    MIN_PERIODS_MACD = 26  # Common requirement for MACD's slow EMA
    MIN_PERIODS_RSI = 14 # Common requirement for RSI
    MIN_PERIODS_SMA = 20 # Common requirement for SMA20

    if len(data) < max(MIN_PERIODS_MACD, MIN_PERIODS_RSI, MIN_PERIODS_SMA):
        return f"Insufficient data for {ticker} to calculate all technical indicators after cleaning. Need at least {max(MIN_PERIODS_MACD, MIN_PERIODS_RSI, MIN_PERIODS_SMA)} data points, but got {len(data)}."

    # --- Step 4: Calculate technical indicators
    data["RSI"] = ta.rsi(data["Close"])
    data["SMA20"] = ta.sma(data["Close"], length=20)

    macd = ta.macd(data["Close"])
    if macd is not None and not macd.empty:
        # Ensure all MACD columns are present before concatenating
        required_macd_cols = ['MACD_12_26_9', 'MACDh_12_26_9', 'MACDs_12_26_9']
        if all(col in macd.columns for col in required_macd_cols):
            data = pd.concat([data, macd[required_macd_cols]], axis=1)
        else:
            return f"MACD calculation for {ticker} did not return all expected columns."
    else:
        return f"MACD calculation failed for {ticker}."

    # --- Step 5: Generate natural-language summary
    if data.empty: # Should be caught earlier, but as a safeguard
        return f"No data available for {ticker} to generate summary."
        
    latest = data.iloc[-1]
    summary_lines = []

    # Price vs SMA20
    if "SMA20" in latest and pd.notna(latest["SMA20"]):
        if latest["Close"] > latest["SMA20"]:
            summary_lines.append("The stock is trading above its 20-day average, indicating short-term strength.")
        else:
            summary_lines.append("The stock is trading below its 20-day average, which may suggest some weakness.")
    else:
        summary_lines.append("SMA20 data is not available.")

    # RSI interpretation
    if "RSI" in latest and pd.notna(latest["RSI"]):
        if latest["RSI"] > 70:
            summary_lines.append("RSI is above 70, suggesting the stock may be overbought.")
        elif latest["RSI"] < 30:
            summary_lines.append("RSI is below 30, indicating it might be oversold.")
        else:
            summary_lines.append("RSI is in a neutral range, showing balanced momentum.")
    else:
        summary_lines.append("RSI data is not available.")

    # MACD direction
    if "MACD_12_26_9" in latest and pd.notna(latest["MACD_12_26_9"]):
        if latest["MACD_12_26_9"] > 0:
            summary_lines.append("MACD is positive, supporting bullish momentum.")
        else:
            summary_lines.append("MACD is negative, indicating bearish momentum.")
    else:
        summary_lines.append("MACD data is not available.")
        
    if not latest.name: # Check if index name (date) is available
        date_str = "latest available data"
    else:
        try:
            date_str = latest.name.date()
        except AttributeError:
            date_str = latest.name # if it's not a datetime object with .date()

    # --- Step 6: Output the summary
    output_str = f"\\n📊 Technical Summary for {ticker} ({date_str}):\\n"
    output_str += f"Closing Price: ${latest['Close']:.2f}\\n"
    for line in summary_lines:
        output_str += f"- {line}\\n"
    
    return output_str

# Example usage (optional, can be removed or commented out)
if __name__ == "__main__":
    ticker_symbol = "AAPL" 
    technical_summary = get_technical_summary(ticker_symbol)
    print(technical_summary)

    ticker_symbol_fail = "NONEXISTENTTICKER"
    technical_summary_fail = get_technical_summary(ticker_symbol_fail)
    print(technical_summary_fail)
    
    # Example for a ticker that might have less than 3mo of data initially
    # For testing the insufficient data message - this might still fetch enough if run later
    # Or a very new IPO if one exists and yfinance has it with limited history
    # ticker_symbol_short = "NEWIPO" 
    # technical_summary_short = get_technical_summary(ticker_symbol_short)
    # print(technical_summary_short)
