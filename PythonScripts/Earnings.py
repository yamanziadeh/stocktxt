import pandas as pd
import numpy as np
import datetime as dt

sp500Stocks = pd.read_html(
    'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies')[0]["Symbol"].values

delta = dt.timedelta(days=1)

startDate = dt.date.today() + delta
startString = startDate.strftime('20%y-%m-%d')

endDate = dt.timedelta(days=7) + startDate
endString = endDate.strftime('20%y-%m-%d')

currDate = startDate
currString = startString

daysOfTheWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"]
stocksPerDay = {}

while currDate < endDate:
    dayIndex = currDate.weekday()
    if (not (dayIndex == 0 or dayIndex == 6)):
        link = "https://finance.yahoo.com/calendar/earnings?from=" + \
            startString + "&to=" + endString + "&day=" + currString
        currString = currDate.strftime('20%y-%m-%d')
        table = pd.read_html(link)[0]
        stocks = table.loc[table['Symbol'].isin(sp500Stocks)]["Company"].values
        if (stocks.size != 0):
            stocksPerDay[daysOfTheWeek[dayIndex]] = stocks
    currDate += delta


for day, stocks in stocksPerDay.items():
    print(day + ": " + ', '.join(stocks) + "$$$")
