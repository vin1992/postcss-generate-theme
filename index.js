/*
 * @Author: xuzhigang01@corp.netease.com
 * @Date: 2021-06-16 22:05:07
 * @LastEditTime: 2021-09-01 23:51:33
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
  transpileUrlValue,
} = require("./utils");

let postcss = require("postcss");
let { readFile, writeFile, readFileSync } = require("fs");

const plugin = (options = {}) => {
  let dark = options.darkSelector || ".theme-dark";
  let night = options.nightSelector || ".theme-night";

  return {
    postcssPlugin: "postcss-generate-theme",
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
              if (decl.value.includes("url(")) {
                let prop = processCssProp(decl);

                let darkVal = transpileUrlValue(decl, "dark");
                let nightVal = transpileUrlValue(decl, "night");

                darkAppendRules.push({ prop, value: darkVal });
                nightAppendRules.push({ prop, value: nightVal });
              } else {
                decl.value = processCssValue(decl);
              }
            });

            if (darkAppendRules.length && nightAppendRules.length) {
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
// module.exports.postcss = true;

readFile("./a.css", (err, data) => {
  if (err) throw err;
  postcss([plugin])
    .process(data, { from: "./a.css" })
    .then((res) => {
      writeFile("a.out.css", res.css, (err) => {
        if (err) throw err;
        console.log("The file has been saved!");
      });
    });
});
