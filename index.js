var fs = require('fs')
var render = require('noddity-render-static')

var templatePost = {
	name: 'template',
	metadata: {
		title: 'RSS Template',
		markdown: false
	},
	content: fs.readFileSync('post.html', { encoding: 'utf8' })
}

module.exports = function getStaticHtml(context, cb) {
	if (typeof context.parameters.post === 'undefined') {
		cb(new Error("You must provide the 'post' parameter"))
	} else {
		var postFileName = context.parameters.post || 'index.md'

		var options = {
			butler: context.butler,
			linkifier: context.linkify,
			data: {}
		}

		render(templatePost, postFileName, options, function(err, postHtml) {
			if (err) {
				cb(err)
			} else {
				cb(null, postHtml)
			}
		})

	}
}
