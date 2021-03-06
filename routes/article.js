var express = require('express');
var router = express.Router();
var async = require('async');
var fs = require('fs'), path = require('path'), util = require('../util'), md = require('markdown').markdown;

router.get('/:id', function(req, res) {
	util.loadIndex().then(function(index) {
		var meta = index[req.params.id];
		var name = path.join(util.articlePath, meta.file);
		fs.readFile(name, {
			encoding : 'utf8'
		}, function(err, data) {
			if (err) {
				res.render('error', {
					message : err
				});
			}
			var html = meta.markdown ? md.toHTML(data) : data;
			res.render('article', {
				article : {
					title : meta.title,
					content : html
				}
			});
		});
	});
});

router.get('/', function(req, res) {
	util.load().then(function(articles) {
		async.each(articles, function(article, callback) {
			article.url = util.articleUrl + "/" + article.id;
			callback();
		}, function(err) {
			if (!err) {
				res.json(articles);
			}
		});
	}, function(err) {
		console.log(err);
	});

});

router.post('/', function(req, res) {
	var data = req.body;
	var upload = req.files.file ? true : false;
	if (upload) {
		data.file = req.files.file.name;
		data.id = data.file.split('.')[0];
		data.markdown = true;
	} else {
		data.id = data.file = util.generateId();
		data.abstract = util.getAbstract(data.content);
	}
	if (data.tag) {
		data.tag = data.tag.split(',');
	}
	data.createdOn = new Date().getTime();
	util.save(data, upload).then(function(ret) {
		ret.url = util.articleUrl + "/" + ret.id;
		res.json(ret);
	});
});

router.delete('/:id', function(req, res) {
	util.deleteArticle(req.params.id).then(function(ret) {
		res.json({
			"id" : ret
		});
	}, function(err) {
		res.status(500).json({
			message : err
		});
	});
});

module.exports = router;
