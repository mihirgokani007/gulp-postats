# [gulp](http://gulpjs.com)-pofill

> Get some nice statistics about generated translations


## Install

Install with [npm][1]

```sh
npm install --save-dev gulp-poinfo
```


## API

```js
var gulp = require('gulp');
var pofill = require('gulp-pofill');

gulp.task('translations', function () {
    return gulp.src('po/**/*.po')
        .pipe(poinfo());
});
```

Note that all callbacks are async, i.e. you can return a promise which resolves to
the manipulated comment, header, or item.

## Example

For example, the gulp-angular-gettext plugin will output an empty json if PO file
contains empty translations. In some cases this is expected, and you'd write
something like following:

```js
var gulp = require('gulp');
var pofill = require('gulp-pofill');
var gettext = require('gulp-angular-gettext');

gulp.task('translations', function () {
    return gulp.src('po/**/*.po')
        .pipe(gettext.compile({format: 'json'}))
        .pipe(gulp.dest('dist/translations/'));
});
```

But in many other cases, you want to fillup the translation strings with the
same strings as translations:


```js
var gulp = require('gulp');
var pofill = require('gulp-pofill');
var gettext = require('gulp-angular-gettext');

gulp.task('translations', function () {
    return gulp.src('po/**/*.po')
        .pipe(pofill({
            items: function(item) {
                // If msgstr is empty, use identity translation
                if (!item.msgstr.length) {
                  item.msgstr = [''];
                }
                if (!item.msgstr[0]) {
                    item.msgstr[0] = item.msgid;
                }
                return item;
            }
        }))
        .pipe(gettext.compile({format: 'json'}))
        .pipe(gulp.dest('dist/translations/'));
});
```

This can be useful when verifying translations in 
[angular-translate][3] 
using `useMissingTranslationHandler`.

By the way, due to its async nature it can also be used to auto-fill 
translations using online translation APIs.

Checkout my `gulp-pofill-yandex` plugin for dynamically fetching
translations from [yandex][4] - a free translation service.


# End Matter

## Afterword

Well, I created this library as a building block for dynamically 
fetching missing translations from a webservice. However, this library
is written in a way that it can be used with any other sync / async
operations for filling up missing translations or even transforming
existing translations.

## Author

[Mihir Gokani][0]

## License

Licensed under MIT.


[0]: https://github.com/mihirgokani007
[1]: https://npmjs.org/package/gulp-pofill
[2]: https://github.com/rubenv/pofile#the-poitem-class
[3]: https://angular-translate.github.io
[4]: https://tech.yandex.com/translate


