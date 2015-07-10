var Ractive = require('ractive')
var fs = require('fs')
var Renderer = require('noddity-renderer')

Ractive.DEBUG = false
var template = Ractive.parse(fs.readFileSync('post.html', { encoding: 'utf8' }))

module.exports = function getStaticHtml(context, cb) {
	if (typeof context.parameters.post === 'undefined') {
		cb(new Error("You must provide the 'post' parameter"))
	} else {
		var butler = context.butler
		var linkify = context.linkify
		var renderer = new Renderer(butler, linkify)
		var dumbResolve = context.resolvePost
		var postFileName = context.parameters.post || 'index.md'

		butler.getPosts(function(err, posts) {
			if (err) {
				cb(err)
			} else {
				butler.getPost(postFileName, function(err, post) {
					renderer.renderPost(post, function (err, postHtml) {
						if (err) {
							cb(err)
						} else {
							posts.reverse()
							posts.forEach(function(post) {
								post.url = dumbResolve(post.filename)
							})
							var wholePageHtml = new Ractive({
								el: '',
								template: template,
								data: {
									postHtml: postHtml,
									posts: posts,
									title: post.metadata.title
								}
							}).toHTML()
							cb(null, wholePageHtml)
						}
					})
				})
			}
		})
	}
}
