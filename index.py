#!/usr/bin/env python

import os
import wsgiref.handlers

from google.appengine.ext import webapp
from google.appengine.api import urlfetch
from google.appengine.ext.webapp import template

import twitgraph_base_servlet

class MainHandler(twitgraph_base_servlet.BaseHandler):

  def get(self):
    path = os.path.join(os.path.dirname(__file__), 'index.html')
    self.response.out.write(template.render(path, self.get_template_values()))

def main():
  application = webapp.WSGIApplication([('/', MainHandler)],
                                       debug=True)
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()
