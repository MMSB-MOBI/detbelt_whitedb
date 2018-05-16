const folder = '../static/pdb/tmprot'; //
const fs = require('fs');
const EventEmitter = require('events')
var MongoClient = require('mongodb').MongoClient;

var resultData = null
var emitter = new EventEmitter()
/*

NB: The mongodb server must be working 

*/


///////////////////////////////////////////////////////////////
////////////////////   Folder part   //////////////////////////
///////////////////////////////////////////////////////////////


/* 	
	Here we read all files in the corresponding folder,
	we add them to a list so that we can compare it to the
	database.
*/

l_file = [];


fs.readdirSync(folder).forEach(file => {
	let nodotpdb = file.replace(/\.pdb/,"")
	let to_push = nodotpdb.toUpperCase();
  l_file.push(to_push)
})
console.log("number of pdb files : "+l_file.length) //2930 pdbfiles



///////////////////////////////////////////////////////////////
/////////////////////   Mongo part   //////////////////////////
///////////////////////////////////////////////////////////////


let	getpdbCodes = function(){
	var data = []
	var url = "mongodb://localhost:27017/";
	MongoClient.connect(url, function(err, db) {
  		if (err) throw err;
  		var dbo = db.db("whiteDump");
  		var query = {};
  		dbo.collection("groups").find(query).toArray(function(err, result) {
    	if (err) throw err;
    	//console.log(result);

    	db.close();
    	//console.log(result);
    	emitter.emit('getdata',result)
    	//console.log(data.push(result[1]))
  })

})
    	
}


getpdbCodes()

emitter.on('getdata',(result)=>{
	let l_pdbCodes = []
	let no_file = []
	let not_insidedb = []
	let pdbcodes_and_file = []
	let related_entries = []
	let related_entries_pdbFile = []
	let related_entries_NopdbFile = []
	let related_entries_inside_db = []
	let related_entries_inside_db_with_file = []
	let related_entries_inside_db_without_file = []
	for (let i = 0; i<result.length; i++){
		l_pdbCodes.push(result[i].pdbCode)
		//console.log(result[i].relatedPdbEntries)
		if (result[i].relatedPdbEntries !== null){
			related_entries = related_entries.concat(result[i].relatedPdbEntries)
		}
	}
	console.log("number of entries in the db : "+l_pdbCodes.length)
	let uniqueRelatedEntries = Array.from(new Set(related_entries));
	console.log("number of unique related entries : "+uniqueRelatedEntries.length)
	for (let j of l_pdbCodes){
		//console.log(l_file)
		if(!l_file.includes(j)){
			no_file.push(j)
		}
		else{
			pdbcodes_and_file.push(j)
		}
		if(uniqueRelatedEntries.includes(j)){
			related_entries_inside_db.push(j)
		}


	}
	for (let k of l_file){
		if(!l_pdbCodes.includes(k)){
			not_insidedb.push(k)
		}
		if(uniqueRelatedEntries.includes(k)){
			related_entries_pdbFile.push(k)
		}
	}
	for (let m of uniqueRelatedEntries){
		if (!l_file.includes(m)){
			related_entries_NopdbFile.push(m)
		}

	}
	for (let n of related_entries_inside_db){
		if(l_file.includes(n)){
			related_entries_inside_db_with_file.push(n)
		}
		else{
			related_entries_inside_db_without_file.push(n)
		}
	}
	console.log("number of related entries inside db : "+related_entries_inside_db.length)
	console.log("inside db but with no file : "+ no_file.length)
	console.log("inside db and with file : "+pdbcodes_and_file.length)
	console.log("related entries with a pdbfile : "+related_entries_pdbFile.length)
	console.log("related entries with no pdbfile : "+related_entries_NopdbFile.length)
	console.log("related entries inside db with a pdbfile : "+related_entries_inside_db_with_file.length)
	console.log("related entries inside db without a pdbfile : "+related_entries_inside_db_without_file.length)
	fs.writeFileSync('nopdbfiles.txt', no_file)
	fs.writeFileSync('notinsidedb.txt',not_insidedb)
	fs.writeFileSync('insidedbandwithfile.txt',pdbcodes_and_file)


	//console.log(l_file)
})



