/*
 * @Author: xuzhigang01@corp.netease.com
 * @Date: 2021-06-16 22:05:07
 * @LastEditTime: 2022-08-23 19:10:08
 * @LastEditors: 徐志刚 xuzhigang01@corp.netease.com
 * @Description: 主题色样式生成
 * @FilePath: /gen-theme/index.js
 */

// const postcss = require("postcss");
const { writeFile } = require("fs");
const multimatch = require("multimatch");
const path = require("path");

const {
  themeSelectorIncluded,
  verifyDeclareProp,
  processCssValue,
  processSelector,
  processCssProp,
  processRgbaAndHslaValue,
  transpileUrlValue,
  parseObjectToCssVariable,
} = require("./utils.js");

const theme = require("./theme.js");

const plugin = (options = {}) => {
  const baseOptions = {
    darkSelector: ".theme-dark",
    nightSelector: ".theme-night",
    append: true, // 是否注入css变量
    disable: false, // 是否禁用插件
    onlyPicture: false, // 是否只处理图片
    vite: true, // 是否是在vite中
    filter: "**/node_modules/**", // 过滤不处理的目录,支持字符串或者数组
    customColorPanel: {},
  };

  let hasInject = false;

  const _options = Object.assign(baseOptions, options);

  _options.customColorPanel = Object.assign(theme, options.customColorPanel);

  const {
    darkSelector: dark,
    nightSelector: night,
    append,
    disable,
    onlyPicture,
    vite,
    filter,
    customColorPanel,
  } = _options;

  global._customColorPanel = customColorPanel;

  const emptyPlugin = {
    postcssPlugin: "postcss-generate-theme",
  };
  if (disable) {
    return emptyPlugin;
  }

  return {
    ...emptyPlugin,
    Once(root) {
      let cssVariable = parseObjectToCssVariable(customColorPanel, dark, night);
      if (
        (options.customColorPanel &&
          Object.keys(options.customColorPanel).length > 0) ||
        _options.darkSelector !== ".theme-dark" ||
        _options.nightSelector !== ".theme-night"
      ) {
        writeFile(
          path.resolve(__dirname, "css-variable.css"),
          cssVariable,
          (err) => {
            if (err) throw err;
          }
        );
      }

      if (append && !hasInject) {
        root.prepend(cssVariable);
        hasInject = true;
      }
    },
    Root(root, { Rule }) {
      let filePath = root.source.input.file;
      // 过滤目录
      if (multimatch(filePath, filter).length > 0) return;

      root.walk((node) => {
        let last = node;

        let { type, selector, nodes: declNodes } = node;

        let isIncludedThemeSelector = themeSelectorIncluded(
          selector,
          dark,
          night
        );

        if (type === "rule" && !isIncludedThemeSelector && declNodes) {
          let needProcessDecls = declNodes.filter((dcl) =>
            verifyDeclareProp(dcl)
          );

          if (needProcessDecls.length) {
            let darkAppendRules = [];
            let nightAppendRules = [];

            if (vite && onlyPicture) {
              needProcessDecls.forEach((decl) => {
                if (
                  decl.value.includes("url(") &&
                  !decl.value.includes("-gradient(")
                ) {
                  let prop = processCssProp(decl);

                  let prevNode = decl.prev();
                  let commentTxt =
                    prevNode && prevNode.type === "comment" && prevNode.text
                      ? prevNode.text
                      : "";

                  if (
                    commentTxt.includes("no dark") &&
                    !commentTxt.includes("no night")
                  ) {
                    let nightVal = transpileUrlValue(decl, "night");
                    nightAppendRules.push({ prop, value: nightVal });
                  } else if (
                    !commentTxt.includes("no dark") &&
                    commentTxt.includes("no night")
                  ) {
                    let darkVal = transpileUrlValue(decl, "dark");
                    darkAppendRules.push({ prop, value: darkVal });
                  } else if (
                    !commentTxt.includes("no dark") &&
                    !commentTxt.includes("no night")
                  ) {
                    // 处理 默认图片主题色
                    if (
                      commentTxt.includes("default dark") &&
                      !commentTxt.includes("default night")
                    ) {
                      darkAppendRules.push({ prop: "opacity", value: "0.9" });
                    } else if (
                      !commentTxt.includes("default dark") &&
                      commentTxt.includes("default night")
                    ) {
                      nightAppendRules.push({ prop: "opacity", value: "0.5" });
                    } else if (
                      commentTxt.includes("default dark") &&
                      commentTxt.includes("default night")
                    ) {
                      darkAppendRules.push({ prop: "opacity", value: "0.9" });
                      nightAppendRules.push({ prop: "opacity", value: "0.5" });
                    } else {
                      let darkVal = transpileUrlValue(decl, "dark");
                      let nightVal = transpileUrlValue(decl, "night");

                      darkAppendRules.push({ prop, value: darkVal });
                      nightAppendRules.push({ prop, value: nightVal });
                    }
                  }
                }
              });
            } else if (vite && !onlyPicture) {
              needProcessDecls.forEach((decl) => {
                if (
                  decl.value.includes("url(") &&
                  !decl.value.includes("-gradient(")
                ) {
                  // nothing todo
                } else if (
                  decl.value.includes("rgba(") ||
                  decl.value.includes("hsla(")
                ) {
                  let prop = processCssProp(decl);

                  let darkVal = processRgbaAndHslaValue(decl, "dark");
                  let nightVal = processRgbaAndHslaValue(decl, "night");

                  darkAppendRules.push({
                    prop,
                    value: darkVal,
                    important: !!decl.important,
                  });
                  nightAppendRules.push({
                    prop,
                    value: nightVal,
                    important: !!decl.important,
                  });
                } else {
                  decl.value = processCssValue(decl);
                }
              });
            } else {
              needProcessDecls.forEach((decl) => {
                if (
                  decl.value.includes("url(") &&
                  !decl.value.includes("-gradient(")
                ) {
                  let prop = processCssProp(decl);

                  let prevNode = decl.prev();
                  let commentTxt =
                    prevNode && prevNode.type === "comment" && prevNode.text
                      ? prevNode.text
                      : "";

                  if (
                    commentTxt.includes("no dark") &&
                    !commentTxt.includes("no night")
                  ) {
                    let nightVal = transpileUrlValue(decl, "night");
                    nightAppendRules.push({ prop, value: nightVal });
                  } else if (
                    !commentTxt.includes("no dark") &&
                    commentTxt.includes("no night")
                  ) {
                    let darkVal = transpileUrlValue(decl, "dark");
                    darkAppendRules.push({ prop, value: darkVal });
                  } else if (
                    !commentTxt.includes("no dark") &&
                    !commentTxt.includes("no night")
                  ) {
                    // 处理 默认图片主题色
                    if (
                      commentTxt.includes("default dark") &&
                      !commentTxt.includes("default night")
                    ) {
                      darkAppendRules.push({ prop: "opacity", value: "0.9" });
                    } else if (
                      !commentTxt.includes("default dark") &&
                      commentTxt.includes("default night")
                    ) {
                      nightAppendRules.push({ prop: "opacity", value: "0.5" });
                    } else if (
                      commentTxt.includes("default dark") &&
                      commentTxt.includes("default night")
                    ) {
                      darkAppendRules.push({ prop: "opacity", value: "0.9" });
                      nightAppendRules.push({ prop: "opacity", value: "0.5" });
                    } else {
                      let darkVal = transpileUrlValue(decl, "dark");
                      let nightVal = transpileUrlValue(decl, "night");

                      darkAppendRules.push({ prop, value: darkVal });
                      nightAppendRules.push({ prop, value: nightVal });
                    }
                  }
                } else if (
                  decl.value.includes("rgba(") ||
                  decl.value.includes("hsla(")
                ) {
                  let prop = processCssProp(decl);

                  let darkVal = processRgbaAndHslaValue(decl, "dark");
                  let nightVal = processRgbaAndHslaValue(decl, "night");

                  darkAppendRules.push({
                    prop,
                    value: darkVal,
                    important: !!decl.important,
                  });
                  nightAppendRules.push({
                    prop,
                    value: nightVal,
                    important: !!decl.important,
                  });
                } else {
                  decl.value = processCssValue(decl);
                }
              });
            }

            if (darkAppendRules.length && !nightAppendRules.length) {
              let fixDark = new Rule({
                selector: processSelector(selector, dark),
              });
              darkAppendRules.forEach((rule) => {
                fixDark.append(rule);
              });

              last.after(fixDark);
            } else if (!darkAppendRules.length && nightAppendRules.length) {
              let fixNight = new Rule({
                selector: processSelector(selector, night),
              });

              nightAppendRules.forEach((rule) => {
                fixNight.append(rule);
              });

              last.after(fixNight);
            } else if (darkAppendRules.length && nightAppendRules.length) {
              let fixDark = new Rule({
                selector: processSelector(selector, dark),
              });
              let fixNight = new Rule({
                selector: processSelector(selector, night),
              });
              darkAppendRules.forEach((rule) => {
                fixDark.append(rule);
              });

              nightAppendRules.forEach((rule) => {
                fixNight.append(rule);
              });

              last.after(fixDark);
              fixDark.after(fixNight);
            }
          }
        }
      });
    },
  };
};

plugin.postcss = true;
module.exports = plugin;

// readFile("./test/a.css", (err, data) => {
//   if (err) throw err;
//   postcss([
//     plugin({
//       disable: false,
//     }),
//   ])
//     .process(data, { from: "./test/a.css" })
//     .then((res) => {
//       writeFile("./test/a.out.css", res.css, (err) => {
//         if (err) throw err;
//         console.log("The file has been saved!");
//       });
//     });
// });
