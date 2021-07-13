/*
 * @Author: xuzhigang01@corp.netease.com
 * @Date: 2021-06-16 22:05:07
 * @LastEditTime: 2021-07-09 00:01:11
 * @LastEditors: Please set LastEditors
 * @Description: 主题色样式生成
 * @FilePath: /gen-theme/index.js
 */

const postcss = require('postcss');
// const valueParser = require('postcss-value-parser');
const { themeSelectorIncluded, verifyDeclareProp, processCssValue } = require('./utils');

import { readFile, writeFile } from 'fs';

// let cssValue = 'conic-gradient(from 0.25turn at 50% 30%, #eee, 10deg, #3f87a6, 350deg, #333)'
// let parsedValue = valueParser(cssValue)
// console.log('解析value', JSON.stringify(parsedValue, null, 2))

const plugin = (options = {}) => {
	let dark = options.darkSelector || '.theme-dark';
	let night = options.nightSelector || '.theme-night';

	return {
		postcssPlugin: 'postcss-generate-theme',
		Root(root) {
			root.walk((node) => {
				let { type, selector, nodes: declNodes } = node;

				let isIncludedThemeSelector = themeSelectorIncluded(selector, dark, night);

				if (type === 'rule' && !isIncludedThemeSelector && declNodes) {
					let needProcessDecls = declNodes.filter((dcl) => verifyDeclareProp(dcl));

					if (needProcessDecls.length) {
						needProcessDecls.forEach((decl) => {
							decl.value = processCssValue(decl);
						});
					}
				}
			});
		},
	};
};

plugin.postcss = true;
// module.exports.postcss = true;

readFile('./a.css', (err, data) => {
	if (err) throw err;
	postcss([plugin])
		.process(data, { from: './a.css' })
		.then((res) => {
			writeFile('a.out.css', res.css, (err) => {
				if (err) throw err;
				console.log('The file has been saved!');
			});
		});
});
