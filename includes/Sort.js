var mergeCost=function(A,start,mid,end){var p=start,q=mid+1;var Arr=new Array(end-start+1),k=0;for(var i=start;i<=end;i++){var a_p=A[p]
var a_q=A[q];if(A[p]){a_p=parseFloat(A[p].cost_num)}
if(A[q]){a_q=parseFloat(A[q].cost_num)}
if(p>mid)
Arr[k++]=A[q++];else if(q>end)
Arr[k++]=A[p++];else if(a_p<a_q)
Arr[k++]=A[p++];else Arr[k++]=A[q++]}
for(var p=0;p<k;p ++){A[start++]=Arr[p]}
return A};

var mergeFast=function(A,start,mid,end){var p=start,q=mid+1;var Arr=new Array(end-start+1),k=0;for(var i=start;i<=end;i++){var a_p=A[p]
var a_q=A[q];if(A[p]){a_p=parseFloat(A[p].delivery.day_raw)}
if(A[q]){a_q=parseFloat(A[q].delivery.day_raw)}
if(p>mid)
Arr[k++]=A[q++];else if(q>end)
Arr[k++]=A[p++];else if(a_p<a_q)
Arr[k++]=A[p++];else Arr[k++]=A[q++]}
for(var p=0;p<k;p ++){A[start++]=Arr[p]}
return A};

function byCost(A,start,end){if(start<end){var mid=parseInt((start+end)/2);byCost(A,start,mid);byCost(A,mid+1,end);return mergeCost(A,start,mid,end)}}
function byFast(A,start,end){if(start<end){var mid=parseInt((start+end)/2);byFast(A,start,mid);byFast(A,mid+1,end);return mergeFast(A,start,mid,end)}}
module.exports={ byCost,byFast }