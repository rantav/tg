// All our JS code will be under twitgraph.*
window['twitgraph'] = {};

try {
google.load('visualization', '1', {packages: ['areachart', 'piechart', "gauge"]});
google.setOnLoadCallback(twitgraph.Utils.createDelegate(twitgraph.Utils, twitgraph.Utils.onGvizLoaded));
} catch(e){}

// Global package holds some (very few) global javascript variables.
twitgraph.Globals = {
  query_runner: null,
  query_state: null
};

// The Utils class is the general container for all non-specific useful methods.
// The class contains only static methods.
twitgraph.Utils = {

/**
 * Adds a script to the <head> section of the page.
 * @param url {String} the script url.
 **/
addScript: function(url) {
  var script = document.createElement("script");
  script.setAttribute("src", url);
  script.setAttribute("type", "text/javascript");
  document.body.appendChild(script);
},

/**
 * Creates and sends a jsonp call.
 * @param url {String} urls of the jsonp call.
 * @param callbackName
 **/
jsonp: function(url, callbackName) {
  url += '&callback=' + callbackName;
  this.addScript(url);
},

onGvizLoaded: function() {
  if (!this.initialized) {
    this.init();
  }
},

/**
 * Initializes the page.
 **/
init: function() {
  twitgraph.Utils.log('start');
  this.initialized = true;
  twitgraph.Globals.query_state =
      new twitgraph.QueryState(__twg_init_q,
                               __twg_init_dynamic_date,
                               this.parseDate(__twg_init_start),
                               this.parseDate(__twg_init_end),
                               __twg_init_duration,
                               __twg_init_show_text);
  var qs = twitgraph.Globals.query_state;
  if (qs.dynamic_date) {
    var today = new Date();
    var yday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    qs.end = yday;
    var aWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8);
    qs.start = aWeekAgo;
    var date_start = twitgraph.Utils.$('dateStart');
    if (date_start) {
      date_start.value = twitgraph.Utils.serializeDate(qs.start);
    }
    var date_end = twitgraph.Utils.$('dateEnd');
    if (date_end) {
      date_end.value = twitgraph.Utils.serializeDate(qs.end);
    }
  }
  this.refresh();
},

/**
 * The on-submit handler for the inputs form.
 * Reads all data in the form fields and refreshes the page (graph and everything)
 **/
onSubmit: function() {
  // Gather input.
  var dynamic_date = twitgraph.Utils.$('dateDynamic1').checked;
  var start, end;
  var duration = parseInt(twitgraph.Utils.$('duration').value);
  if (dynamic_date) {
    if (isNaN(duration)) {
      alert("Uncool duration, dang!");
      return;
    }
    var today = new Date();
    var yday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    end = yday;
    start = new Date(yday.getFullYear(), yday.getMonth(), yday.getDate() - duration);
  } else {
    start = this.parseDate(this.$('dateStart').value);
    end = this.parseDate(this.$('dateEnd').value);
    if (!start || !end) {
      alert("Uncool dates, dude!");
      return;
    }
  }
  var q = twitgraph.Utils.$('q').value;
  var show_text = twitgraph.Utils.$('showText').checked;
  twitgraph.Globals.query_state = new twitgraph.QueryState(q, dynamic_date, start, end, duration, show_text);
  twitgraph.Utils.log(twitgraph.Globals.query_state);
  this.refresh();
},

/**
 * Refreshes the page elements.
 * The page most current state is preserved in the query_state variable.
 * This function reads the state from query_state and updates the various page elemetns by it.
 **/
refresh: function() {
  var qs = twitgraph.Globals.query_state;
  twitgraph.Utils.log(qs);
  this.query(qs);
  var embed_code = twitgraph.Utils.$('embed-code');
  if (embed_code) {
    embed_code.value = this.getEmbedCode();
  }
},

/**
 * Queries the twitter search service.
 *
 * @param qs {QueryState} the query state object
 **/
