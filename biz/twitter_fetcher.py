#!/usr/bin/env python

import logging as log
import urllib
from django.utils import simplejson as json
from google.appengine.api import urlfetch

class TwitterFetcher:
  """This class is responsible for contacting the twitter server and fetching results from them"""
  SEARCH_URL = 'http://search.twitter.com/search.json'

  def fetch_results(self, query_text, start_date_text, end_date_text):
    """Fetches all search results from twitter for the given query.

    This method will call twitter API iteratively again and again until it exausts all resutls for that query.

    @param query_text The actual search query. E.g. "youtube" or "from:@rantav"
    @param start_date_text e.g. "2009-03-20"
    @param end_date_text e.g. "2009-03-25"
    @return An array of results. Each result is a json object. Example:
      [{"iso_language_code": "en",
        "text": "@chucklelate im not that excited about google voice. although it seems neat, i dont see myself using it.",
        "created_at": "Sat, 14 Mar 2009 00:00:03 +0000",
        "profile_image_url": "http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/80373954\/IMG_0008_normal.JPG",
        "to_user": "chucklelate",
        "source": "<a href="http:\/\/twitter.com\/">web<\/a>",
        "from_user": "richeymanic",
        "from_user_id": 5160745,
        "to_user_id": 409063,
        "id": 1324759664},
       {...},...]
       If there's an error, returns None
    """
    url = "%s?%s" % (self.SEARCH_URL, self.compose_twitter_query(query_text, start_date_text, end_date_text))
    all_results = []
    while True:
      result = self.fetch_single_request(url)
      if not result:
        # Error
        log.error("Resutls empty, error")
        return None
        break
      all_results.extend(result.get('results'))
      if result.get('next_page'):
        url = "%s%s" % (self.SEARCH_URL, result.get('next_page'))
      elif result.get('max_id') == -1:
        # Error
        log.error("result.max_id == -1")
        return None
        break
      else:
        # That's OK, finished successfuly
        break
    return all_results

  def fetch_single_request(self, url):
    """Makes a single call to twitter and returns its results"""
    log.info("Sending request to %s", url)
    try:
      result = urlfetch.fetch(url)
      if result.status_code == 200:
        log.info("Response: %s...", (result.content)[0:10])
        return json.loads(result.content)
      else:
        log.error("Error from twitter: %s", result)
    except urlfetch.Error, e:
      log.error("Exception when contacting twitter %s", e)
    return None

  def compose_twitter_query(self, q, start, end):
    """Composes a URL for twitter query."""
    query = {'q': ('%s since:%s until:%s' % (q, start, end)),
             'rpp': 100};
    return urllib.urlencode(query)
