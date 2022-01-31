var EventEmitter = require('events');
const fs = require('fs');
const cst = require('./constants')


var deleteDB = function(db){
	return new Promise((resolve,reject)=>{
	
		db.collection(cst.DB_JSON_NAME).drop(function(err,result){ //deletion of the database
			let msg = 'The database has been deleted;'
			if (err) reject({"error" : err})
			resolve({"msg":msg, "result":result});
			
		})
	})
}



const initDB = function(db, path){
	return new Promise((resolve, reject) => {
		const file = fs.readFileSync(path);
		const infos = JSON.parse(file);
		db.collection(cst.DB_JSON_NAME).insert(infos, (err, res) => {
			if (err) reject({"error" : err})
			resolve({"ok" : "database initialized"})
		})
	})
}

var findAllProt =  function(db) {
	return new Promise((resolve,reject)=>{
  		let collection = db.collection(cst.DB_JSON_NAME);
  		//let res;
		collection.find({}).toArray(function(error,content){
			//res = content;
			resolve(content)
		});
	})
}

var searchOnDB = function(db, word){
	return new Promise((resolve,reject)=>{
		let collection = db.collection(cst.DB_JSON_NAME);
		collection.find({ $or:[{name: {'$regex':word}},{pdbCode : {'$regex':word}},{resolution : {'$regex':word}},{species : {'$regex':word}},{description: {'$regex':word}},{group : {'$regex':word}},{subgroup : {'$regex':word}},{relatedPdbEntries:{'$elemMatch':{'$regex':word}}}]}).toArray(function(error,content){
			if(error) reject(error); 
			resolve(content)
		})
	})
}

var FindMatchFields = function(result,word){
	l_keys = ["name","pdbCode","resolution","species","description","group","subgroup","representativeOf"]		// the fields we made the research on
	for(let i of result){
		i["matchFields"]=[]
		for (let j of l_keys){
			let value = i[j]
			console.log(value)
			if (value !== null){															// null values are ignored
				if(value.includes(word)){
					i["matchFields"].push(j)
				}
			}
		}
	}
}



module.exports = {
	initDB : initDB,
	deleteDB : deleteDB,
	findAllProt : findAllProt,
	searchOnDB : searchOnDB,
	FindMatchFields : FindMatchFields
}