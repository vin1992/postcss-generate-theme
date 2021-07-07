/*
 * @Author: xuzhigang01@corp.netease.com
 * @Date: 2021-06-16 22:05:07
 * @LastEditTime: 2021-07-07 21:58:55
 * @LastEditors: Please set LastEditors
 * @Description: 主题色样式生成
 * @FilePath: /gen-theme/index.js
 */

// let postcss = require('postcss');
let color = require('color');
let shortenCssHex = require('shorten-css-hex');
// import { readFile, writeFile } from 'fs';

let theme = require('./theme');

const faultColors = [];

const compositionProps = ['border', 'background', 'box-shadow', 'text-shadow', 'outline'];

const themeSelectorIncluded = (selectors = '', darkSelector, nightSelector) => {
	return selectors?.includes(darkSelector) || selectors?.includes(nightSelector);
};

const verifyDeclareProp = (decl) => {
	return decl.prop?.split('-').pop() === 'color' || compositionProps.includes(decl.prop);
};

const transformColorValToHex = (colorValue) => {
	let _color = color(colorValue).hex();
	return shortenCssHex(_color).toLowerCase();
};

const findModeColor = (lightVal, mode, decl) => {
	// 前景色 和 背景色 的 白色 区别命名索引key
	if (['background', 'background-color'].includes(decl.prop) && lightVal === '#fff') {
		lightVal = `${lightVal}_bg`;
	}

	try {
		let [darkVal, nightVal] = theme[lightVal].value || [];

		if (mode === 'dark') {
			return darkVal;
		} else if (mode === 'night') {
			return nightVal;
		}
	} catch (e) {
		faultColors.push(lightVal);
		return lightVal;
	}
};

const processCssProp = (decl) => {
	if (['border', 'background', 'outline'].includes(decl.prop)) {
		if (decl.value.includes('linear-gradient(') || decl.value.includes('url(')) {
			return decl.prop;
		}
		return `${decl.prop}-color`;
	}

	return decl.prop;
};

const processCssValue = (decl, mode) => {
	// 普通 color value  直接  返回
	// 复合 或者 包含 color value 的  匹配 输出 值
	// 图片url 的  单独处理

	if (
		(decl.value.indexOf('#') === 0 && decl.value.split(' ').length === 1) ||
		(decl.value.indexOf('rgb') === 0 && decl.value.split('').pop() === ')')
	) {
		// 单个颜色属性
		let lightValue = transformColorValToHex(decl.value);
		let declVal = findModeColor(lightValue, mode, decl);
		return declVal;
	} else if (
		decl.value.includes('url(') ||
		decl.value.includes('linear-gradient(') ||
		decl.value.includes('transparent') ||
		['none'].includes(decl.value)
	) {
		// TODO: 单独处理
		return decl.value;
	} else {
		/* let sid = decl.value.indexOf('(');
			let eid = decl.value.indexOf(')');

			let str = decl.value.slice(sid + 1, eid);

			let arr = str.split(',');

			let newArr = arr.map((item) => {
				if (item.includes('#')) {
					let [_, color, rest] = item.split(' ');

					let lightValue = transformColorValToHex(color);
					let declVal = findModeColor(lightValue, mode, decl);
					color = declVal;

					return ` ${color} ${rest}`;
				} else {
					return item;
				}
			});

			return `linear-gradient(${newArr.join(',')})`; */

		let arr = decl.value.split(' ');
		let colorIndex;
		let newArr = arr.map((item, id) => {
			if (item.includes('#')) {
				colorIndex = id;
				let lightValue = transformColorValToHex(item);
				// console.log(lightValue);
				let declVal = findModeColor(lightValue, mode, decl);
				// console.log(lightValue, declVal);

				return declVal;
			} else {
				return item;
			}
		});

		if (['box-shadow', 'text-shadow'].includes(decl.prop)) {
			return newArr.join(' ');
		}
		// console.log(decl.prop, decl.value);
		return newArr[colorIndex];
	}
};

const processSelector = (selector, themeSelector) => {
	if (selector.includes(',')) {
		let arr = selector.split(',').map((s) => {
			return `${themeSelector} ${s}`;
		});

		return arr.join(',');
	} else {
		return `${themeSelector} ${selector}`;
	}
};

module.exports = (options = {}) => {
	let dark = options.darkSelector || '.theme-dark';
	let night = options.nightSelector || '.theme-night';

	return {
		postcssPlugin: 'postcss-generate-theme',
		prepare(result) {
			if (faultColors.length) {
				let msg = [...new Set(faultColors)] + '';
				result.warn(`${msg} 色值不在色板中，请确认色值是否正确`);
			}
		},
		Root(root, { Rule }) {
			root.walk((node) => {
				let last = node;

				let { type, selector, nodes: declNodes } = node;

				let isIncludedThemeSelector = themeSelectorIncluded(selector, dark, night);

				if (type === 'rule' && !isIncludedThemeSelector && declNodes) {
					let needProcessDecls = declNodes.filter((dcl) => verifyDeclareProp(dcl));

					if (needProcessDecls.length) {
						let fixDark = new Rule({ selector: processSelector(selector, dark) });
						let fixNight = new Rule({ selector: processSelector(selector, night) });

						needProcessDecls.forEach((decl) => {
							let prop = processCssProp(decl);

							let darkValue = processCssValue(decl, 'dark');
							let nightVal = processCssValue(decl, 'night');

							fixDark.append({ prop, value: darkValue });
							fixNight.append({ prop, value: nightVal });

							last.after(fixDark);
							fixDark.after(fixNight);
						});
					}
				}
			});
		},
	};
};

// plugin.postcss = true;
module.exports.postcss = true;

// readFile('./a.css', (err, data) => {
// 	if (err) throw err;
// 	postcss([plugin])
// 		.process(data, { from: './a.css' })
// 		.then((res) => {
// 			writeFile('a.out.css', res.css, (err) => {
// 				if (err) throw err;
// 				console.log('The file has been saved!');
// 			});
// 		});
// });
