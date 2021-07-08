/*
 * @Author: your name
 * @Date: 2021-07-08 22:32:27
 * @LastEditTime: 2021-07-08 23:50:47
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /postcss-generate-theme/utils.js
 */
const color = require('color');
const shortenCssHex = require('shorten-css-hex');
const Window = require('window');
const gradient = require('gradient-parser');

const theme = require('./theme');

const window = new Window();

const compositionProps = ['border', 'background', 'box-shadow', 'text-shadow', 'outline'];

// 判断是否支持css 变量
const isSupported = window.CSS && window.CSS.supports && window.CSS.supports('--a', 0);

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

const findModeColor = (lightVal, decl) => {
	// 前景色 和 背景色 的 白色 区别命名索引key
	if (['background', 'background-color'].includes(decl.prop) && lightVal === '#fff') {
		lightVal = `${lightVal}_bg`;
	}

	let lightCssVariable = theme[lightVal]?.name;

	if (!lightCssVariable) {
		return lightVal;
	}

	return `var(${lightCssVariable})`;
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

const transpileLinearGradient = (decl) => {
	// TODO: 多个逗号分隔的 value的场景
	let { value: val } = decl;
	let ast;
	try {
		ast = gradient.parse(val);
	} catch (e) {
		return val;
	}

	let finalVals = [];
	if (ast.length > 0 && ast[0].type === 'linear-gradient') {
		let colorList = ast[0].colorStops;
		colorList.forEach((color, id) => {
			let item = '';
			if (color.value === 'transparent') {
				item = color.value;
			} else if (color.type === 'hex') {
				let lightVal = transformColorValToHex(`#${color.value}`);
				item = findModeColor(lightVal, decl);
			} else if (['rgb', 'rgba'].includes(color.type)) {
				let innerVal = color.value.join(',');
				let lightVal =
					color.type === 'rgb'
						? transformColorValToHex(`rgb(${innerVal})`)
						: transformColorValToHex(`rgba(${innerVal})`);

				item = findModeColor(lightVal, decl);
			} else {
				item = findModeColor(transformColorValToHex(color.value));
			}

			if (color.length) {
				item += ` ${color.length.value}${color.length.type}`;
			}

			finalVals[id] = item;
		});

		let orientation = ast[0].orientation;
		let direction = '';

		if (orientation) {
			if (orientation.type === 'angular') {
				direction = orientation.value + 'deg';
			} else if (orientation.type === 'directional') {
				direction = `to ${orientation.value}`;
			} else {
				direction = orientation.value;
			}
		}

		return `linear-gradient(${direction}, ${finalVals.join(',')})`;
	}
};

const processCssValue = (decl) => {
	// 普通 color value  直接  返回
	// 复合 或者 包含 color value 的  匹配 输出 值
	// 图片url 的  单独处理

	if (
		(decl.value.indexOf('#') === 0 && decl.value.split(' ').length === 1) ||
		(decl.value.indexOf('rgb') === 0 && decl.value.split('').pop() === ')')
	) {
		// 单个颜色属性
		let lightValue = transformColorValToHex(decl.value);
		let declVal = findModeColor(lightValue, decl);
		return declVal;
	} else if (decl.value.includes('url(') || decl.value.includes('transparent') || ['none'].includes(decl.value)) {
		// TODO: 单独处理
		return decl.value;
	} else if (decl.value.includes('linear-gradient(')) {
		return transpileLinearGradient(decl);
	} else {
		let arr = decl.value.split(' ');
		let newArr = arr.map((item) => {
			if (item.includes('#')) {
				let lightValue = transformColorValToHex(item);
				let declVal = findModeColor(lightValue, decl);

				return declVal;
			} else {
				return item;
			}
		});

		console.log(decl.prop, decl.value);
		return newArr.join(' ');
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

module.exports = {
	isSupported,
	themeSelectorIncluded,
	verifyDeclareProp,
	processCssProp,
	processCssValue,
	processSelector,
};
