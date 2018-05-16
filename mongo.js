var MongoClient = require('mongodb').MongoClient;
var cp = require('child_process');
const fs = require('fs');
const url = 'mongodb://localhost:27017';
//const folder = '../static/pdb/tmprot'; 	// Where the pdb files are stored

var deleteDB = function(db){
	return new Promise((resolve,reject)=>{
      MongoClient.connect(url).then(function(client) {
			client.db("whiteDump").collection('groups').drop(function(err,result){ //deletion of the database
				if(err){
	    			reject({"status":'Error', "data":'Error in the deletion of the database'});
				}
				else{
					let msg = 'The database has been deleted';
					resolve({"msg":msg, "result":result});
				}
			});	
        })
	})
}

var initDB = function(db,path){
	
	// We read the data we will import
	to_import = [];
	let file = fs.readFileSync(path);
	let infos = JSON.parse(file);
	let pdbFiles = knowAvailableFiles('./data/pdb/tmprot');
	// We verify if the pdbCode is available inside the files that we have
	MongoClient.connect(url).then(function(client) {
		console.log("connected to "+url)
		for(let i of infos){
			if(pdbFiles.includes(i.pdbCode)){
				client.db("whiteDump").collection('groups').insert(i)
			}
		}
	})

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

var findAllProt =  function() { 
	return MongoClient.connect(url).then(function(client) { //connexion to the database
		//console.dir(client.db)
  		let collection = client.db('whiteDump').collection('groups');
  		//console.log(collection)
		return collection.find().toArray();
	}).then(function(items) {
 		return items; //items : the database 
	});		
}

var searchOnDB = function(db,word){

	return MongoClient.connect(url).then(function(client) { //connexion to the database
		//console.dir(client.db)
  		let collection = client.db('whiteDump').collection('groups');
		return collection.find({ $or:[{name: {'$regex':word}},{pdbCode : {'$regex':word}},{resolution : {'$regex':word}},{species : {'$regex':word}},{description: {'$regex':word}},{group : {'$regex':word}},{subgroup : {'$regex':word}},{relatedPdbEntries:{'$elemMatch':{'$regex':word}}}]}).toArray();
	}).then(function(items) {
 		return items; //items : the database 
	});
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

			/*if( value.includes(word)){
				console.log(i[j])
			}
			*/
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