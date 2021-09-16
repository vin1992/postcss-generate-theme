/*
 * @Author: xuzhigang01@corp.netease.com
 * @Date: 2021-07-08 22:32:27
 * @LastEditTime: 2021-09-06 22:28:28
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /postcss-generate-theme/utils.js
 */
const color = require("color");
const valueParser = require("postcss-value-parser");
const shortenCssHex = require("shorten-css-hex");
const Window = require("window");
const gradient = require("gradient-parser");
const cssColorKeyWords = require("css-color-keywords");

const theme = require("./theme");

const window = new Window();

const compositionProps = [
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "background",
  "background-image",
  "border-image",
  "content",
  "box-shadow",
  "text-shadow",
  "outline",
  "list-style",
];
const ignoreColor = ["none", "transparent", "currentColor"];

// 判断是否支持css 变量
const isSupported =
  window.CSS && window.CSS.supports && window.CSS.supports("--a", 0);

const isColorKeyWords = (val) => {
  return !!cssColorKeyWords[val];
};
const themeSelectorIncluded = (selectors = "", darkSelector, nightSelector) => {
  return (
    selectors?.includes(darkSelector) || selectors?.includes(nightSelector)
  );
};

const isColorFuncNoOpacity = (o) => {
  return o.type === "function" && ["rgb", "hsl"].includes(o.value);
};

const isColorFuncHasOpacity = (o) => {
  return o.type === "function" && ["rgba", "hsla"].includes(o.value);
};

const isHexColor = (o) => {
  return o.type === "word" && o.value.indexOf("#") === 0;
};

// 判断是否是需要处理的css属性
const verifyDeclareProp = (decl) => {
  return compositionProps.includes(decl.prop) || /color$/.test(decl.prop);
};

const transformColorValToHex = (colorValue) => {
  let _color = colorValue.includes("#") ? colorValue : color(colorValue).hex();
  return shortenCssHex(_color).toLowerCase();
};

const getModeCssVariable = (lightVal, prop) => {
  let { name: cssVaribleName } = findModeCssValue(lightVal, prop);

  if (!cssVaribleName) {
    return lightVal;
  }

  return `var(${cssVaribleName})`;
};

const getModeColor = (lightVal, theme, prop) => {
  let themeColors = findModeCssValue(lightVal, prop)?.value;
  if (!themeColors) {
    return "";
  }

  let [darkColor, nightColor] = themeColors;

  if (theme === "dark") {
    return darkColor;
  } else if (theme === "night") {
    return nightColor;
  }
};

const findModeCssValue = (lightVal, prop) => {
  let key = lightVal;
  // 前景色 和 背景色 的 白色 区别命名索引key
  if (
    ["background", "background-color", "background-image"].includes(prop) &&
    lightVal === "#fff"
  ) {
    key = `${key}_bg`;
  }

  return theme[key];
};

const rewriteUrlValue = (url, mode) => {
  if (!url) return "";
  let paths = url.split("/");
  let newPaths = paths.map((p, id) => {
    if (id === paths.length - 1) {
      return p.replace(".", `.${mode}.`);
    }
    return p;
  });

  return newPaths.join("/");
};

