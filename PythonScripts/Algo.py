import pandas as pd
import pandas_datareader as reader
import datetime as dt
import numpy as np
import pyotp
from dateutil.relativedelta import relativedelta
import time
import threading

# "https://finance.yahoo.com/quote/%5EIXIC/components?p=%5EIXIC"


def read_link():
    table = pd.read_html(
        "https://finance.yahoo.com/quote/%5EDJA/components?p=%5EDJA")[0]
    tickers = table.Symbol.tolist()

    start = dt.datetime(2018, 1, 31)
    end = dt.datetime(2020, 1, 31)

    df = reader.get_data_yahoo(tickers, start, end)['Adj Close']
    mtl_ret = df.pct_change().resample('M').agg(lambda x: (x+1).prod() - 1)
    past_11 = (mtl_ret+1).rolling(11).apply(np.prod, raw=True)-1
    formation = dt.datetime(2019, 12, 31)

    end_measurement = formation - relativedelta(months=1)
    ret12 = past_11.loc[end_measurement]
    ret12 = ret12.reset_index()
    ret12['quintile'] = pd.qcut(ret12.iloc[:, 1], 6, labels=False)

    winners = ret12[ret12.quintile == 4]
    losers = ret12[ret12.quintile == 0]

    winnerret = mtl_ret.loc[formation +
                            relativedelta(months=1), df.columns.isin(winners.Symbols)]
    # loserret = mtl_ret.loc[formation + relativedelta(months=1), df.columns.isin(losers.Symbols)]

    return winnerret


winners = read_link()
win_tickers = winners.keys()
print(win_tickers[0] + ' ' + win_tickers[1] + ' ' +
      win_tickers[2] + ' ' + win_tickers[3] + ' ' + win_tickers[4])
