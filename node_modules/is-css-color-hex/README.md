# is-css-color-hex
[![NPM version](https://badge.fury.io/js/is-css-color-hex.svg)](https://badge.fury.io/js/is-css-color-hex) [![Build Status](https://travis-ci.org/dustinspecker/is-css-color-hex.svg)](https://travis-ci.org/dustinspecker/is-css-color-hex) [![Coverage Status](https://img.shields.io/coveralls/dustinspecker/is-css-color-hex.svg)](https://coveralls.io/r/dustinspecker/is-css-color-hex?branch=master)

[![Code Climate](https://codeclimate.com/github/dustinspecker/is-css-color-hex/badges/gpa.svg)](https://codeclimate.com/github/dustinspecker/is-css-color-hex) [![Dependencies](https://david-dm.org/dustinspecker/is-css-color-hex.svg)](https://david-dm.org/dustinspecker/is-css-color-hex/#info=dependencies&view=table) [![DevDependencies](https://david-dm.org/dustinspecker/is-css-color-hex/dev-status.svg)](https://david-dm.org/dustinspecker/is-css-color-hex/#info=devDependencies&view=table)

> Determine if a string is a valid CSS color hex

## Install
```
npm install --save is-css-color-hex
```

## Usage
### ES2015
```javascript
import isCSSColorHex from 'is-css-color-hex';

isCSSColorHex(1);
// => false

isCSSColorHex('0aC');
// => false

isCSSColorHex('0aCf');
// => false

isCSSColorHex('01AbCd');
// => false

isCSSColorHex('01AbCdff');
// => false

isCSSColorHex('#0aC');
// => true

isCSSColorHex('#0aCf');
// => true

isCSSColorHex('#01AbCd');
// => true

isCSSColorHex('#01AbCdfF');
// => true
```

### ES5
```javascript
var isCSSColorHex = require('is-css-color-hex');

isCSSColorHex(1);
// => false

isCSSColorHex('0aC');
// => false

isCSSColorHex('0aCf');
// => false

isCSSColorHex('01AbCd');
// => false

isCSSColorHex('01AbCdff');
// => false

isCSSColorHex('#0aC');
// => true

isCSSColorHex('#0aCf');
// => true

isCSSColorHex('#01AbCd');
// => true

isCSSColorHex('#01AbCdfF');
// => true
```

## LICENSE
MIT © [Dustin Specker](https://github.com/dustinspecker)
