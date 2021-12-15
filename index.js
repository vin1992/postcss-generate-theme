/*
 * @Author: xuzhigang01@corp.netease.com
 * @Date: 2021-06-16 22:05:07
 * @LastEditTime: 2021-10-27 22:55:44
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

// let postcss = require("postcss");
// let { readFile, writeFile, readFileSync } = require("fs");
// const path = require("path");

// let filePath = path.resolve(__dirname, "theme.css");
// const themeCssVariable = readFileSync(filePath, "utf8");

module.exports = (options = {}) => {
  const baseOptions = {
    darkSelector: ".theme-dark",
    nightSelector: ".theme-night",
    inject: true,
    disable: false,
  };

  const _options = Object.assign(baseOptions, options);

  const { darkSelector: dark, nightSelector: night, disable } = _options;

  const emptyPlugin = {
    postcssPlugin: "postcss-generate-theme",
  };

  if (disable) {
    return emptyPlugin;
  }

  return {
    ...emptyPlugin,
    Root(root, { Rule }) {
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

            needProcessDecls.forEach((decl) => {
              if (
                decl.value.includes("url(") &&
                !decl.value.includes("-gradient(")
              ) {
                let prop = processCssProp(decl);

                let prevNode = decl.prev();

                if (prevNode && prevNode.type === "comment" && prevNode.text) {
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

module.exports.postcss = true;
// plugin.postcss = true;

// readFile("./test/a.css", (err, data) => {
//   if (err) throw err;
//   postcss([
//     plugin({
//       disable: true,
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
