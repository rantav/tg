#!/usr/bin/env python

import logging as log
from datetime import datetime
from classifier.bayes import BayesianClassifier
from twitgraph_base_servlet import DATE_FORMAT
import data.db as db

TWITTER_DATE_FORMAT = '%a, %d %b %Y %H:%M:%S +0000'

class TweetsAnalyzer:
  """Analyzes tweets by classifying them and aggregating them"""

  def aggregate(self, classified_results):
    """Aggregates tweets by date and collects overall happy/sad/neutral stats"""
    stats = {BayesianClassifier.POSITIVE: 0, BayesianClassifier.NEGATIVE: 0, BayesianClassifier.NEUTRAL: 0}
    agg = {}
    for result in classified_results:
      date = datetime.strptime(result['created_at'], TWITTER_DATE_FORMAT)
      date_str = date.strftime(DATE_FORMAT)
      if agg.get(date_str) is None:
        agg[date_str] = {BayesianClassifier.POSITIVE: 0, BayesianClassifier.NEGATIVE: 0, BayesianClassifier.NEUTRAL: 0, 'date': date_str}
      tag = result.get('tag') or BayesianClassifier.NEUTRAL
      agg[date_str][tag] += 1
      stats[tag] += 1

    # Put the aggregate results in a list and sort them
    agg_list = []
    for i in agg:
      agg_list.append(agg[i])
    agg_list.sort(cmp=lambda x,y: cmp(x['date'], y['date']))
    return (stats, agg_list)

    classified = {"results": results, "stats": stats}

  def classify(self, results):
    """Classifies the results set by adding a "tag" attribute to each of the results.

    The same set of results are returned, with additional statistics and tagging.
    Each result gets one of the tags :), :( or :|
    And a stats section is added.

    @return an annotated array of results.
    [{"tag": "pos",
      "iso_language_code": "en",
      "text": "@chucklelate im not that excited about google voice. although it seems neat, i dont see myself using it.",
      "created_at": "Sat, 14 Mar 2009 00:00:03 +0000",
      "profile_image_url": "http:\/\/s3.amazonaws.com\/twitter_production\/profile_images\/80373954\/IMG_0008_normal.JPG",
      "to_user": "chucklelate",
      "source": "<a href="http:\/\/twitter.com\/">web<\/a>",
      "from_user": "richeymanic",
      "from_user_id": 5160745,
      "to_user_id": 409063,
      "id": 1324759664},...],
    """
    c = BayesianClassifier()
    c.train(db.fetch_all_tweets())
    for result in results:
      tag = c.classify(result['text'])
      result['tag'] = tag

    return results
