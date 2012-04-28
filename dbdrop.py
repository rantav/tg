#!/usr/bin/env python

import os
import wsgiref.handlers

from google.appengine.ext import webapp
from google.appengine.api import urlfetch
from google.appengine.ext.webapp import template

import twitgraph_base_servlet
import data.db as db

class MainHandler(twitgraph_base_servlet.BaseHandler):

  def get(self):
    tweets = db.fetch_all_tweets()
    template_values = {'tweets': tweets}
    path = os.path.join(os.path.dirname(__file__), 'dbdrop.html')
    self.response.out.write(template.render(path, template_values))

def main():
  application = webapp.WSGIApplication([('/dbdrop', MainHandler)],
                                       debug=True)
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()
