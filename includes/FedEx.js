const path = require('path')
//https://www.thumbzilla.com/video/ph5bdc6b84275d5/meyd-388
//https://www.thumbzilla.com/video/ph5bdf080bb01d3/fucking-my-professor-and-cumming-in-her-tights-before-class
//https://www.thumbzilla.com/video/ph5bd5a65e8c851/av-%25E0%25B8%258B%25E0%25B8%25B1%25E0%25B8%259A%25E0%25B9%2584%25E0%25B8%2597%25E0%25B8%25A2-%25E0%25B9%2580%25E0%25B8%259E%25E0%25B8%25B7%25E0%25B9%2588%25E0%25B8%25AD%25E0%25B8%2599%25E0%25B8%259A%25E0%25B9%2589%25E0%25B8%25B2%25E0%25B8%2599-%25E0%25B9%2582%25E0%25B8%259B%25E0%25B9%258A%25E0%25B9%2584%25E0%25B8%2597%25E0%25B8%25A2
var vendor='FEDEX';
var wsdl='FedEx_RateService_v24.wsdl';
var url=path.join(__dirname,  'wsdl', wsdl);
var endpoint= 'https://wsbeta.fedex.com:443/web-services/rate?wsdl';
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
	var res={ 
		WebAuthenticationDetail: {
		   /* ParentCredential: {
			  Key: $scope.options.key,
			  Password: $scope.options.password
			},*/ UserCredential: {
			  Key: resource.key,
			  Password: resource.password
			}
		},
		ClientDetail: {
			AccountNumber: resource.account_number,
			MeterNumber: resource.meter_number
		},
		Version: {
			ServiceId: resource.version.ServiceId,
			Major: resource.version.Major,
			Intermediate: resource.version.Intermediate,
			Minor: resource.version.Minor
		},
		ReturnTransitAndCommit: true,
		RequestedShipment: {
			DropoffType: 'REGULAR_PICKUP',
			//ShipTimestamp:  date,
			//ServiceType: 'INTERNATIONAL_PRIORITY',
			PackagingType: 'FEDEX_BOX',
			Shipper: {
			  /*Contact: {
				PersonName: 'Sender Name',
				CompanyName: 'Company Name',
				PhoneNumber: '9012638716'
			  },*/
			  Address: {
				StreetLines: [
				  'Address Line 1'
				],
				City: orig.place,
				StateOrProvinceCode: orig.sc,
				PostalCode: orig.pin,
				CountryCode: orig.cc
			  }
			},
			Recipient: {
			 /* Contact: {
				PersonName: 'Recipient Name',
				CompanyName: 'Company Receipt Name',
				PhoneNumber: '9012637906'
			  },*/
			  Address: {
				StreetLines: [
				  'Address Line 1'
				],
				City: dest.place,
				StateOrProvinceCode: dest.sc,
				PostalCode: dest.pin,
				CountryCode: dest.cc,
				Residential: false
			  }
			},
			ShippingChargesPayment: {
			  PaymentType: 'SENDER',
			  Payor: {
				ResponsibleParty: {
				  AccountNumber: resource.account_number
				}
			  }
			},
			PackageCount: '1',
			RequestedPackageLineItems: {
			  SequenceNumber: 1,
			  GroupPackageCount: 1,
			  Weight: {
				Units: 'LB',
				Value: pack.w
			  },
			  Dimensions: {
				Length: pack.pl,
				Width: pack.pw,
				Height: pack.ph,
				Units: 'IN'
			  }
			}
	    }
	};
	var data = { path: url, endpoint: endpoint, params: res };
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

function result(data,compare){
	var pack=Array(),
		comp={};
	if(compare.HighestSeverity){
		for(var i in compare.RateReplyDetails){							
			var d= data.RateReplyDetails[i]; 
			comp[d.ServiceDescription.Code]=currency(d.RatedShipmentDetails[0].ShipmentRateDetail.TotalNetCharge.Amount);
		}
	}
	if(data.HighestSeverity){
					for(var i in data.RateReplyDetails){
						var d= data.RateReplyDetails[i];
						var cost = d.RatedShipmentDetails[0].ShipmentRateDetail.TotalNetCharge;
						var deli={ days:speed(d.DeliveryTimestamp)+' days', day_raw : speed(d.DeliveryTimestamp) };
						pack.push({ carrier: vendor, 'service': service(d.ServiceDescription.Code), cost_num: cost.Amount, cost: currency(cost.Amount), delivery: deli, compare: comp[d.ServiceDescription.Code] });
					}
				}
	return pack;
	}

module.exports = { prepare,result }