
function readPlace(data,callback){
	var origin = data.origin;
	var destination = data.destination;
	
	if (callback)
		callback({ origin: { stateCode: 'NY' }, destination: { stateCode: 'NY', CountryName: 'India' } });
}


module.exports = { readPlace }