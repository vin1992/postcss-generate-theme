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

另外，插件从 1.0.4 版本开始支持图片主题色的功能。提供一张日间使用的图片的同时，再提供相应的夜间和深色的图片，就可以自动生成对应的主题色样式代码。比如：

```css
.container {
  background: url("./img/bg.png") no-repeat center scroll;
  background-size: contain;
}
```

插件处理过后，会变成

```css
.container {
  background: url("./img/bg.png") no-repeat center scroll;
  background-size: contain;
  list-style: square url("./img/dot-ico.png");
}

.theme-dark .container {
  background-image: url("./img/bg.dark.png");
  list-style-image: url("./img/dot-ico.dark.png");
}

.theme-night .container {
  background-image: url("./img/bg.night.png");
  list-style-image: url("./img/dot-ico.night.png");
}
```

也许你已经注意到了生成前后代码的区别，是的。在开发过程中需要有两点注意：

1. 需要将日夜间（还有深色模式）对应的三种图片确保放在了同一个文件夹下

2. 插件会在深色和夜间模式下，会在日间图片扩展名 (比如`.png`) 前追加`.dark` 和 `.night` ，所以命名图片的时候需要遵循上面的的规则，确保生成后的图片路径是真实存在的。
3. 如果遇到设计中可能没有深色或夜间对应的图片的场景，目前也可以通过注释的方式告诉插件不需要生成多余的图片路径。
4. 怎么注释：注释需要写在目标属性的上方， 不需要深色 就注释`/* no dark */`，不需要夜间 就注释 `/* no night */`，都不需要 就注释 `/* no dark no night */`。 单词之间需要保留空格

```css
/* 处理前 */
.container {
  /* no dark  */
  background: url("./img/bg.png");
  border-image: url("./img/border.png");
}
/* 处理后 */
.container {
  /* no dark  */
  background: url("./img/bg.png");
  border-image: url("./img/border.png");
}

.theme-dark .container {
  border-image: url("./img/border.dark.png");
}

.theme-night .container {
  background: url("./img/bg.night.png");
  border-image: url("./img/border.night.png");
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

### `disable`

类型: `boolean`. 默认值: `false`. 表示是否禁用插件，默认不禁用.

### `vite`

类型: `boolean`. 默认值: `true`. 表示是否在 vite 工具内使用，默认是. 如果设置为 false，就会处理全部的主题相关的样式的适配，包括为图片生成主题路径.

### `onlyPicture` （只在 vite 配置项为 true 时才会生效）

类型: `boolean`. 默认值: `false`. 表示是否只处理图片相关主题适配，默认不是，代表除了图片之外，其他 css 样式的主题适配会默认优先处理.

## 答疑

### 目前都支持处理哪些颜色相关的 css 属性呢？

目前支持以下 css 属性

| 单一属性                    | 复合属性                         |
| :-------------------------- | :------------------------------- |
| color                       | border/-top/-left/-right/-bottom |
| \*-color                    | background                       |
| background-image            | box-shadow                       |
| border-image                | text-shadow                      |
| content（value 包含 url()） | outline                          |
|                             | list-style（value 包含 url()）   |
|                             |

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

### 色值都支持哪些类型呢？比如我写了#xxxxxx 6 位的会被处理吗？

会的。 目前插件支持 `hex`、`rgb(a)`、`hls` 和 color 关键字 ，其中 6 位的 `hex` 色值 如果可以缩写会处理为 3 位的，比如 `#ffffff` 会 被识别为 `#fff`
