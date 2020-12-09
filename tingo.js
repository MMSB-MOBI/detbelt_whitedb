var EventEmitter = require('events');
const fs = require('fs');
const cst = require('./constants')


var deleteDB = function(db){
	return new Promise((resolve,reject)=>{
	
		db.collection(cst.DB_JSON_NAME).drop(function(err,result){ //deletion of the database
		
			let msg = 'The database has been deleted;'
		//console.log('The database has been deleted');
			resolve({"msg":msg, "result":result});
		})
	})
}




// path file must be a list of JSON 
var initDB = function(db,path){
	// We read the data we will import
	to_import = [];
	let file = fs.readFileSync(path);
	let infos = JSON.parse(file);
	let pdbFiles = knowAvailableFiles(cst.PDB_DIR);
	// We verify if the pdbCode is available inside the files that we have
	for(let i of infos){
		if(pdbFiles.includes(i.pdbCode)){
			db.collection(cst.DB_JSON_NAME).insert(i, function(err,result){
				if(err){
					if (err.code === 11000) { //if _id is not unique
						let nameDet = err.errmsg.split('"')[1]; //id of the detergent error
						console.log(nameDet, ': The detergent name must be unique');
					}
					else{
						throw err;
					}
				}
			});	
		}
	}

	//let command = 'mongoimport --db whiteDump --collection groups --drop --file ./WhiteDB/data/res.json --jsonArray'
	//cp.exec(command);
	//console.log("database dropped and created")
}

var knowAvailableFiles = function(folder){
	l_file = []
	fs.readdirSync(folder).forEach(file => {
		let nodotpdb = file.replace(/\.pdb/,"")
		let to_push = nodotpdb.toUpperCase();
  		l_file.push(to_push)
	})
	return(l_file)
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

	
	//console.log(res)
}

var searchOnDB = function(db, word){
	return new Promise((resolve,reject)=>{
		let collection = db.collection(cst.DB_JSON_NAME);
		collection.find({ $or:[{name: {'$regex':word}},{pdbCode : {'$regex':word}},{resolution : {'$regex':word}},{species : {'$regex':word}},{description: {'$regex':word}},{group : {'$regex':word}},{subgroup : {'$regex':word}},{relatedPdbEntries:{'$elemMatch':{'$regex':word}}}]}).toArray(function(error,content){
			resolve(content)
		})
	})
}

var FindMatchFields = function(result,word){
	l_keys = ["name","pdbCode","resolution","species","description","group","subgroup","relatedPdbEntries"]		// the fields we made the research on
	for(let i of result){
		i["matchFields"]=[]
		for (let j of l_keys){
			let value = i[j]
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