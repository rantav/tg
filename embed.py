#!/usr/bin/env python

import os
import wsgiref.handlers

from google.appengine.ext import webapp
from google.appengine.api import urlfetch
from google.appengine.ext.webapp import template

import index

class EmbedHandler(index.MainHandler):

  def get(self):
    template_values = self.get_template_values();
    self.response.headers['Content-Type'] = 'application/javascript; charset=utf-8'
    path = os.path.join(os.path.dirname(__file__), 'embed.js')
    self.response.out.write(template.render(path, template_values))

def main():
  application = webapp.WSGIApplication([('/embed', EmbedHandler)],
                                       debug=True)
  wsgiref.handlers.CGIHandler().run(application)


if __name__ == '__main__':
  main()
