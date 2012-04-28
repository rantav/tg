#!/usr/bin/env python

import os
import logging as log
from django.utils import simplejson as json
from google.appengine.ext.webapp import template
from twitgraph_base_servlet import BaseHandler
from biz.twitter_fetcher import TwitterFetcher
from biz.tweets_analyzer import TweetsAnalyzer

class JsonHandler(BaseHandler):

  def spit_json(self, json_object):
    template_values = self.get_template_values()
    template_values['json_results'] = json.dumps(json_object)
    jsonp_callback = self.get_jsonp_callback()
    if jsonp_callback:
      template_values['callback'] = jsonp_callback
    path = os.path.join(os.path.dirname(__file__), 'results.json')
    self.response.out.write(template.render(path, template_values))

  def get_jsonp_callback(self):
    return self.request.get('callback')
