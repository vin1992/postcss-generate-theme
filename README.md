# Postcss Generate Theme

<img align="right" width="135" height="95"
     title="Philosopher’s stone, logo of PostCSS"
     src="https://postcss.org/logo-leftp.svg">

[postcss-generate-theme] 是一个 postcss 插件，主要实现 根据 内置应用色板 生成 对应主题色的功能，从此告别手写主题色的烦恼

[postcss-generate-theme]: https://github.com/vin1992/postcss-generate-theme

比如 项目中的 css 变量 集合 是这样的

```css
//日间
:root {
  --black33: #333;
  --bg: #fff;
  --whiteFF: #fff;
  --blackDD: #ddd;
}
// 深色
.theme-dark {
  --black: #ddd;
  --bg: #1d1d1e;
  --whiteFF: #ddd;
  --blackDD: #333;
}
// 夜间
.theme-dark {
  --black: #777;
  --bg: #1d1d1e;
  --whiteFF: #888;
  --blackDD: #303030;
}
```

你自己写的 css 样式 如下：

```css
.container {
  border: 1px solid #333;
  background: linear-gradient(
    180deg,
    #333 25%,
    white 75%,
    rgb(255, 255, 255) 100%
  );
  color: #fff;
  box-shadow: 2px 2px 2px 2px #ddd;
}
```

经过插件处理后，变成

```css
.container {
  border: 1px solid var(--black33);
  background: linear-gradient(
    180deg,
    var(--black33) 25%,
    var(--bg) 75%,
    var(--bg) 100%
  );
  color: var(--whiteFF);
  box-shadow: 2px 2px 2px 2px var(--blackDD);
}
```

## 使用

**第一步:** 安装插件:

```sh
npm install --save-dev postcss @mf2e/postcss-generate-theme
```

**第二步:** 检查你的项目根目录是否有配置文件 `postcss.config.js`
, 或者 在 `package.json` 里是否配置 `"postcss"` 选项，
或者 在 webpack 之类的打包配置里 有没有配置 `"postcss"` 选项

**第三步:** 在配置文件插件列表里加入插件:

```diff
module.exports = {
  plugins: [
+   require('postcss-generate-theme'),
    require('autoprefixer')
  ]
}
```

**第四步:** 根据客户端的日夜间模式 ，为 `<html>` 元素 添加 `theme-dark` 和 `theme-light` class 名

[official docs]: https://github.com/postcss/postcss#usage

## 配置项

```js
module.exports = {
  plugins: [
    require("postcss-generate-theme")({
      darkSelector: ".theme-dark",
      nightSelector: ".theme-night",
    }),
  ],
};
```

### `darkSelector`

类型: `string`. 默认值: `.theme-dark`.

### `nightSelector`

类型: `string`. 默认值: `.theme-night`.

## 答疑

### 目前都支持处理哪些颜色相关的 css 属性呢？

目前支持以下 css 属性

| 单一属性         | 复合属性                         |
| :--------------- | :------------------------------- |
| color            | border/-top/-left/-right/-bottom |
| \*-color         | background                       |
| background-image | box-shadow                       |
|                  | text-shadow                      |
|                  | outline                          |

### 插件会处理哪些色值，哪些色值又不做处理呢？

会处理哪些值？

会处理色板上定义的色值，将其转换为 css 变量名，对应项目中声明的 css 变量。

哪些值不处理？

如果色值为`none`、`transparent` 或者 `currentColor` , 或者 css 复合值中包含 以上这些值 ，插件不会替换掉这个值，而是原样返回，但其他需要被处理的色值还会被替换，不受影响。比如：

```css
.container {
  background: linear-gradient(
    180deg,
    #333 25%,
    transparent 75%,
    rgb(255, 255, 255) 100%
  );
}
```

会被替换为

```css
.container {
  background: linear-gradient(
    180deg,
    var(--black33) 25%,
    transparent 75%,
    var(--bg) 100%
  );
}
```

另外，如果不在色板上的值或者无法被插件处理的特殊色值也会原样返回。

### 哪些特殊值插件无法处理呢？

比如 `linear-gradient ` 方法里的定义渐变方向的参数，如果是 0.25turn 这种的目前插件依赖的`gradient-parser`还无法被识别，插件还是会原样返回

再比如 `background-image:url(...)` 这类的值为`url()`方法的 目前不会处理，不过插件也支持我们可以自己写需要的夜间样式。

### 色值都支持哪些类型呢？比如我写了#xxxxxx 6 位的会被处理吗？

会的。 目前插件支持 hex、rgb、hls 和 color 关键字 ，其中 6 位的 hex 色值 如果可以缩写会处理为 3 位的，比如 `#ffffff` 会 被识别为 `#fff`
