var url = require('url')
var qs = require('querystring')
var StringMap = require('stringmap')
var Butler = require('noddity-butler')
var level = require('level')
var sanitize = require("sanitize-filename")
var safeConverter = require('pagedown').getSanitizingConverter()
var markdownToHtml = safeConverter.makeHtml.bind(safeConverter)
var joinPath = require('path').join
var Linkifier = require('noddity-linkifier')
var Ractive = require('ractive')

function dumbResolve(firstThingy, secondThingy) {
	var separator = '/'
	if (firstThingy[firstThingy.length - 1] === '/') {
		separator = ''
	}
	return firstThingy + separator + secondThingy
}

var template = Ractive.parse('<!DOCTYPE html><html><head><title>{{title}}</title></head>'
	+ '<body><h1>{{title}}</h1><article>{{{postHtml}}}</article>'
	+ '<ol>{{#posts}}'
	+ '<li><a href="{{url}}">{{metadata.title}}</a></li>'
	+ '{{/posts}}</ol>'
	+ '</body></html>')

function getStaticHtml(butler, postUrlRoot, postFileName, cb) {
	butler.getPost(postFileName, function(err, post) {
		if (err) {
			cb(err)
		} else {
			butler.getPosts(function(err, posts) {
				if (err) {
					cb(err)
				} else {
					var linkify = new Linkifier(postUrlRoot)
					posts.forEach(function(post) {
						post.url = dumbResolve(postUrlRoot, post.filename)
					})
					var html = new Ractive({
						el: '',
						template: template,
						data: {
							postHtml: linkify(markdownToHtml(post.content)),
							posts: posts,
							title: post.metadata.title
						}
					}).toHTML()
					cb(null, html)
				}
			})
		}
	})
}

function allNecessaryParametersExist(parameters) {
	return typeof parameters.noddityRoot !== 'undefined'
		&& typeof parameters.postUrlRoot !== 'undefined'
		&& typeof parameters.post !== 'undefined'
}

module.exports = function Seoaas() {
	var butlers = new StringMap()

	function getAppropriateButler(rootUrl) {
		if (!butlers.has(rootUrl)) {
			var db = level(joinPath('/tmp', 'seoaas' + sanitize(rootUrl)))
			var butler = new Butler(rootUrl, db)
			butlers.set(rootUrl, butler)
		}

		return butlers.get(rootUrl)
	}

	var server = require('http').createServer(function(req, res) {
		var parameters = qs.parse(url.parse(req.url).query)
		if (allNecessaryParametersExist(parameters)) {
			var butler = getAppropriateButler(parameters.noddityRoot)

			var postFileName = parameters.post === '' ? 'index.md' : parameters.post

			getStaticHtml(butler,
				parameters.postUrlRoot,
				parameters.post,
				function (err, html) {
					if (err) {
						res.statusCode = 500
						res.end(err.message)
					} else {
						res.end(html)
					}
				})
		} else {
			res.end("Need to supply noddityRoot, postUrlRoot, and post")
		}
	})

	var closeServer = server.close.bind(server)

	server.close = function closeServer() {
		Object.keys(butlers.obj).forEach(function(key) {
			var butler = butlers.get(key)
			butler.stop()
		})
		closeServer()
	}

	return server
}
