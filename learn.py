#!/usr/bin/env python

import os
import wsgiref.handlers

from google.appengine.ext import webapp
from google.appengine.api import urlfetch

import twitgraph_base_servlet
import data.db as db
from data.model import Tweet
from base_json import JsonHandler

class MainHandler(JsonHandler):

  def get(self):
    tweet = Tweet()
    tweet.text = self.get_text()
    tweet.sentiment = self.get_sentiment()
    tweet.query = self.get_q()
    db.add_tweet(tweet)
    ret = {'status': 200, 'msg': 'Thanks!'}
    self.spit_json(ret)

  def get_text(self):
    t = self.request.get('text')
    if not t:
      raise Exception('text is missing')
    return t

  def get_sentiment(self):
    s = self.request.get('sentiment')
    if not s:
      raise Exception('Sentiment is missing')
    return s

def main():
  application = webapp.WSGIApplication([('/learn', MainHandler)],
                                       debug=True)
  wsgiref.handlers.CGIHandler().run(application)

if __name__ == '__main__':
  main()
