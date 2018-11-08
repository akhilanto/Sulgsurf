const express = require('express')
const bodyParser = require('body-parser')
const soap = require('soap')
const axios = require('axios')
const app= express()
const port = process.env.PORT || 3000

var Sort = require('./includes/Sort')
var ups = require('./includes/UPS')
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
							//console.log(client);
							client.getRates(fedex_data.params, function(err, f_r) {
								var fedex_d2 = fedex.prepare({ w: (params.w-1).toString(), pl: params.pl, ph: params.ph, pw: params.pw  }, { pin: params.o, cc: origin[2], sc:thisState.origin.stateCode,place: origin[0] },{ pin: params.d , cc:destin[2], sc:thisState.destination.stateCode,place: destin[0]  });	
								soap.createClient(fedex_d2.path, fedex_d2.endpoint, function(err, client) {
									if (err) {
										return;
									}
									
									client.getRates(fedex_d2.params, function(err, f_r2) {
										if(f_r) {							
											var res_ar= fedex.result(f_r,f_r2);
											pack=pack.concat(res_ar);							
										} 
										console.log('FED');
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
				case 'UPSSOAP':
					
				break;
				case 'UPS':				
					var ups_data=ups.prepare({ w: params.w, pl: params.pl, ph: params.ph, pw: params.pw }, { pin: params.o, cc: origin[2], sc:thisState.stateCode,place: origin[0] },{ pin: params.d , cc:destin[2], sc:thisState.stateCode,place: destin[0]  });
					request.post({ url: ups_data.path,formData:ups_data.params },function(err, res, body){
						var data=JSON.parse(body)
						if(data.RateResponse){
							
							var ups_d2 = ups.prepare({ w: (params.w-1).toString(), pl: params.pl, ph: params.ph, pw: params.pw  }, { pin: params.o, cc: origin[2], sc:thisState.stateCode,place: origin[0] },{ pin: params.d , cc:destin[2], sc:thisState.stateCode,place: destin[0]  });
							request.post({ url: ups_d2.path,formData:ups_d2.params },function(err, res, c_r){
								var c_rd=JSON.parse(c_r)
								var res_ar=ups.result(data,c_rd.RateResponse.RatedShipment);				
								pack=pack.concat(res_ar);
							});
						}
						p++;
						if(p==carrier.length){	
							req.result=result;
							req.data=pack;
							next()
						}
	  
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