const transpileGradient = (decl, theme) => {
  let { value: val } = decl;
  let ast;
  try {
    // gradient Parse 无法解析 .25turn 渐变方向值
    ast = gradient.parse(val);
  } catch (e) {
    console.log("[gradient 解析解析异常，已跳过]", val);
    return val;
  }

  if (
    ast &&
    Array.isArray(ast) &&
    ast.length > 0 &&
    ast[0].type.includes("-gradient")
  ) {
    let multipleVal = [];

    ast.forEach((astItem, index) => {
      let finalVals = [];

      let colorList = astItem.colorStops;

      colorList.forEach((color, id) => {
        let item = "";
        if (color.type === "hex") {
          item = getModeCssVariable(
            transformColorValToHex(`#${color.value}`),
            decl.prop
          );
        } else if (isColorKeyWords(color.value)) {
          item = getModeCssVariable(
            transformColorValToHex(color.value),
            decl.prop
          );
        } else if (["rgb", "rgba"].includes(color.type)) {
          let innerVal = color.value.join(",");

          if (color.type === "rgb") {
            let lightVal = transformColorValToHex(`rgb(${innerVal})`);
            item = getModeCssVariable(lightVal, decl.prop);
          } else {
            item = transpileRgbaAndHslaValue(
              `rgba(${innerVal})`,
              decl.prop,
              theme
            );
          }
        } else if (["hsl", "hsla"].includes(color.type)) {
          let innerVal = color.value.join(",");

          if (color.type === "hsl") {
            let lightVal = transformColorValToHex(`hsl(${innerVal})`);
            item = getModeCssVariable(lightVal, decl.prop);
          } else {
            item = transpileRgbaAndHslaValue(
              `hsla(${innerVal})`,
              decl.prop,
              theme
            );
          }
        } else {
          item = color.value;
        }

        if (color.length) {
          item += ` ${color.length.value}${color.length.type}`;
        }

        finalVals[id] = item;
      });

      let orientation = astItem.orientation;

      let direction = decl.value
        .slice(decl.value.indexOf("(") + 1)
        .split(",")
        .shift();

      if (orientation) {
        if (orientation.type === "angular") {
          direction = orientation.value + "deg";
        } else if (orientation.type === "directional") {
          direction = `to ${orientation.value}`;
        } else if (orientation[0].type === "extent-keyword") {
          direction = orientation[0].value;
        }
      }
      multipleVal[index] = `${astItem.type}(${direction}, ${finalVals.join(
        ","
      )})`;
    });

    return multipleVal.join(",");
  }
};

const transpileUrlValue = (decl, theme) => {
  let { nodes: valueNodes } = valueParser(decl.value);
  let pureValNodes = valueNodes.filter((node) => node.type !== "space");

  let res = "";

  if (pureValNodes.length) {
    pureValNodes.forEach((node, id) => {
      if (
        node.type === "function" &&
        node.value === "url" &&
        node.nodes.length === 1
      ) {
        res = `url("${rewriteUrlValue(node.nodes[0].value, theme)}")`;
      }
    });

    return res;
  }
};

const transpileCompositionValue = (decl, theme) => {
  let { nodes: valueNodes } = valueParser(decl.value);
  let pureValNodes = valueNodes.filter((node) => node.type !== "space");

  const finalVals = [];

  if (pureValNodes.length) {
    pureValNodes.forEach((node, id) => {
      let item = "";
      if (isHexColor(node) || isColorKeyWords(node.value)) {
        item = getModeCssVariable(
          transformColorValToHex(node.value),
          decl.prop
        );
      } else if (["rgb", "rgba"].includes(node.value)) {
        let innerVal = node.nodes
          .filter((val) => val.type === "word")
          .map((n) => n.value)
          .join(",");

        if (node.value === "rgb") {
          let lightVal = transformColorValToHex(`rgb(${innerVal})`);
          item = getModeCssVariable(lightVal, decl.prop);
        } else {
          item = transpileRgbaAndHslaValue(
            `rgba(${innerVal})`,
            decl.prop,
            theme
          );
        }
      } else if (["hsl", "hsla"].includes(node.value)) {
        let innerVal = node.nodes
          .filter((val) => val.type === "word")
          .map((n) => n.value)
          .join(",");

        if (node.value === "hsl") {
          let lightVal = transformColorValToHex(`hsl(${innerVal})`);
          item = getModeCssVariable(lightVal, decl.prop);
        } else {
          item = transpileRgbaAndHslaValue(
            `hsla(${innerVal})`,
            decl.prop,
            theme
          );
        }
      } else {
        item = node.value;
      }

      finalVals[id] = item;
    });

    return finalVals.join(" ");
  }
};

const transpileRgbaAndHslaValue = (colorVal, prop, theme) => {
  let parsedValue = valueParser(colorVal);
  let { nodes: valueNodes } = parsedValue;
  if (valueNodes.length === 1) {
    let { type, value, nodes } = valueNodes[0];
    // 提取r,g,b value 转换为 十六进制的色值
    let hexColor = rh2hex(nodes, value);
    // 将十六进制的色值 与 色板匹配，找出对应的主题色，如果没有，原路返回
    let themeColor = getModeColor(hexColor, theme, prop);

    let opacityVal = getOpacityFromRgbaAndHsla(nodes);

    if (!themeColor) {
      return colorVal;
    }

    //  找到十六进制的主题色找到后，转换为 r,g,b value
    let argNumStr = hex2rh(themeColor, value).join(",");

    // 加上 透明度参数 a ，拼合最后的value值返回
    let finalVal = `${value}(${argNumStr},${opacityVal})`;

    return finalVal;
  }
};

