var vendor='USPS';
var api= 'http://production.shippingapis.com/ShippingApi.dll?';
var api_key='525GEORG5202';
function service(code){
	var service = {
    '01' : 'UPS Next Day Air',
    '02' : 'UPS 2nd Day Air',
    '03' : 'UPS Ground',
    '07' : 'UPS Worldwide Express',
    '08' : 'UPS Worldwide Expedited',
    '11' : 'UPS Standard',
    '12' : 'UPS 3 Day Select',
    '13' : 'UPS Next Day Air Saver',
    '14' : 'UPS Next Day Air Early A.M.',
    '54' : 'UPS Worldwide Express Plus',
    '59' : 'UPS 2nd Day Air A.M.',
    '65' : 'UPS Saver',
    '82' : 'UPS Today Standard',
    '83' : 'UPS Today Dedicated Courier',
    '84' : 'UPS Today Intercity',
    '85' : 'UPS Today Express',
    '86' : 'UPS Today Express Saver'
	};
	
	if(service[code])
		return service[code];
	else
		return 'Service '+code;
}

function currency(a){
	return '$'+a;
}
function result(main,compare){
	var pack=Array();
	var comp={};	
	
	if(compare.Package){
			for(var i in compare.Package[0].Service){
							var d=compare.Package[0].Service[i];
							comp[d.SvcDescription[0]]=currency(d.CommercialPostage);
						}
	}
						for(var i in main.Package[0].Service){
							
							var d=main.Package[0].Service[i];
							var deli ={ days: 'Slow', day_raw : 100 };
							if(d.SvcCommitments){
								deli={ days: d.SvcCommitments[0], day_raw : 0 };
							}
							pack.push({ carrier: vendor, 'service': d.SvcDescription[0], cost_num: d.CommercialPostage, cost: currency(d.CommercialPostage), delivery: deli, compare: comp[d.SvcDescription[0]] });					
						}
	return pack;
}
function prepare(pack,orig,dest){
	var lbs=pack.w.split('.');
	if(lbs.length==1) lbs[1]=0;
	var endpoint='IntlRateV2';
	if(dest.cc=='United States of America'){
		endpoint='RateV4';
		var data='<RateV4Request USERID="'+api_key+'"><Package ID="1ST"><Service>PRIORITY</Service><ZipOrigination>'+orig.pin+'</ZipOrigination><ZipDestination>'+dest.pin+'</ZipDestination><Pounds>'+lbs[0]+'</Pounds><Ounces>'+lbs[1]+'</Ounces><Container>NONRECTANGULAR</Container><Size>LARGE</Size><Width>'+pack.pw+'</Width><Length>'+pack.pl+'</Length> <Height>'+pack.ph+'</Height><Girth>0</Girth></Package></RateV4Request>';
	} else{
		var data='<IntlRateV2Request USERID="'+api_key+'"><Revision>2</Revision><Package ID="0"><Pounds>'+lbs[0]+'</Pounds><Ounces>'+lbs[1]+'</Ounces><Machinable>True</Machinable><MailType>package</MailType><ValueOfContents>2499</ValueOfContents><Country>'+dest.cc+'</Country><Container>rectangular</Container><Size>large</Size><Width>'+pack.pw+'</Width><Length>'+pack.pl+'</Length><Height>'+pack.ph+'</Height><Girth>0</Girth><OriginZip>'+orig.pin+'</OriginZip><CommercialFlag>Y</CommercialFlag><ExtraServices><ExtraService>1</ExtraService></ExtraServices></Package></IntlRateV2Request>';		
	}
	  
	return {path: api, endpoint: endpoint, params: data } 

}

module.exports = { prepare,result}