query: function(qs) {
  twitgraph.Utils.time('query');
  twitgraph.Globals.query_runner = new twitgraph.QueryRunner(qs);
  twitgraph.Globals.query_runner.run();
},

/**
 * A convenience for document.getElementById()
 *
 * @return {Object} A dom element by the el ID. null or undefined if that object doesn't exist.
 **/
$: function(el) {
  return document.getElementById(el);
},

/**
 * Gets embed code for the current query_state.
 *
 * @return {String} The embedded code string.
 **/
getEmbedCode: function() {
  var qs = twitgraph.Globals.query_state;
  var a = [];
  a.push('<h3>TwitGraph for ');
  a.push(qs.q);
  a.push('</h3>\n');
  a.push('<div id="twit-graph"></div>\n');
  a.push('<script type="text/javascript" src="');
  a.push(TWITGRAPH_BASE_URL);
  a.push('/embed?');
  a.push('&q=');
  a.push(encodeURIComponent(qs.q));
  a.push('&dynamic_date=');
  if (qs.dynamic_date) {
    a.push('1');
    a.push('&duration=');
    a.push(encodeURIComponent(qs.duration));
  } else {
    a.push('0');
    a.push('&start=');
    a.push(encodeURIComponent(twitgraph.Utils.serializeDate(qs.start)));
    a.push('&end=');
    a.push(encodeURIComponent(twitgraph.Utils.serializeDate(qs.end)));
  }
  a.push('&show_text=');
  a.push(qs.show_text ? '1' : '0');
  a.push('"> </sc');
  a.push('ript>');
  return a.join('');
},

/**
 * Creates a function delegate.
 * That's very useful for creating callbackes on specific object scopes.
 *
 * @param scope {Object} The scope of the created delegate. Usually this is an instance of an object enclosing the callback.
 * @param callback {Function} A member function in scope.
 * @para data {Object} an optional additional data object to be passed to the callback when called.
 * @return {Function} A callback function bound to scope.
 **/
createDelegate: function(scope, callback, data) {
  var func = function() {
    if (data != undefined) {
      arguments.push(data);
    }
    return callback.apply(scope, arguments);
  }
  return func;
},

/**
 * Serializes a date to a string of the format YYYY-mm-dd
 *
 * @param d {Date} a Date object
 * @return {String] a string of the format YYYY-mm-dd, for example: 2009-03-20
 **/
serializeDate: function(d) {
  var a = [];
  a.push(d.getFullYear());
  a.push(this._pad(d.getMonth() + 1)); // Months are zero based
  a.push(this._pad(d.getDate()));
  return a.join('-');
},

_pad: function(n) {
  return (n < 10) ? "0" + n : "" + n;
},

/**
 * Parses a date string in the format YYYY-mm-dd
 *
 * @param s {String} a string date specifier. Example: 2009-01-20
 * @return {Date} a date object. null if date was invalid.
 **/