const rh2hex = (innerValNodes, fnName) => {
  if (!fnName || !innerValNodes.length) return "``";
  let argList = innerValNodes.filter((n) => n.type === "word");

  let len = argList.length;
  if (len) {
    let argNumStr = argList
      .slice(0, len - 1)
      .map((n) => n.value)
      .join(",");
    let colorVal = `${fnName}(${argNumStr})`;
    return transformColorValToHex(colorVal);
  }
};

// 将hex color  转换为 对应的 rgb hsl 色值数组: [255,255,255]
const hex2rh = (hexColor, fnName) => {
  let fn = fnName.slice(0, fnName.length - 1);
  return color(hexColor)[fn]().array();
};

const getOpacityFromRgbaAndHsla = (innerValNodes) => {
  let argList = innerValNodes.filter((n) => n.type === "word");
  return argList.pop().value;
};

//  统一处理 单个属性、复合属性 和 gradient 中包含的 rgba 和 hsla，输出最终完整的css value
const processRgbaAndHslaValue = (decl, theme) => {
  let parsedValue = valueParser(decl.value);
  let { nodes: valueNodes } = parsedValue;

  if (valueNodes.length === 1 && isColorFuncHasOpacity(valueNodes[0])) {
    // 单个属性
    return transpileRgbaAndHslaValue(decl.value, decl.prop, theme);
  } else if (
    decl.value.includes("-gradient(") &&
    !decl.value.includes("url(")
  ) {
    // 处理 conic-/linear-/radial-gradient ,暂不支持repeat
    return transpileGradient(decl, theme);
  } else if (decl.value.includes("-gradient(") && decl.value.includes("url(")) {
    // 这种情况有点复杂，还没想好怎么处理，一般场景很少
    return decl.value;
  } else {
    //  处理复合属性 类似： #333 1px solid
    return transpileCompositionValue(decl, theme);
  }
};

const processCssProp = (decl) => {
  if (compositionProps.includes(decl.prop)) {
    if (decl.value.includes("-gradient(")) {
      return decl.prop;
    }

    if (decl.value.includes("url(")) {
      if (["content", "border-image", "background-image"].includes(decl.prop)) {
        return decl.prop;
      }
      return `${decl.prop}-image`;
    }
    return `${decl.prop}-color`;
  }

  return decl.prop;
};

const processCssValue = (decl) => {
  // 普通 color value  直接  返回
  // 复合 或者 包含 color value 的  匹配 输出 值
  // 图片url 的  单独处理

  let parsedValue = valueParser(decl.value);
  let { nodes: valueNodes } = parsedValue;

  if (ignoreColor.includes(decl.value)) {
    return decl.value;
  } else if (decl.prop === "content" && !decl.value.includes("url(")) {
    return `${decl.value}`;
  } else if (decl.value.includes("var(")) {
    return decl.value;
  } else if (
    valueNodes.length === 1 &&
    (isColorFuncNoOpacity(valueNodes[0]) ||
      isHexColor(valueNodes[0]) ||
      isColorKeyWords(decl.value))
  ) {
    // 单个颜色属性
    return getModeCssVariable(transformColorValToHex(decl.value), decl.prop);
  } else if (valueNodes.length === 1 && isColorFuncHasOpacity(valueNodes[0])) {
    // rgba hlsa 带透明度的颜色值不处理
    return decl.value;
  } else if (
    decl.value.includes("-gradient(") &&
    !decl.value.includes("url(")
  ) {
    // 处理 conic-/linear-/radial-gradient ,暂不支持repeat
    return transpileGradient(decl);
  } else if (decl.value.includes("-gradient(") && decl.value.includes("url(")) {
    // 这种情况有点复杂，还没想好怎么处理，一般场景很少
    return decl.value;
  } else {
    //  处理复合属性 类似： #333 1px solid
    return transpileCompositionValue(decl);
  }
};

const processSelector = (selector, themeSelector) => {
  if (selector.includes(",")) {
    let arr = selector.split(",").map((s) => {
      return `${themeSelector} ${s}`;
    });

    return arr.join(",");
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
  processRgbaAndHslaValue,
  transpileUrlValue,
};
