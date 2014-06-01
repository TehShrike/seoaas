var Ractive = require('ractive')
var fs = require('fs')
var getPostHtml = require('noddity-renderer').makeHtmlFromPost

var template = Ractive.parse(fs.readFileSync('post.html', { encoding: 'utf8' }))

module.exports = function getStaticHtml(context, cb) {
	if (typeof context.parameters.post === 'undefined') {
		cb(new Error("You must provide the 'post' parameter"))
	} else {
		var butler = context.butler
		var linkify = context.linkify
		var dumbResolve = context.resolvePost
		var postFileName = context.parameters.post || 'index.md'

		butler.getPosts(function(err, posts) {
			if (err) {
				cb(err)
			} else {
				butler.getPost(postFileName, function(err, post) {
					getPostHtml(butler.getPost, linkify, post, {
						pathPrefix: context.parameters.postUrlRoot,
						title: post.metadata.title
					}, function (err, postHtml) {
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
