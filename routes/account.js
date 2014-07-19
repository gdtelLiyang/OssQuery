var express = require('express');
var router = express.Router();
var mysqlobj = require('./mysqlobject');
var checksession = require('./checksession');

var md5 = require('./myMD5');

var roleArray = ['admin', 'guest'];
var NumPerPage = 10;

var conn = {
	host : '127.0.0.1',
	port : '3306',
	user : 'root',
	password : ''
};

var mysqlinstance = new mysqlobj(conn);
var database = 'user_db';
var table = 'account'
var querystring = 'USE ' + database;

var handleError = function(err){
	console.log(data);
	return;
};

mysqlinstance.exc(querystring, handleError, function(data) {
	console.log(data);
});

//判断对象是否存在于数组中，返回true表示存在于数组中
var inArray = function(obj, arr){		
	var isArr = typeof arr;
	if(arr instanceof Array){
		for(var i = 0; i < arr.length; i++){
			if(obj == arr[i]){
				return true;
			}
		}
	}
	return false;
}

//返回true表示含敏感字符
var checkParam = function(str){
	var re = /[ \'\"]/g;
	return re.test(str);
}

/* GET home page. */
router.all('/', checksession, function(req, res) {
	var curPage = req.param('page');
	var retrieveUser = req.param('retrieveUser');
	var username = req.session.username;

	if(typeof curPage == "undefined"){
		curPage = "1";
	}

	var re = /[\D]/g;
	if(re.test(curPage)){
		res.render('accountResult', {tips : "错误：分页参数错误！"});
		return;
	}

	curPage = parseInt(curPage);
	var m = NumPerPage * (curPage - 1);
	var querystring = "select username, role from account ";
	if(typeof retrieveUser != "undefined"){
		if(checkParam(retrieveUser)){
			res.render('accountResult', {tips : "错误：查询对象包含非法字符！"});
			return;
		}
		querystring = querystring + "where username like '%" + retrieveUser + "%' ";
	}
	querystring = 	querystring + "limit " + m.toString() + ", " + NumPerPage;

	var handleError = function(err){
			
	};

	mysqlinstance.exc(querystring, handleError, function(data){
		console.log(data);	
		var querystring = "select count(*) as num from account ";
		if(typeof retrieveUser != "undefined"){

			querystring = querystring + "where username like '%" + retrieveUser + "%' ";
		}
		
		mysqlinstance.exc(querystring, handleError, function(result){
			console.log(result);
			var prevPage = curPage - 1;
			var nextPage = curPage + 1;
			var totalNum = result[0].num;
			var totalPage = parseInt(parseInt(totalNum) / NumPerPage);
			if(parseInt(totalNum) % NumPerPage != 0){
				totalPage += 1;
			}
			var Page = {
					curPage : curPage.toString(),
					prevPage : prevPage.toString(),
					nextPage : nextPage.toString(),
					totalPage : totalPage.toString(),
				};

			if(typeof retrieveUser != "undefined"){
				Page['retrieveUser'] = retrieveUser;
			}

			res.render('account', {items : data, Page : Page, username : username});
		});
	});
});

router.post('/add', checksession, function(req, res){
	var addUsername = req.param('addUsername');
	var addPassword = req.param('addPassword');
	var addRole = req.param('addRole');
	var error = false;

	if(typeof addUsername == "undefined" || 
		typeof addPassword == "undefined" ||
		typeof addRole == "undefined" )
	{
		res.render('accountResult', {tips : "错误：缺少输入参数！"});
		return;
	}
	if(checkParam(addUsername) || checkParam(addPassword)){
		res.render('accountResult', {tips : "错误：参数包含敏感字符！"});
		return;
	}

	if(!inArray(addRole, roleArray)){
		error = true;
		res.render('accountResult', {tips : "错误：角色参数输入错误！"});
		return;
	}

	var handleError = function(err){
		error = true;
		res.render('accountResult', {tips : "错误：添加用户错误！"});
		return;
	};

	var querystring = "insert into " + table + " values('" + addUsername + "', '" + md5(addPassword) + "', '" + addRole + "')";
	mysqlinstance.exc(querystring, handleError, function(data){
		if(error == false){
			res.render('accountResult', {tips : "成功：添加用户成功！"});
		}
	});
});

router.post('/modifyRole', checksession, function(req, res){
	var modifyUsername = req.param('modifyUsername');
	var modifyRole = req.param('modifyRole');
	var error = false;

	if(typeof modifyUsername == "undefined" || typeof modifyRole == "undefined" ){
		res.render('accountResult', {tips : "错误：缺少输入参数！"});
		return;
	}
	if(checkParam(modifyUsername)){
		res.render('accountResult', {tips : "错误：参数包含敏感字符！"});
		return;
	}

	if(!inArray(modifyRole, roleArray)){
		error = true;
		res.render('accountResult', {tips : "错误：角色参数输入错误！"});
		return;
	}

	var handleError = function(err){
		error = true;
		res.render('accountResult', {tips : "错误：修改用户角色错误！"});
		return;
	};

	var querystring = "update " + table + " set role='" + modifyRole + "' where username='" + modifyUsername + "'";
	mysqlinstance.exc(querystring, handleError, function(data){
		if(error == false){
			res.render('accountResult', {tips : "成功：修改用户角色成功！"});
		}
	});
});

router.post('/modifyPassword', checksession, function(req, res){
	var modifyUsername = req.param('modifyUsername');
	var modifyPassword = req.param('modifyPassword');
	var error = false;

	if(typeof modifyUsername == "undefined" || typeof modifyPassword == "undefined" )
	{
		res.render('accountResult', {tips : "错误：缺少输入参数！"});
		return;
	}
	if(checkParam(modifyUsername) || checkParam(modifyPassword)){
		res.render('accountResult', {tips : "错误：参数包含敏感字符！"});
		return;
	}

	var handleError = function(err){
		error = true;
		res.render('accountResult', {tips : "错误：修改密码错误"});
		return;
	};

	var querystring = "update " + table + " set password='" + md5(modifyPassword) + "' where username='" + modifyUsername + "'";
	mysqlinstance.exc(querystring, handleError, function(data){
		if(error == false){
			res.render('accountResult', {tips : "成功：修改用户密码成功！"});
		}
	});
});

router.post('/delete', checksession, function(req, res){
	var deleteUsername = req.param('deleteUsername');
	var error = false;

	if(typeof deleteUsername == "undefined")
	{
		res.render('accountResult', {tips : "错误：缺少输入参数！"});
		return;
	}
	if(checkParam(deleteUsername)){
		res.render('accountResult', {tips : "错误：参数包含敏感字符！"});
		return;
	}

	var handleError = function(err){
		error = true;
		res.render('accountResult', {tips : "错误：删除用户错误！"});
		return;
	};

	var querystring = "delete from " + table + " where username='" + deleteUsername + "'";
	console.log(querystring);
	mysqlinstance.exc(querystring, handleError, function(data){
		if(error == false){
			res.render('accountResult', {tips : "成功：删除用户成功！"});
		}
	});
});

router.post('/batchDelete', checksession, function(req, res){
	var events = require('events');
	var deleteUsername = req.param('deleteUsername');
	var isReturn = false;

	if(typeof deleteUsername == "undefined")
	{
		res.render('accountResult', {tips : "错误：缺少输入参数！"});
		return;
	}
	var userArray = deleteUsername.split(',');

	for(var i=0; i < userArray.length; i++){
		if(checkParam(userArray[i])){
			res.render("accountResult", {tips : "错误：参数包含敏感字符！"});
			return;
		}
	}

	var emitter = new events.EventEmitter();
	var deleteCount = 0;
	var errorCount = 0;

	var handleError = function(err){
		errorCount++;
		if(deleteCount + errorCount == userArray.length){
			if(isReturn == false){
				isReturn = true;
				res.render('accountResult', {tips : "成功删除" + deleteCount + "个用户，失败" + errorCount + "个"});
				return;
			}
		}
	};

	emitter.on('deleteDone', function(arg){
		deleteCount++;
		if(deleteCount + errorCount == userArray.length){
			if(isReturn == false){
				isReturn = true;
				res.render('accountResult', {tips : "成功删除" + deleteCount + "个用户，失败" + errorCount + "个"});
				return;
			}
		}
	});
	
	for(var i = 0; i < userArray.length; i++){
		var querystring = "delete from " + table + " where username='" + userArray[i] + "'";
		mysqlinstance.exc(querystring, handleError, function(data){
			emitter.emit('deleteDone');
		});
	}
});


module.exports = router;
