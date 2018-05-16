var MongoClient = require('mongodb').MongoClient;
var cp = require('child_process');
const fs = require('fs');
//const folder = '../static/pdb/tmprot'; 	// Where the pdb files are stored

var deleteDB = function(path,db){
	MongoClient.connect(path).then(function(client) {
		//console.log(db)
		client.db(db).collection('groups').drop()
		//db.close()
	})
}

var initDB = function(path,db){
	
	// We read the data we will import
	to_import = []
	let file = fs.readFileSync('./WhiteDB/data/res.json')
	let infos = JSON.parse(file)
	let pdbFiles = knowAvailableFiles('./static/pdb/tmprot')
	// We verify if the pdbCode is available inside the files that we have
	MongoClient.connect(path).then(function(client) {
		console.log("connected to"+path)
		for(let i of infos){
			if(pdbFiles.includes(i.pdbCode)){
				client.db(db).collection('groups').insert(i)
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

module.exports = {
	initDB : initDB,
	deleteDB : deleteDB
}