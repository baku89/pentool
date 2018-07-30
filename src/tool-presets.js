import uid from 'uid'
import fs from 'fs'
import Tool from './tool'

const presets = [
	fs.readFileSync(__dirname + '/tools-default/pencil.js', 'utf-8'),
	fs.readFileSync(__dirname + '/tools-default/rectangle.js', 'utf-8'),
	fs.readFileSync(__dirname + '/tools-default/centered-circle.js', 'utf-8'),
	fs.readFileSync(__dirname + '/tools-default/bezier.js', 'utf-8'),
	fs.readFileSync(__dirname + '/tools-default/spray.js', 'utf-8'),
	fs.readFileSync(__dirname + '/tools-default/graph.js', 'utf-8'),
	fs.readFileSync(__dirname + '/tools-default/triangle-strip.js', 'utf-8'),
	fs.readFileSync(__dirname + '/tools-default/arc-strip.js', 'utf-8'),
	fs.readFileSync(__dirname + '/tools-default/radial-line.js', 'utf-8'),
	fs.readFileSync(__dirname + '/tools-default/dubins-path.js', 'utf-8'),
	fs.readFileSync(__dirname + '/tools-default/concentric-circles.js', 'utf-8')
].map(Tool.parseToolText)

const template = Tool.parseToolText(fs.readFileSync(__dirname + '/tools-default/template.js', 'utf-8'))

console.log(presets)

function createNew () {
	return {...template, id: uid(10)}
}

export default {presets, createNew}