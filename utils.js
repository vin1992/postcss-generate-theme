/*
 * @Author: your name
 * @Date: 2021-07-08 22:32:27
 * @LastEditTime: 2021-07-08 23:50:47
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /postcss-generate-theme/utils.js
 */
const color = require('color');
const valueParser = require('postcss-value-parser');
const shortenCssHex = require('shorten-css-hex');
const Window = require('window');
const gradient = require('gradient-parser');

const theme = require('./theme');

const window = new Window();

const compositionProps = ['border', 'background', 'background-image', 'box-shadow', 'text-shadow', 'outline'];
const ignoreColor = ['none', 'transparent', 'currentcolor']

// 判断是否支持css 变量
const isSupported = window.CSS && window.CSS.supports && window.CSS.supports('--a', 0);

const themeSelectorIncluded = (selectors = '', darkSelector, nightSelector) => {
	return selectors?.includes(darkSelector) || selectors?.includes(nightSelector);
};

// 判断是否是需要处理的css属性
const verifyDeclareProp = (decl) => {
	return decl.prop?.split('-').pop() === 'color' || compositionProps.includes(decl.prop);
};

const transformColorValToHex = (colorValue) => {
	let _color = colorValue.includes('#') ? colorValue : color(colorValue).hex();
	return shortenCssHex(_color).toLowerCase();
};

const findModeColor = (lightVal, decl) => {
	let key = lightVal
	// 前景色 和 背景色 的 白色 区别命名索引key
	if (['background', 'background-color'].includes(decl.prop) && lightVal === '#fff') {
		key = `${key}_bg`;
	}

	let cssVaribleName = theme[key]?.name;

	if (!cssVaribleName) {
		return lightVal;
	}

	return `var(${cssVaribleName})`;
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


const transpileGradient = (decl) => {
	// TODO: 多个逗号分隔的 value的场景
	let { value: val } = decl;
	let ast;
	try {
		// gradient Parse 无法解析 .25turn 渐变方向值
		ast = gradient.parse(val);
	} catch (e) {
		console.log('[gradient 解析解析异常，已跳过]', val);
		return val;
	}

	let finalVals = [];
	if (ast.length > 0 && ast[0].type.includes('-gradient')) {
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
			} else if (['hsl', 'hsla'].includes(color.type)) {
				let innerVal = color.value.join(',');
				let lightVal =
					color.type === 'hsl'
						? transformColorValToHex(`hsl(${innerVal})`)
						: transformColorValToHex(`hsla(${innerVal})`);

				item = findModeColor(lightVal, decl);
			} else {
				item = findModeColor(transformColorValToHex(color.value), decl);
			}

			if (color.length) {
				item += ` ${color.length.value}${color.length.type}`;
			}

			finalVals[id] = item;
		});

		let orientation = ast[0].orientation;

		let direction = decl.value.slice(decl.value.indexOf('(') + 1).split(',').shift();

		if (orientation) {
			if (orientation.type === 'angular') {
				direction = orientation.value + 'deg';
			} else if (orientation.type === 'directional') {
				direction = `to ${orientation.value}`;
			} else if (orientation[0].type === 'extent-keyword') {
				direction = orientation[0].value;
			}
		}

		console.log(ast[0], finalVals)
		return `${ast[0].type}(${direction}, ${finalVals.join(',')})`;
	}
};

const transpileCompositionValue = (decl) => {
	let { nodes: valueNodes } = valueParser(decl.value);
	let pureValNodes = valueNodes.filter(node => node.type !== 'space');

	const finalVals = [];

	if (pureValNodes.length) {
		pureValNodes.forEach((node, id) => {
			let item = ''
			if (isHexColor(node)) {
				item = findModeColor(transformColorValToHex(node.value), decl);
			} else if (['rgb', 'rgba'].includes(node.value)) {
				let innerVal = node.nodes.filter(val => val.type === 'word').map(n => n.value).join(',');
				let lightVal =
					node.value === 'rgb'
						? transformColorValToHex(`rgb(${innerVal})`)
						: transformColorValToHex(`rgba(${innerVal})`);

				item = findModeColor(lightVal, decl);
			} else if (['hsl', 'hsla'].includes(node.value)) {
				let innerVal = node.nodes.filter(val => val.type === 'word').map(n => n.value).join(',');
				let lightVal =
					node.value === 'hsl'
						? transformColorValToHex(`hsl(${innerVal})`)
						: transformColorValToHex(`hsla(${innerVal})`);

				item = findModeColor(lightVal, decl);
			} else {
				item = node.value
			}

			finalVals[id] = item
		})

		return finalVals.join(' ')
	}


}
const isColorFunc = (o) => {
	return o.type === 'function' && ['rgb', 'rgba', 'hsl', 'hsla'].includes(o.value)
}

const isHexColor = (o) => {
	return o.type === 'word' && o.value.indexOf('#') === 0
}

const processCssValue = (decl) => {
	// 普通 color value  直接  返回
	// 复合 或者 包含 color value 的  匹配 输出 值
	// 图片url 的  单独处理

	let parsedValue = valueParser(decl.value);
	let { nodes: valueNodes } = parsedValue;

	if (ignoreColor.includes(decl.value)) {
		return decl.value;
	} else if (valueNodes.length === 1 && (isColorFunc(valueNodes[0]) || isHexColor(valueNodes[0]))) {
		// 单个颜色属性
		return findModeColor(transformColorValToHex(decl.value), decl);
	} else if (decl.value.includes('url(')) {
		// TODO: url 单独处理 暂时跳过
		return decl.value;
	} else if (decl.value.includes('-gradient(')) {
		// 处理 conic-/linear-/radial-gradient ,暂不支持repeat
		return transpileGradient(decl);
	} else {
		//  处理复合属性 类似： #333 1px solid 
		return transpileCompositionValue(decl)
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
