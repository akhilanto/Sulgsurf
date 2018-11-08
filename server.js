const express = require('express')
const bodyParser = require('body-parser')
const soap = require('soap')
const axios = require('axios')
var parseString = require('xml2js').parseString;
const app= express()
const port = process.env.PORT || 3000

var Sort = require('./includes/Sort')
var ups = require('./includes/UPS')
var usps = require('./includes/USPS')
var fedex = require('./includes/FedEx')
var aramex = require('./includes/Aramex')
var db = require('./includes/Db')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({   
  extended: true
})); 


app.get('/', function(req,res){
	res.write('( o Y o )');	
	res.end();
});
app.get('/calculate', function(req,res,next){ 
	var params=req.query;
	
	var result={};
	result.success=true;
	result.origin=params.o;
	result.destination=params.d;
	result.coords=params.c;
	result.weight=params.w;
		
	var origin =	params.orig.split(', ');
	var destin =	params.dest.split(', ');
	var carrier = Array();
	
	carrier.push({ id: 'UPS' });
	carrier.push({ id: 'FEDEX'});
	carrier.push({ id: 'USPS'});
	//carrier.push({ id: 'ARAMEX' });
	
	 db.readPlace({ origin: { state: origin[1],country: origin[2] }, destination: { state: destin[1],country: destin[2] } }, function(thisState){
		console.log(thisState);
		
		var pack=Array();
		var p=0;
		for(var j in carrier){
			var vendor=carrier[j];
			
			switch(carrier[j].id){
				case 'FEDEX':
					
					var fedex_data = fedex.prepare({ w: (params.w).toString(), pl: params.pl, ph: params.ph, pw: params.pw  }, { pin: params.o, cc: origin[2], sc:thisState.origin.stateCode,place: origin[0] },{ pin: params.d , cc:destin[2], sc:thisState.destination.stateCode,place: destin[0]  });	
					soap.createClient(fedex_data.path, fedex_data.endpoint, function(err, client) {
							if (err) {
								console.log(err);
								return ;
							}
							
							client.getRates(fedex_data.params, function(err, f_r) {
								console.log(f_r.HighestSeverity);
								var fedex_d2 = fedex.prepare({ w: (params.w-1).toString(), pl: params.pl, ph: params.ph, pw: params.pw  }, { pin: params.o, cc: origin[2], sc:thisState.origin.stateCode,place: origin[0] },{ pin: params.d , cc:destin[2], sc:thisState.destination.stateCode,place: destin[0]  });	
								soap.createClient(fedex_d2.path, fedex_d2.endpoint, function(err, client) {
									if (err) {
										return;
									}
									
									client.getRates(fedex_d2.params, function(err, f_r2) {
										var compdata={};
										if(f_r2) {	
											compdata=f_r2;
										} 
												
										var res_ar= fedex.result(f_r,compdata);
										pack=pack.concat(res_ar);
										p++;
										if(p==carrier.length){	
											req.result=result;
											req.data=pack;
											next()
										}
									});
								});
							});
						});
				break;
				case 'UPS':				
					var ups_data=ups.prepare({ w: params.w, pl: params.pl, ph: params.ph, pw: params.pw }, { pin: params.o, cc: origin[2], sc:thisState.origin.stateCode,place: origin[0] },{ pin: params.d , cc:destin[2], sc:thisState.destination.stateCode,place: destin[0]  });
					axios.post(ups_data.path,ups_data.params)
					.then(r =>{ 
							if(r.data.RateResponse){
								var data=r.data.RateResponse.RatedShipment;		
								var ups_d2 = ups.prepare({ w: (params.w-1).toString(), pl: params.pl, ph: params.ph, pw: params.pw  }, { pin: params.o, cc: origin[2], sc:thisState.origin.stateCode,place: origin[0] },{ pin: params.d , cc:destin[2], sc:thisState.destination.stateCode,place: destin[0]  });
								axios.post(ups_d2.path, ups_d2.param)
								.then(c_r =>{
									var compdata={};
									if(c_r.data.RateResponse){
										compdata=c_r.data.RateResponse.RatedShipment;
									}
									
									var res_ar=ups.result(data,compdata);				
									pack=pack.concat(res_ar);
									p++;
									if(p==carrier.length){	
										req.result=result;
										req.data=pack;
										next()
									}
								}).catch(e =>{			
									console.log(e);	
								});
							} else{
								p++;
								if(p==carrier.length){	
										req.result=result;
										req.data=pack;
										next()
								}
								
							}
						
					}).catch(e =>{			
						console.log(e);	
					});
				break;
				case 'USPS':				
					var usps_data=usps.prepare({ w: params.w, pl: params.pl, ph: params.ph, pw: params.pw }, { pin: params.o, cc: origin[2], sc:thisState.origin.stateCode,place: origin[0] },{ pin: params.d , cc:thisState.destination.CountryName, sc:thisState.destination.stateCode,place: destin[0]  });
					axios.get(usps_data.path+'API='+usps_data.endpoint+'&XML='+usps_data.params)
					.then(r =>{ 
							parseString(r.data, function (err, data) {
							if(data.IntlRateV2Response){  // console.dir(data);
							
								var usps_d2 = usps.prepare({ w: (params.w-1).toString(), pl: params.pl, ph: params.ph, pw: params.pw  }, { pin: params.o, cc: origin[2], sc:thisState.origin.CountryName,place: origin[0] },{ pin: params.d , cc:destin[2], sc:thisState.destination.stateCode,place: destin[0]  });
								axios.get(usps_d2.path+'API='+usps_d2.endpoint+'&XML='+usps_d2.param)
								.then(c_r =>{
									parseString(c_r.data, function (err, c_rd) {
										var compdata={};
										/*if(c_r.data.RateResponse){
											compdata=c_r.data.RateResponse.RatedShipment;
										}
										*/
										var res_ar=usps.result(data.IntlRateV2Response,compdata);				
										pack=pack.concat(res_ar);
										p++;
										if(p==carrier.length){	
											req.result=result;
											req.data=pack;
											next()
										}
									});
								}).catch(e =>{			
									console.log(e);	
								});
							} else{
								p++;
								if(p==carrier.length){	
										req.result=result;
										req.data=pack;
										next()
								}
								
							}
							});
					}).catch(e =>{			
						console.log(e);	
					});
				break;
				case 'ARAMEX':
					var aramex_data = aramex.prepare({ w: (params.w-1).toString(), pl: params.pl, ph: params.ph, pw: params.pw  }, { pin: "10001", cc:'US', sc:'NY',place: params.orig },{ pin: "90270" , cc:'US', sc:'CA',place: params.dest });	
					soap.createClient(aramex_data.path, aramex_data.endpoint, function(err, client) {
				  
				  
						  client.CalculateRate(aramex_data.params, function(err, result) {
							  console.log(result);
						  });
					});
				break;
			}
		}

	});	

},function(req,res){
	var params=req.query;
	var result=req.result;
	var pack=req.data;
	if(params.s==0)
		pack=Sort.byCost(pack,0,pack.length-1);
	else
		pack=Sort.byFast(pack,0,pack.length-1);
	result.results=pack;
	console.log('DONE');	
	res.setHeader("Access-Control-Allow-Origin","*");									
	res.json(result);
	res.end();
});



app.listen(port)