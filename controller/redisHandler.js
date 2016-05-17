function redisCli( redis){
	this.set = function (name, value){
		redis.set(name,JSON.stringify(value),function(err,doc){
			console.log('err:'+err+'\n set:'+doc);
		});
	}
	this.get = function (name, callback){
		redis.get(name,function (err,data){
			if(err || data == null){
				console.log('err or no record found :: '+err);
			}
			callback(JSON.parse(data));
		})
	}
	this.delete = function (name){
		redis.del(name,function (err,doc){
			console.log('err:'+err+'\n delete:'+doc);
		});
	}
}
module.exports.redisCli = redisCli;