#!/usr/bin/env python
import logging as log
from data.model import Tweet

def fetch_all_tweets():
  tweets = Tweet.all()
  return tweets

def add_tweet(tweet):
  tweets = fetch_all_tweets()
  tweets.filter('text =', tweet.text)
  tweets.filter('query =', tweet.query)
  for t in tweets:
    # There's already a tweet with the same text. just replace it's sentiment
    log.info('Changing existing tweet: %s', tweet.text)
    t.sentiment = tweet.sentiment;
    t.put()
    return

  log.info('Adding tweet: %s' % tweet.text)
  tweet.put()
