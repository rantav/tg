#!/usr/bin/env python

import wsgiref.handlers
import urllib
import logging as log
from google.appengine.ext import webapp
import twitgraph_base_servlet
from biz.twitter_fetcher import TwitterFetcher
from biz.tweets_analyzer import TweetsAnalyzer
from classifier.bayes import BayesianClassifier

class MainHandler(twitgraph_base_servlet.BaseHandler):

  CHARTS_URL = 'http://chart.apis.google.com/chart'

  def get(self):
    fetcher = TwitterFetcher()
    all_results = fetcher.fetch_results(self.get_q(), self.get_start(), self.get_end())
    if all_results is None:
      self.redirect('/s/img/ouch.png')
    else:
      analyzer = TweetsAnalyzer()
      stats, aggregate_results = analyzer.aggregate(all_results)
    url_params = self.build_charts_url_params(aggregate_results)
    url = '%s?%s' % (self.CHARTS_URL, url_params)
    self.redirect(url)

  def build_charts_url_params(self, aggregate_results):
    series = map(lambda x: str(x[BayesianClassifier.NEUTRAL]), aggregate_results)
    series = ','.join(series)
    dates = map(lambda x: x['date'], aggregate_results)
    dates = '|'.join(dates)
    size = self.get_chart_size()
    params = '&cht=lc' + '&chd=t:' + series + '&chs=' + size + '&chm=B,2F74D0,0,0,0' + '&chxt=x,y' + '&chxl=0:|' + dates
    return params

  def get_chart_size(self):
    return self.request.get('size') or '600x400'

def main():
  application = webapp.WSGIApplication([('/embed_static', MainHandler)],
                                       debug=True)
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()
