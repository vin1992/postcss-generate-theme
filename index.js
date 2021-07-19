/*
 * @Author: xuzhigang01@corp.netease.com
 * @Date: 2021-06-16 22:05:07
 * @LastEditTime: 2021-07-19 22:54:46
 * @LastEditors: Please set LastEditors
 * @Description: 主题色样式生成
 * @FilePath: /gen-theme/index.js
 */

let postcss = require("postcss");
let { readFile, writeFile, readFileSync } = require("fs");

let {
  themeSelectorIncluded,
  verifyDeclareProp,
  processSelector,
  processCssProp,
  processCssValue,
} = require("./utils");

const warnFaultColors = (result) => {
  let data = readFileSync("./faultColor.log");

  let faultColors = data.toString().split(",");

  if (faultColors.length) {
    let msg = [...new Set(faultColors)] + "";
    result.warn(`${msg} 色值不在色板中，请确认色值是否正确`);
  }
};

const plugin = (options = {}) => {
  let dark = options.darkSelector || ".theme-dark";
  let night = options.nightSelector || ".theme-night";

  return {
    postcssPlugin: "postcss-generate-theme",
    prepare(result) {
      warnFaultColors(result);
    },
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
            let fixDark = new Rule({
              selector: processSelector(selector, dark),
            });
            let fixNight = new Rule({
              selector: processSelector(selector, night),
            });

            needProcessDecls.forEach((decl) => {
              let prop = processCssProp(decl);

              let darkValue = processCssValue(decl, "dark");
              let nightVal = processCssValue(decl, "night");

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
