/*
 * @Author: xuzhigang01@corp.netease.com
 * @Date: 2021-06-16 22:05:07
 * @LastEditTime: 2021-08-31 22:10:06
 * @LastEditors: Please set LastEditors
 * @Description: 主题色样式生成
 * @FilePath: /gen-theme/index.js
 */

const { themeSelectorIncluded, verifyDeclareProp, processCssValue } = require('./utils');

let postcss = require("postcss");
let { readFile, writeFile, readFileSync } = require("fs");

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


readFile("./test.css", (err, data) => {
  if (err) throw err;
  postcss([plugin])
    .process(data, { from: "./test.css" })
    .then((res) => {
      writeFile("test.out.css", res.css, (err) => {
        if (err) throw err;
        console.log("The file has been saved!");
      });
    });
});