parseDate: function(s) {
  if (!s) {
    this.error('Invalid date string: ' + s);
    return null;
  }
  var split = s.split('-');
  if (split.lentgh < 3) {
    this.error('Invalid date string: ' + s);
    return null;
  }
  var year = parseInt(split[0], 10);
  var month = parseInt(split[1], 10);
  var day = parseInt(split[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    this.error('Invalid date string: ' + s);
    return null;
  }
  var d = new Date(year, month - 1 /* months are 0 based */, day);
  return d;
},

/**
 * Sends the server a tagged text for it to learn
 **/
learn: function(tag, text, a) {
//  if (a.className == 'twg-emoticon-selected') {
//    return;
//  }
  var query = twitgraph.Globals.query_state.q;
  text = unescape(text);
  this.log('Learning: ' + tag + '   ' + text + '  - Query: ' + query);
  var url = [];
  url.push(TWITGRAPH_BASE_URL);
  url.push('/learn?');
  url.push('&text=');
  url.push(encodeURIComponent(text));
  url.push('&sentiment=');
  url.push(tag);
  url.push('&q=');
  url.push(encodeURIComponent(query));
  url = url.join('');
  this.jsonp(url, 'twitgraph.Utils.onLearnDone');
  var allEmoticons = a.parentNode.childNodes;
  for (var i = 0; i < allEmoticons.length; ++i) {
    allEmoticons[i].className = '';
  }
  a.className = 'twg-emoticon-selected';
},

onLearnDone: function(result) {
  this.log(result);
},

onLearnMouseOut: function(a) {
  if (a.className == 'twg-emoticon-selected') {
    return;
  }
  a.className = '';
},

onLearnMouseOver: function(a) {
  if (a.className == 'twg-emoticon-selected') {
    return;
  }
  a.className = 'twg-emoticon-over';
},

highlightDateDynamic: function(isDynamic) {
  var dynamic = this.$('divDateDynamic');
  var static = this.$('divDateStatic');
  if (isDynamic) {
    dynamic.className = 'date-type-highlight';
    static.className = 'date-type-lowlight';
  } else {
    dynamic.className = 'date-type-lowlight';
    static.className = 'date-type-highlight';
  }
},
/**
 * Logs the message to firebug
 **/
log: function(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
},

/**
 * Logs the error to firebug
 **/
error: function(msg) {
  if (window.console && window.console.error) {
    window.console.error(msg);
  }
},

time: function(name) {
  if (window.console && window.console.time) {
    window.console.time(name);
  }
},

timeEnd: function(name) {
  if (window.console && window.console.timeEnd) {
    window.console.timeEnd(name);
  }
}

};

/**
 * Class: QueryRunner
 * Sends the query to the server
 **/
/**
 * SearchMaster constructor.
 *
 * @param q {String} The search query.
 * @param start {Date} Start date.
 * @param end {Date} End date.
 * @param showText {bool} Show the text results.
 **/
twitgraph.QueryRunner = function(q) {
  this.q = q;
}

twitgraph.QueryRunner.prototype.run = function() {
  twitgraph.Utils.log("starting search");
  twitgraph.Utils.$('twg-resultsText').innerHTML = '';
  twitgraph.Utils.$('twg-graph').innerHTML = '<img src="' + TWITGRAPH_BASE_URL + '/s/img/loading.gif" alt="Loading..." title="Loading..." style="display:block;margin:auto;"/>';
  twitgraph.Utils.$('twg-graph-pie').innerHTML = '';
  twitgraph.Utils.$('twg-graph-gauge').innerHTML = '';
  var url = TWITGRAPH_BASE_URL + '/results.json' + '?' + this.q.toUrlParams();
  twitgraph.Utils.jsonp(url, 'twitgraph.Globals.query_runner.onQueryDone');
}

twitgraph.QueryRunner.prototype.onQueryDone = function(result) {
  twitgraph.Utils.log("Query done " + result.status);
  if (result.status != 200) {
    this.showSorry();
    return;
  }
  twitgraph.Utils.timeEnd('query');
  var grapher = new twitgraph.Grapher(result);
  grapher.drawLineChart();
  grapher.drawPieChart();
  grapher.drawGauge();
  if (twitgraph.Globals.query_state.show_text) {
    var texter = new twitgraph.Texter(result);
    texter.draw();
  }
}

twitgraph.QueryRunner.prototype.showSorry = function() {
  twitgraph.Utils.$('twg-graph').innerHTML = '<img src="' + TWITGRAPH_BASE_URL + '/s/img/ouch.png" title="ouch" alt="ouch" />';
}

twitgraph.Texter = function(result) {
  this.result = result;
}

twitgraph.Texter.prototype.draw = function() {
  var results = this.result.results;
  twitgraph.Utils.$('twg-resultsText').innerHTML = this.formatTexts(results);
}

