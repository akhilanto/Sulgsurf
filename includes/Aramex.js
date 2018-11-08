const path = require('path')
var vendor='ARAMEX';
var wsdl='aramex_rates_calculator.wsdl';
var url=path.join(__dirname,  'wsdl', wsdl);
var endpoint= 'http://ws.aramex.net/shippingapi/ratecalculator/service_1_0.svc';
var resource= {
    environment: 'sandbox', // or live
    debug: true,
    key: 'o6dknGJFkF6lCDWU',
    password: 'FxQ4mllrrKcLnuFt5AlAoqNdv',
    account_number: '510088000',
    meter_number: '119090053',
    imperial: true, // set to false for metricversion: 
	version: {ServiceId: 'crs', Major: '24', Intermediate: '0', Minor: '0'}
  };
function prepare(pack,orig,dest){
	
var args= Array();
			
			args.ClientInfo 			=  {
									AccountCountryCode	: 'JO',
									AccountEntity	 	: 'AMM',
									AccountNumber		 	: '00000',
									AccountPin		 	: '000000',
									UserName			 	: 'abhiushas@gmail.com',
									Password			 	: '32Bisenough!',
									Version			 	: 'v1.0'
			};
								
		args.Transaction 			= {
									'Reference1'			: '001' 
		};
								
		args.OriginAddress	 	=  {
									City					: 'Amman',
									CountryCode				: 'JO'
		};
								
		args.DestinationAddress	=  {
									City		: 'Dubai',
									CountryCode			: 'AE'
		};
		args.ShipmentDetails		=  {
									PaymentType			 : 'P',
									ProductGroup			 : 'EXP',
									ProductType			 : 'PPX',
									ActualWeight 			 :  {'Value' : 5, 'Unit' : 'KG'},
									ChargeableWeight 	     :  {'Value' : 5, 'Unit' : 'KG'},
									NumberOfPieces	 : 5
		};
	
	var data = { path: url, endpoint: endpoint, params: args };
	return data;
	
}

function service(code){
	var service = {
		'01' : 'Priority Overnight',
		'03' : '2Day',
		'05' : 'Standard Overnight',
		'06' : 'First Overnight',
		'20' : 'Express Saver',
		'70' : '1Day Freight',
		'80' : '2Day Freight',
		'83' : '3Day Freight',
		'90' : 'Home Delivery',
		'92' : 'Ground International Shipments',
		'111' : 'Freight International Services',
		'01' : 'International Priority',
		'03' : 'International Economy',
		'06' : 'International First',
		'17' : 'International Economy DirectDistribution Service',
		'18' : 'International Priority DirectDistribution',
		'57' : 'Europe First',
		'70' : 'International Priority Freight',
		'82' : 'International DirectDistribution',
		'84' : 'International Priority Direct Distribution Freight',
		'86' : 'International Economy Freight',
		'121' : 'International Ground Distribution (IGD)'
	};
	if(service[code])
		return service[code];
	else
		return 'Service '+code;
}

function speed(date){
	var d2 = new Date(date);
	var d1 = new Date();
	var one_day = 1000 * 60 * 60 * 24;
	return Math.ceil((d2.getTime()-d1.getTime())/(one_day))
}
function currency(a){
	return '$'+a;
}

function result(data){
	var pack=Array();
	console.log(data);
	if(data.HighestSeverity){
					for(var i in data.RateReplyDetails){
						var d= data.RateReplyDetails[i];
						var cost = d.RatedShipmentDetails[0].ShipmentRateDetail.TotalNetCharge;
						console.log('---');
						var deli={ days:speed(d.DeliveryTimestamp)+' days', day_raw : speed(d.DeliveryTimestamp) };
						pack.push({ carrier: vendor, 'service': service(d.ServiceDescription.Code), cost_num: cost.Amount, cost: currency(cost.Amount), delivery: deli, compare: '0' });
					}
				}
	return pack;
	}

module.exports = { prepare,result }