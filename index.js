/*
 * @Author: xuzhigang01@corp.netease.com
 * @Date: 2021-06-16 22:05:07
 * @LastEditTime: 2022-03-12 20:03:48
 * @LastEditors: Please set LastEditors
 * @Description: 主题色样式生成
 * @FilePath: /gen-theme/index.js
 */

const {
  themeSelectorIncluded,
  verifyDeclareProp,
  processCssValue,
  processSelector,
  processCssProp,
  processRgbaAndHslaValue,
  transpileUrlValue,
} = require("./utils");

const getModeCssVariableStr = require("./css-variable");

// let postcss = require("postcss");
// let { readFile, writeFile, readFileSync } = require("fs");

const plugin = (options = {}) => {
  const baseOptions = {
    darkSelector: ".theme-dark",
    nightSelector: ".theme-night",
    append: true,
    disable: false,
    onlyPicture: false,
    vite: true,
  };

  let hasInject = false;
  // console.log("执行postcss");

  const _options = Object.assign(baseOptions, options);

  const {
    darkSelector: dark,
    nightSelector: night,
    append,
    disable,
    onlyPicture,
    vite,
  } = _options;

  const emptyPlugin = {
    postcssPlugin: "postcss-generate-theme",
  };

  if (disable) {
    return emptyPlugin;
  }

  return {
    ...emptyPlugin,
    Root(root, { Rule }) {
      if (append && !hasInject) {
        root.prepend(getModeCssVariableStr(dark, night));
        hasInject = true;
      }
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
              console.log("*********** onlyPicture **************");
              needProcessDecls.forEach((decl) => {
                if (
                  decl.value.includes("url(") &&
                  !decl.value.includes("-gradient(")
                ) {
                  let prop = processCssProp(decl);

                  let prevNode = decl.prev();
                  console.log("===== enter  ======");
                  if (
                    prevNode &&
                    prevNode.type === "comment" &&
                    prevNode.text
                  ) {
                    let commentTxt = prevNode.text;

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
                      let darkVal = transpileUrlValue(decl, "dark");
                      let nightVal = transpileUrlValue(decl, "night");

                      darkAppendRules.push({ prop, value: darkVal });
                      nightAppendRules.push({ prop, value: nightVal });
                    }
                  } else {
                    let darkVal = transpileUrlValue(decl, "dark");
                    let nightVal = transpileUrlValue(decl, "night");

                    console.log("val", darkVal, nightVal);

                    darkAppendRules.push({ prop, value: darkVal });
                    nightAppendRules.push({ prop, value: nightVal });
                  }
                }
              });
            } else if (vite && !onlyPicture) {
              console.log("*********** !onlyPicture **************");

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
              console.log("*********** Null **************");

              needProcessDecls.forEach((decl) => {
                if (
                  decl.value.includes("url(") &&
                  !decl.value.includes("-gradient(")
                ) {
                  let prop = processCssProp(decl);

                  let prevNode = decl.prev();
                  console.log("===== enter  ======");
                  if (
                    prevNode &&
                    prevNode.type === "comment" &&
                    prevNode.text
                  ) {
                    let commentTxt = prevNode.text;

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
                      let darkVal = transpileUrlValue(decl, "dark");
                      let nightVal = transpileUrlValue(decl, "night");

                      darkAppendRules.push({ prop, value: darkVal });
                      nightAppendRules.push({ prop, value: nightVal });
                    }
                  } else {
                    let darkVal = transpileUrlValue(decl, "dark");
                    let nightVal = transpileUrlValue(decl, "night");

                    console.log("val", darkVal, nightVal);

                    darkAppendRules.push({ prop, value: darkVal });
                    nightAppendRules.push({ prop, value: nightVal });
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
//       nightSelector: ".is-night",
//       darkSelector: ".is-dark",
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
