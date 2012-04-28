#!/usr/bin/env python

import os
import wsgiref.handlers

from google.appengine.ext import webapp
from google.appengine.api import urlfetch
from google.appengine.ext.webapp import template


class MainHandler(webapp.RequestHandler):

  def get(self):
    path = os.path.join(os.path.dirname(__file__), 'about.html')
    self.response.out.write(template.render(path, {}))


def main():
  application = webapp.WSGIApplication([('/about', MainHandler)],
                                       debug=True)
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()
