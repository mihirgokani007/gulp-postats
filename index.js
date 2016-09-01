'use strict';

var pluginName = require('./package.json').name;
var through = require('through2');
var path = require('path');
var util = require('util');
var chalk = require('chalk');
var PoFile = require('pofile');
var Table = require('cli-table');

var gUtil = require('gulp-util');

function TableWrapper(options) {
  var self = this;
  self.options = options;
  var _ = self.options.styles['header'];
  self._table = new Table({
      head: ['', _('Comments'), _('Headers'), _('Strings')]
    , colWidths: [30, 18, 18, 18]
    , colAligns: ['left', 'middle', 'middle', 'middle']
    , style: {header: _, border: ['white'], compact: !options.expand}
  });
}

TableWrapper.prototype.getPercentage = function (individual, total) {
  var self = this;
  return Math.round(individual / (total || 1) * 100 * 100) / 100;
};

TableWrapper.prototype.withPercentage = function (individual, total) {
  var self = this;
  var percent, formatted, _ = self.options.styles['attention'];
  if (individual != null) {
    percent = self.getPercentage(individual, total);
    formatted = individual + ' (' + percent + '%)';
    return percent ? _(formatted) : formatted;
  } else {
    return '--';
  }
};

TableWrapper.prototype.addToTable = function (stats) {
  var self = this;
  var view = {
    'Total Keys': [stats.comments.total, stats.headers.total, stats.items.total],
    'Dupe Keys': [self.withPercentage(stats.comments.dups, stats.comments.total), 
                  self.withPercentage(stats.headers.dups, stats.headers.total), 
                  self.withPercentage(stats.items.dups, stats.items.total)],
    'Empty Values': ['--', '--', self.withPercentage(stats.items.empty, stats.items.total)],
    'Obsolete Values': ['--', '--', self.withPercentage(stats.items.obsolete, stats.items.total)]
  };
  var _ = self.options.styles[stats.lang];
  Object.keys(view).forEach(function(k) {
    var v = view[k], row = {}; 
    var h = _('[' + stats.lang + '] ' + k); 
    row[h] = v; 
    self._table.push(row);
  });
};

TableWrapper.prototype.toString = function () {
  var self = this;
  return self._table.toString();
};

TableWrapper.prototype.print = function () {
  var self = this;
  self.options.print(self.toString());
};


TableWrapper.defaults = {
  print: console.log.bind(console),
  styles: {
    header: chalk.white.bold.underline,
    attention: chalk.red.italic,
    en: chalk.green.bold,
    de: chalk.cyan.bold,
    fr: chalk.blue.bold,
    ja: chalk.magenta.bold,
    pot: chalk.yellow.bold.italic
  }
};


module.exports = function (options) {
  options = util._extend(TableWrapper.defaults, options);
  var table = new TableWrapper(options);

  return through.obj(function (file, enc, cb) {
    var self = this;

    if (file.isNull()) {
      self.push(file);
      return cb();
    }
    
    if (file.isStream()) {
      self.emit('error', new gUtil.PluginError(pluginName, 'Streaming not supported'));
      return cb();
    }

    var pofile = PoFile.parse(file.contents.toString());
    var stats = {lang: pofile.headers['Language'] || 'pot'};

    // Comments
    stats.comments = {};
    stats.comments.total = pofile.comments.length;
    stats.comments.unique = (new Set(pofile.comments)).size;
    stats.comments.dups = stats.comments.total - stats.comments.unique;
    
    // Headers
    stats.headers = {};
    stats.headers.total = Object.keys(pofile.headers).length;
    stats.headers.unique = (new Set(Object.keys(pofile.headers))).size;
    stats.headers.dups = stats.headers.total - stats.headers.unique;

    // Items
    stats.items = {};
    stats.items.total = pofile.items.length;
    stats.items.unique = (new Set(pofile.items.map(function(item) { return item.msgid; }))).size;
    stats.items.dups = stats.items.total - stats.items.unique;
    
    // Flags: fuzzy, obsolete
    stats.flags = {};
    stats.obsolete = 0;
    stats.items.empty = 0;
    pofile.items.forEach(function(item) { 
      stats.obsolete = (stats.obsolete || 0) + item.obsolete;
      stats.items.empty = (stats.items.empty || 0) + (!item.msgstr ? 1 : !item.msgstr.join('').length);
      Object.keys(item.flags).forEach(function(flag) {
        stats.flags[flag] = (stats.flags[flag] || 0) + item.flags[flag];
      });
    });

    // Finally add stats to table
    table.addToTable(stats);
    self.push(file);
    cb();

  }, function(cb) {

    // Print the table once all stats are added to it
    table.print();
    cb();
    
  });
};
