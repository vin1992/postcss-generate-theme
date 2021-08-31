/*
 * @Author: your name
 * @Date: 2021-08-31 21:39:35
 * @LastEditTime: 2021-08-31 22:03:09
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /postcss-generate-theme/test.js
 */

const rgba = require('rgba-convert')

let color = require('color')

let res = rgba.hex('rgba(0, 0, 0, .5)')
console.log(res)

console.log(color(res).hex())