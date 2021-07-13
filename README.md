# Postcss Generate Theme

<img align="right" width="135" height="95"
     title="Philosopher’s stone, logo of PostCSS"
     src="https://postcss.org/logo-leftp.svg">

[postcss-generate-theme] 是一个 postcss 插件，主要实现 根据 内置应用色板 生成 对应主题色的功能，从此告别手写主题色的烦恼

[postcss-generate-theme]: https://github.com/postcss/postcss

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
	background: linear-gradient(180deg, #333 25%, white 75%, rgb(255, 255, 255) 100%);
	color: #fff;
	box-shadow: 2px 2px 2px 2px #ddd;
}
```

经过插件处理后，变成

```css
.container {
	border: 1px solid var(--black33);
	background: linear-gradient(180deg, var(--black33) 25%, var(--bg) 75%, var(--bg) 100%);
	color: var(--whiteFF);
	box-shadow: 2px 2px 2px 2px var(--blackDD);
}
```

## 使用

**第一步:** 安装插件:

```sh
npm install --save-dev postcss postcss-generate-theme
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
		require('postcss-generate-theme')({
			darkSelector: '.theme-dark',
			nightSelector: '.theme-night',
		}),
	],
};
```

### `darkSelector`

类型: `string`. 默认值: `.theme-dark`.

### `nightSelector`

类型: `string`. 默认值: `.theme-night`.