twitgraph.Texter.prototype.formatTexts = function(results) {
  var html = [];
  for (var i = 0; i < results.length; ++i) {
    tag = results[i].tag;
    text = results[i].text;
    html.push('<div class="twg-tableRow">');
    html.push('<span class="twg-text">');
    html.push(this.createLinkableText(results[i]));
    html.push('</span>');
    html.push('<span class="twg-user">');
    html.push('(');
    html.push('<a href="http://twitter.com/');
    html.push(results[i].from_user);
    html.push('">');
    html.push(results[i].from_user);
    html.push('</a>');
    html.push(')');
    html.push("</span>");
    html.push('<span class="twg-learn">');
    html.push(this.createEmoticon('pos', tag, text));
    html.push(this.createEmoticon('neg', tag, text));
    html.push(this.createEmoticon('neu', tag, text));
    html.push('</span>');
    html.push('</div>');
  }
  return html.join("");
}

twitgraph.Texter.prototype.createLinkableText = function(result) {
  // Split the text into links such as http:// and @username
  var split = result.text.split(/(http:\/\/[^\s]*|@[^\s]*|#[^\s]*)/);
  var tweetLink = this.getTweetLink(result);
  var a = [];
  for (var i = 0; i < split.length; ++i) {
    if (split[i].length == 0) {
      continue;
    }
    if (split[i].indexOf('@') == 0) {
      // This is a user ref
      var refUser = split[i].substr(1);
      a.push('<a href="http://twitter.com/');
      a.push(refUser);
      a.push('">');
      a.push(split[i]);
      a.push('</a>');
    } else if (split[i].indexOf('#') == 0) {
      // This is a hashtag search term
      var hashtag = split[i].substr(1);
      a.push('<a href="http://search.twitter.com/search?q=');
      a.push(hashtag);
      a.push('">');
      a.push(split[i]);
      a.push('</a>');
    } else if (split[i].indexOf('http://') == 0) {
      // This is a web link
      a.push('<a href="');
      a.push(split[i]);
      a.push('">');
      a.push(split[i]);
      a.push('</a>');
    } else {
      // This is the tweet text, just link it to the tweet permalink
      a.push('<a href="');
      a.push(tweetLink);
      a.push('">');
      a.push(split[i]);
      a.push('</a>');
    }
  }
  return a.join('');
}

twitgraph.Texter.prototype.getTweetLink = function(result) {
  var a = [];
  a.push('http://twitter.com/');
  a.push(result.from_user);
  a.push('/statuses/');
  a.push(result.id);
  return a.join('');
}

twitgraph.Texter.prototype.createEmoticon = function(tag, selectedTag, text) {
  var s = []
  s.push('<a href="javascript:void(0)" onclick="twitgraph.Utils.learn(\'');
  s.push(tag);
  s.push('\', \'');
  s.push(escape(text));
  s.push('\', this)"');
  if (tag == selectedTag) {
    s.push(' class="twg-emoticon-selected"');
  }
  s.push(' title="O-mighty human, teach me right from wrong!"');
  s.push(' onmouseover="twitgraph.Utils.onLearnMouseOver(this)"');
  s.push(' onmouseout="twitgraph.Utils.onLearnMouseOut(this)"');
  s.push('>');
  s.push('<img src="');
  s.push(TWITGRAPH_BASE_URL);
  s.push('/s/img/');
  s.push(tag);
  s.push('.jpg"');
  s.push('/>');
  s.push('</a>');
  return s.join('');
}

twitgraph.Grapher = function(result) {
  this.result = result;
}

twitgraph.Grapher.prototype.drawLineChart = function() {
  var aggregate = this.result.aggregate;
  // Create and populate the data table.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Date');
  data.addColumn('number', ':-(');
  data.addColumn('number', ':-)');
  data.addColumn('number', ':-|');
  data.addRows(aggregate.length);
  for (var i = 0; i < aggregate.length; ++i) {
    data.setCell(i, 0, aggregate[i].date);
    data.setCell(i, 1, aggregate[i].neg);
    data.setCell(i, 2, aggregate[i].pos);
    data.setCell(i, 3, aggregate[i].neu);
  }

  // Create and draw the visualization.
  twitgraph.Utils.$('twg-graph').innerHTML = '';
  var chart = new google.visualization.AreaChart(twitgraph.Utils.$('twg-graph'));
  chart.draw(data, {legend: 'bottom',
                    isStacked: true,
                    width: 600,
                    height: 300,
                    colors: ["#FF4848", "#4AE371", "#2F74D0"]});
}

twitgraph.Grapher.prototype.drawPieChart = function() {
  var stats = this.result.stats;
  // Create and populate the data table.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Sentiment');
  data.addColumn('number', 'Tweet count');
  data.addRows(3);
  data.setValue(0, 0, ':-(');
  data.setValue(0, 1, stats.neg);
  data.setValue(1, 0, ':-)');
  data.setValue(1, 1, stats.pos);
  data.setValue(2, 0, ':-|');
  data.setValue(2, 1, stats.neu);

  // Create and draw the visualization.
  twitgraph.Utils.$('twg-graph-pie').innerHTML = '';
  var chart = new google.visualization.PieChart(twitgraph.Utils.$('twg-graph-pie'));
  chart.draw(data, {legend: 'none',
                    is3D: true,
                    width: 300,
                    height: 300,
                    colors: ["#FF4848", "#4AE371", "#2F74D0"]});
}

twitgraph.Grapher.prototype.drawGauge = function() {
  var stats = this.result.stats;
  // Create and populate the data table.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Sentiment');
  data.addColumn('number', 'Tweet count');
  data.addRows(1);
  var normalizedValue = ((stats.pos) / (stats.pos + stats.neg)) * 100;
  normalizedValue = Math.round(normalizedValue);
  twitgraph.Utils.log("Gauge: " + normalizedValue);
  data.setValue(0, 0, ':-)');
  data.setValue(0, 1, normalizedValue);

  // Create and draw the visualization.
  twitgraph.Utils.$('twg-graph-gauge').innerHTML = '';
  var chart = new google.visualization.Gauge(document.getElementById('twg-graph-gauge'));
  chart.draw(data, {width: 120,
                    height: 120,
                    redFrom: 0,
                    redTo: 30,
                    greenFrom:70,
                    greenTo: 100,
                    minorTicks: 5,
                    legent: 'none'});
}

// A data structure defining the state of the current query.
twitgraph.QueryState = function(q, dynamic_date, start, end, duration, show_text) {
  this.q = q;
  this.dynamic_date = dynamic_date;
  this.start = start;
  this.end = end;
  this.duration = duration;
  this.show_text = show_text;
}

twitgraph.QueryState.prototype.toUrlParams = function() {
  var a = [];
  a.push('&q=');
  a.push(encodeURIComponent(this.q));
  a.push('&dynamic_date=');
  a.push(this.dynamic_date ? '1' : '0');
  a.push('&start=');
  a.push(encodeURIComponent(twitgraph.Utils.serializeDate(this.start)));
  a.push('&end=');
  a.push(encodeURIComponent(twitgraph.Utils.serializeDate(this.end)));
  a.push('&duration=');
  a.push(encodeURIComponent(this.duration));
  a.push('&show_text=');
  a.push(this.show_text ? '1' : '0');
  return a.join('');
}

twitgraph.QueryState.prototype.toString = function() {
  var a = [];
  a.push(this.q);
  a.push(this.dynamic_date);
  a.push(twitgraph.Utils.serializeDate(this.start));
  a.push(twitgraph.Utils.serializeDate(this.end));
  a.push(this.duration);
  a.push(this.show_text);
  return a.join(", ");
}

if (window.twitgraph_onAppJsLoad) {
  twitgraph_onAppJsLoad();
}
