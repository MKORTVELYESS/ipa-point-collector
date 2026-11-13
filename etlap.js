function number_format(number, decimals, dec_point, thousands_sep) {
  //  discuss at: http://phpjs.org/functions/number_format/
  // original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: davook
  // improved by: Brett Zamir (http://brett-zamir.me)
  // improved by: Brett Zamir (http://brett-zamir.me)
  // improved by: Theriault
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: Michael White (http://getsprink.com)
  // bugfixed by: Benjamin Lupton
  // bugfixed by: Allan Jensen (http://www.winternet.no)
  // bugfixed by: Howard Yeend
  // bugfixed by: Diogo Resende
  // bugfixed by: Rival
  // bugfixed by: Brett Zamir (http://brett-zamir.me)
  //  revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
  //  revised by: Luke Smith (http://lucassmith.name)
  //    input by: Kheang Hok Chin (http://www.distantia.ca/)
  //    input by: Jay Klehr
  //    input by: Amir Habibi (http://www.residence-mixte.com/)
  //    input by: Amirouche
  //   example 1: number_format(1234.56);
  //   returns 1: '1,235'
  //   example 2: number_format(1234.56, 2, ',', ' ');
  //   returns 2: '1 234,56'
  //   example 3: number_format(1234.5678, 2, '.', '');
  //   returns 3: '1234.57'
  //   example 4: number_format(67, 2, ',', '.');
  //   returns 4: '67,00'
  //   example 5: number_format(1000);
  //   returns 5: '1,000'
  //   example 6: number_format(67.311, 2);
  //   returns 6: '67.31'
  //   example 7: number_format(1000.55, 1);
  //   returns 7: '1,000.6'
  //   example 8: number_format(67000, 5, ',', '.');
  //   returns 8: '67.000,00000'
  //   example 9: number_format(0.9, 0);
  //   returns 9: '1'
  //  example 10: number_format('1.20', 2);
  //  returns 10: '1.20'
  //  example 11: number_format('1.20', 4);
  //  returns 11: '1.2000'
  //  example 12: number_format('1.2000', 3);
  //  returns 12: '1.200'
  //  example 13: number_format('1 000,50', 2, '.', ' ');
  //  returns 13: '100 050.00'
  //  example 14: number_format(1e-8, 8, '.', '');
  //  returns 14: '0.00000001'

  number = (number + '')
    .replace(/[^0-9+\-Ee.]/g, '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function(n, prec) {
      var k = Math.pow(10, prec);
      return '' + (Math.round(n * k) / k)
        .toFixed(prec);
    };
  // Fix for IE parseFloat(0.55).toFixed(0) = 0;
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
    .split('.');
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
  }
  if ((s[1] || '')
    .length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1)
      .join('0');
  }
  return s.join(dec);
}

var resptable_instances=[];
var resptable_touchx=-1,resptable_touchy=-1,resptable_tmp='';

function resptable_init(empty) {
    resptable_detect(empty);	
	if (window.innerWidth<500 && new Date().getDay() === 4 && document.querySelector('.resptable[data-lastminute="1"]')) {
	  deleteColumn('.resptable', 2);
	}
    if ( window.addEventListener )
        window.addEventListener( "resize", resptable_recalc, false );
    else if ( window.attachEvent )
        window.attachEvent( "onresize", resptable_recalc );
    else
        window["onresize"]=resptable_recalc;
    if ( window.addEventListener )
        window.addEventListener( "scroll", resptable_recalc, false );
    else if ( window.attachEvent )
        window.attachEvent( "onscroll", resptable_recalc );
    else
        window["onscroll"]=resptable_recalc;
    setTimeout('resptable_recalc();',10);
}
function resptable_scrollto(name,advanceTop) {
	var t,y=0,obj=document.getElementById(name);
	t=obj;
	while (t.offsetParent) {
		y += t.offsetTop;
		t = t.offsetParent;
   	}
	window.scrollTo(0,obj.offsetTop+obj.offsetHeight+advanceTop);
}
function resptable_detect(empty) {
    var i,ts=document.getElementsByTagName('TABLE'),ox=0,oy=0;
    var fff=document.getElementById('resptable_filters');
    var ffw=Math.floor(document.getElementById('resptable_filters').offsetWidth+20);
	document.getElementById('resptable_filters').style.display='none';
	document.getElementById('resptable_filtershadow').style.display='none';
	document.getElementById('resptable_filtershadow').setAttribute('onclick','resptable_filterbox(0);');
    for(i=0;i<ts.length;i++) if(ts[i].className=='resptable') {
    	var l=resptable_instances.length;
		resptable_instances[resptable_instances.length]=ts[i];
	var j,f=0,c=0,th=ts[i].getElementsByTagName('TH');
	for(j=0;j<th.length;j++) {
	    if(th[j].className=='resptable_fixed') f+=th[j].offsetWidth;
	    else c++;
	}
	f=40;
	t=ts[i];
	while (t.offsetParent) {
		ox += t.offsetLeft;
		oy += t.offsetTop;
		t = t.offsetParent;
   	}
	var pagerdiv=document.createElement('DIV');
	var paginationspan=document.createElement('SPAN');
	var filterspan=document.createElement('SPAN'),prevspan=document.createElement('SPAN'),nextspan=document.createElement('SPAN'),labelspan=document.createElement('SPAN');
	var weekspan=document.createElement('SPAN'),wprevspan=document.createElement('SPAN'),wnextspan=document.createElement('SPAN'),wlabelspan=document.createElement('NOBR');
	var wys=document.createElement('SPAN'),wyl=document.createElement('SPAN'),wyw=document.createElement('SPAN');
	var cl=document.createElement('SPAN'),cs=document.createElement('SPAN'),cb=document.createElement('B'),co=document.createElement('SPAN'),col=document.createElement('SPAN');
	paginationspan.className="paginationspan";
	pagerdiv.setAttribute('id','resptable'+l+'_pager');
	pagerdiv.className="resptable_pager";	
	pagerdiv.setAttribute('style','position:relative;z-index:1;margin:0px;');
	weekspan.setAttribute('style','float:left;');
	weekspan.className="weekspan"
	wprevspan.className="resptable_button resptable_prevweek";
	wprevspan.innerHTML='';
	var prevyearweek = document.getElementById("prevyearweek");
	if ( prevyearweek )
	{
		wprevspan.setAttribute('onclick','resptable_prevweek_new('+prevyearweek.getAttribute('data-prevyear')+','+prevyearweek.getAttribute('data-prevweek')+');');
	} else
	{
		wprevspan.setAttribute('onclick','resptable_prevweek('+ts[i].getAttribute('data-year')+','+ts[i].getAttribute('data-week')+');');
	}
	wys.className='resptable_filter1';
	wys.innerHTML=ts[i].getAttribute('data-year')+". ";
	wyl.innerHTML=ts[i].getAttribute('data-week');
	wyw.className='resptable_filter2';
	wyw.innerHTML=".hét <span class='dateinterval resptable_largeonly'>"+ts[i].getAttribute('data-weekdays')+"</span>";
	wlabelspan.appendChild(wys);
	wlabelspan.appendChild(wyl);
	wlabelspan.appendChild(wyw);
	wnextspan.className="resptable_button resptable_nextweek";
	wnextspan.innerHTML='';
	var nextyearweek = document.getElementById("nextyearweek");
	if ( nextyearweek )
	{
		wnextspan.setAttribute('onclick','resptable_nextweek_new('+nextyearweek.getAttribute('data-nextyear')+','+nextyearweek.getAttribute('data-nextweek')+');');
	} else
	{
		wnextspan.setAttribute('onclick','resptable_nextweek('+ts[i].getAttribute('data-year')+','+ts[i].getAttribute('data-week')+');');
	}
	labelspan.className="resptable_largeonly";
	labelspan.innerHTML="nap";
	filterspan.setAttribute('id','resptable_filterbtn');
	filterspan.className="resptable_button";
	filterspan.innerHTML="D<span class='resptable_filter1'>iéta<span class='resptable_filter2'>szűrő</span></span>";
	filterspan.setAttribute('onclick','resptable_filterbox('+l+');');
	filterspan.setAttribute('style','margin-right:0px;');
	filterspan.setAttribute('title','Diétaszűrő');
	prevspan.setAttribute('id','resptable'+l+'_prev');
	prevspan.className="resptable_button_inactive";
	// prevspan.innerHTML=ts[i].getAttribute('data-prev')?ts[i].getAttribute('data-prev'):'◀';
	prevspan.setAttribute('onclick','resptable_prev('+l+');');
	nextspan.setAttribute('id','resptable'+l+'_next');
	nextspan.className="resptable_button_inactive";
	// nextspan.innerHTML=ts[i].getAttribute('data-next')?ts[i].getAttribute('data-next'):'▶';
	nextspan.setAttribute('onclick','resptable_next('+l+');');
	if(ts[i].getAttribute('data-cart')!=null) {
		var cartspan = document.createElement('SPAN'), s=ts[i].getAttribute('data-cart');
		cl.className='resptable_largeonly';
		cl.innerHTML='Kosár: ';
		cs.setAttribute('id','resptable_cart');
		cs.setAttribute('style','text-align:right;min-width:60px;font-weight:bold;font-size:18px !important;');
		cs.setAttribute('onclick','resptable_doorder(this);');
		cs.innerHTML=number_format(s,0,',',' ');
		cb.innerHTML=' Ft ';
		co.setAttribute('id','resptable_orderbutton');
		co.className="resptable_button";//+(s!=0?'':'_inactive');
		co.setAttribute('onclick','resptable_doorder(this);');
		co.setAttribute('style','font-size:14px;');
		col.setAttribute('id','resptable_orderbuttonl');
		col.innerHTML=(Math.floor(s)<0?"Lemond":"Megrendel");

		co.appendChild(col);
		cb.appendChild(co);
		cartspan.appendChild(cl);
		cartspan.appendChild(cs);
		cartspan.appendChild(cb);
		pagerdiv.appendChild(cartspan);
	}
	weekspan.appendChild(filterspan);
	weekspan.appendChild(wprevspan);
	weekspan.appendChild(wlabelspan);
	weekspan.appendChild(wnextspan);
	pagerdiv.appendChild(weekspan);
	paginationspan.appendChild(prevspan);
	paginationspan.appendChild(labelspan);
	paginationspan.appendChild(nextspan);
	pagerdiv.appendChild(paginationspan);
	ts[i].parentNode.insertBefore(pagerdiv, ts[i]);
//	ts[i].setAttribute('style','margin-top:'+(pagerdiv.offsetHeight+0)+'px;');
	ts[i].setAttribute('data-r','resptable'+l);
	ts[i].setAttribute('data-f',f);
	ts[i].setAttribute('data-c',c);
	ts[i].setAttribute('data-o',0);
	ts[i].setAttribute('data-x',ox);
	ts[i].setAttribute('data-y',oy);
	ts[i].setAttribute('ontouchstart','resptable_touchstart(event);');
//	ts[i].setAttribute('onmousedown','resptable_touchstart(event);');
	ts[i].setAttribute('ontouchend','resptable_touchend(event,'+i+');');
//	ts[i].setAttribute('onmouseup','resptable_touchend(event,'+i+');');
	ts[i].setAttribute('ontouchcancel','resptable_touchcancel(event);');
    }
    for(i=0;i<resptable_instances.length;i++) {
		var j,tblhdr=document.createElement('TABLE');
		var pagerdiv=document.getElementById('resptable'+i+'_pager');
		tblhdr.setAttribute('id','resptable'+i+'_hdr');
		tblhdr.className=resptable_instances[i].className;
		tblhdr.setAttribute('style','position:relative;');
		if(empty==null) tblhdr.appendChild(ts[i].rows[0].cloneNode(true));
		else ts[i].style.display='none';
		try {
		ts[i].rows[1].cells[0].className=ts[i].rows[0].cells[0].className;
		ts[i].rows[0].style.display='none';
		} catch(e) {
//			tblhdr.style.display='none';
//			resptable_instances[i].style.display='none';
//			ts[i].style.display='none';
		}
		pagerdiv.appendChild(tblhdr);
		var k=tblhdr.getElementsByTagName('th')[0];
		k.innerHTML="&#xf0c9;";
		k.innerHTML="";
		k.setAttribute('class','etlapmenu');
		k.setAttribute('onclick','resptable_popup("'+i+'");');
		var popup=document.createElement('div');
		var popup2=document.createElement('div');
		var popup3=document.createElement('div');
		var popup4=document.createElement('div'),h=-30;
		var enable=document.createElement('input');
		var enable2=document.createElement('small');
		var popuphide=document.createElement('div');

		popup.setAttribute('id','resptable'+i+'_popup');
		popup.setAttribute('style','display:table-cell;background-color:#515d30;visibility:visible;box-shadow:2px 2px 2px #000;text-align:left;');
		popup2.setAttribute('class','breakfilters');
//		popup2.setAttribute('style','width:320px !important;');
		popup3.setAttribute('class','filterspopup2');
		popup3.setAttribute('style','display:table-cell;padding:5px;');
//		popup4.innerHTML=fff;
//		var p=document.createElement('div');
//		p.setAttribute('id','resptable'+i+'_popupbg');
//		p.setAttribute('style','position:fixed;top:0px;left:0px;width:100%;height:100%;visibility:hidden;background:#808080')
//		p.setAttribute('onclick','document.getElementById("resptable'+i+'_popup").style.visibility="hidden";document.getElementById("resptable'+i+'_popupbg").style.visibility="hidden";')
		for(j=0;j<resptable_instances[i].rows.length;j++) {
			if(resptable_instances[i].rows[j]!=null && resptable_instances[i].rows[j].cells[0].getAttribute('colspan')!=null) {
				var d=document.createElement('div');
				resptable_instances[i].rows[j].cells[0].setAttribute('id','etlapmenu_ref'+i+'_'+j);
				d.innerHTML='<nobr>'+resptable_instances[i].rows[j].cells[0].innerHTML+'</nobr>';
				d.setAttribute('style',resptable_instances[i].rows[j].cells[0].getAttribute('style')+';padding:3px;cursor:pointer;text-align:left;');
				d.setAttribute('onclick','resptable_scrollto("etlapmenu_ref'+i+'_'+j+'",'+(resptable_instances[i].getAttribute('data-y'))+');document.getElementById("resptable'+i+'_popup").style.visibility="hidden";');
				popup2.appendChild(d);
				h+=32;
			}
		}
		popup4.setAttribute('class','filterspopup2');
//		popup4.setAttribute('style','overflow:auto;width:'+/*ffw+*/'310px;height:'+h+'px;');
		popup4.setAttribute('style','overflow:auto;height:'+h+'px !important;');
		popup4.setAttribute('id','resptable'+i+'_popup4');
		enable.setAttribute('id','filter_enabled');
		enable.setAttribute('type','checkbox');
		enable.setAttribute('onchange','resptable_enablefilter(this);');
		// enable2.setAttribute('style','color:#F2EAB9;height:16px;line-height:16px;');
		enable2.setAttribute('style','height:16px;line-height:16px;');
		enable2.innerHTML='&nbsp;A <a href="/index.php/keresesifeltetelek" target="_new">keresési feltételek</a>et elfogadom';
		popuphide.setAttribute('id','resptable'+i+'_popuphide');
		popuphide.setAttribute('style','background-color:rgba(128,128,128,0.5);position:fixed;z-index:100;height:'+h+'px !important;');
		popup.appendChild(popup2);
/*
		popup3.appendChild(enable);
		popup3.appendChild(enable2);
		popup3.appendChild(popuphide);
		popup3.appendChild(popup4);
		popup.appendChild(popup3);
*/
//		pagerdiv.appendChild(p);
		pagerdiv.appendChild(popup);
		resptable_setwidth(resptable_instances[i]);
		try {
		for(j=0;j<resptable_instances[i].rows[1].cells.length;j++)
			if(resptable_instances[i].rows[1].cells[j].className.indexOf('hascart')>-1) {
				if(j>0) for(;j>1;j--) resptable_next(i);
				break;
			}
		} catch(e) {}
		resptable_popup(i);
	}
}
function resptable_popup(i)
{
	var o=document.getElementById("resptable"+i+"_popup");
//	var o2=document.getElementById("resptable"+i+"_popup4");
//	var o3=document.getElementById("resptable"+i+"_popuphide");
//	if(o2.offsetWidth>0) o3.style.width=o2.offsetWidth+'px';
//	document.getElementById('resptable_filters').style.display='table-cell';
	if(o.style.visibility=="visible") {
		o.style.visibility="hidden";
		o.style.display="none";
		o.style.zIndex=1;
		document.getElementById("resptable"+i+"_pager").style.zIndex=1;
	} else {
		o.style.visibility="visible";
		o.style.display="table-cell";
		o.style.zIndex=3;
		document.getElementById("resptable"+i+"_pager").style.zIndex=3;
	}
}
function resptable_jump(i, o)
{
	var tbl=resptable_instances[i];
	if(tbl.getAttribute('data-o')<tbl.getAttribute('data-h')) tbl.setAttribute('data-o', o);
	resptable_setwidth(tbl);
}
function resptable_prev(i)
{
	var tbl=resptable_instances[i];
	if(tbl.getAttribute('data-o')>0) tbl.setAttribute('data-o',Math.floor(tbl.getAttribute('data-o'))-1);
	resptable_setwidth(tbl);
}
function resptable_next(i, num=1)
{
	console.log(num)
	var tbl=resptable_instances[i];
	if(tbl.getAttribute('data-o')<tbl.getAttribute('data-h')) tbl.setAttribute('data-o',Math.floor(tbl.getAttribute('data-o'))+num);
	resptable_setwidth(tbl);
}
function deleteColumn(tableSelector, colIndex) {
  document.querySelectorAll(tableSelector + ' tr').forEach(tr => 
    tr.children[colIndex]?.remove()
  );
}

function resptable_setwidth(tbl) {
	var i,j,w=0,h=0,th=tbl.getElementsByTagName('TH'),ow=tbl.offsetWidth,o=Math.floor(tbl.getAttribute('data-o'));
	var tblhdr=document.getElementById(tbl.getAttribute('data-r')+'_hdr');
	var thhdr=tblhdr.getElementsByTagName('TH');
	var data_min =  tbl.getAttribute('data-min');
	// console.log(ow);
	console.log('szélesség',window.innerWidth)
	if(window.innerWidth<962) data_min = 190
	if(tbl.getAttribute('data-lastminute')==1) {
		data_min = 150;
	}
	while(w<data_min){
	    w=Math.floor((ow-tbl.getAttribute('data-f'))/(tbl.getAttribute('data-c')-h));
	    if(w<data_min) h++;
	}
	for(j=0;j<th.length;j++)
	    if(th[j].className!='resptable_fixed') {
			th[j].style.width=(w+0)+'px';
			thhdr[j].style.width=(w+0)+'px';
	    } else {
			th[j].setAttribute('style','width:'+Math.floor(tbl.getAttribute('data-f'))+'px !important;');
			thhdr[j].setAttribute('style','width:'+Math.floor(tbl.getAttribute('data-f'))+'px !important;');
		}
    for(i=0;i<tbl.rows.length;i++)
		for(j=0;j<th.length;j++) {
			// if(tbl.rows[i].cells.length<3) continue;
			if(tbl.rows[i].cells[j]==null) continue;
		    if(th[j].className!='resptable_fixed') {
	    		var st=(j>=o+(tbl.getAttribute('data-f')>0?1:0)&&j<th.length-h+o?'table-cell':'none'),bg='',bgc=tbl.rows[i].cells[j].getAttribute('data-bg');
	    		if(bgc!=null && bgc!='' && tbl.rows[i].cells[j].className.indexOf("_order")>-1) bg='background-color:'+bgc+' !important;';
				sss = tbl.rows[i].cells[j].getAttribute('style');
				// tbl.rows[i].cells[j].setAttribute('style',sss+bg+'display:'+st+';width:'+(w+0)+'px;');
				jQuery(tbl.rows[i].cells[j]).css('display', st);
				// jQuery(tbl.rows[i].cells[j]).css('background-color', bgc+'!important');
				jQuery(tbl.rows[i].cells[j]).css('width', (w+0)+'px');
				if(i==0) {
					tblhdr.rows[0].cells[j].setAttribute('style','display:'+st+';width:'+(w+0)+'px;');
					jQuery(tblhdr.rows[0].cells[j]).css('display',st);
					jQuery(tblhdr.rows[0].cells[j]).css('width',(w+0));
				}
			} else {
				// var old=tbl.rows[i].cells[j].getAttribute('style').replace(/width:[^;]+;/,'');
				// tbl.rows[i].cells[j].setAttribute('style',old+'width:'+Math.floor(tbl.getAttribute('data-f'))+'px;');
			}
		}
	if(tbl.getAttribute('data-h')==null || tbl.getAttribute('data-h')!=h) {o=0;tbl.setAttribute('data-o',0);}
	tbl.setAttribute('data-w',w);
	tbl.setAttribute('data-h',h);
	document.getElementById(tbl.getAttribute('data-r')+'_prev').className=(tbl.getAttribute('data-o')>0?'resptable_button':'resptable_button_inactive');
	document.getElementById(tbl.getAttribute('data-r')+'_next').className=(h>0&&tbl.getAttribute('data-o')<h?'resptable_button':'resptable_button_inactive');
	tblhdr.style.width=tbl.offsetWidth+'px';
	var scrx=window.pageXOffset?window.pageXOffset:document.body.scrollLeft,scry=window.pageYOffset?window.pageYOffset:document.body.scrollTop;
	var y=0,p=document.getElementById(tbl.getAttribute('data-r')+'_pager');
	var t=tbl;
	while (t.offsetParent) {
		y += t.offsetTop; 
		t = t.offsetParent;
   	}
	if(scry>y-tblhdr.offsetHeight-p.offsetHeight && scry<y+tbl.offsetHeight-p.offsetHeight) {
		p.setAttribute('style','position:fixed;top:0px;width:'+(tblhdr.offsetWidth)+'px;');
		tbl.setAttribute('style','margin-top:'+(0+p.offsetHeight)+'px;');
	} else {
		p.setAttribute('style','position:relative;z-index:1;display:block;');
		tbl.setAttribute('style','margin-top:0px;');
	}
}

function setActiveCells()
{
	jQuery('.resptable td div').removeClass('active');
	
	jQuery('.resptable tr').each( function() {
		jQuery(this).find('td:visible:last').find('div').addClass('active');
		jQuery(this).find('td:visible:first').find('div').addClass('active');
	})
	
	// jQuery('.resptable tr').not('.blokkheader').find('td').removeAttr('colspan');
	/*jQuery('.resptable tr').not('.blokkheader').each( function() {
		if (jQuery(this).find('td:visible').length <3) {
			jQuery(this).find('td:visible:last').attr('colspan', 2);
		}
	})*/
}

function resptable_recalc(evt) {
    var i;
    for(i=0;i<resptable_instances.length;i++)
	resptable_setwidth(resptable_instances[i]);
}
function resptable_refreshfilter() {
    var i;
    for(i=0;i<resptable_instances.length;i++)
	resptable_filter(resptable_instances[i]);
}

function cellborder(obj)
{
	console.log(obj)
	
	o = obj.closest('td')
	bg = o.attr('data-bg');
	console.log(bg)
	if(Math.floor(obj.val())>0) {
		o.css('-webkit-box-shadow', 'inset 0px 0px 0px 3px '+bg);
		o.css('-moz-box-shadow', 'inset 0px 0px 0px 3px '+bg);
		o.css('box-shadow', 'inset 0px 0px 0px 3px '+bg);
	}
}

function resptable_cart(obj,nomin) {
	var o=obj.parentNode;
	while(o.tagName!="TD") o=o.parentNode;
	var amountBefore=Math.floor(obj.getAttribute('data-amountbefore'));
	if(obj.value<0) obj.value=0;
	if(nomin!=null && nomin>0 && obj.value<nomin) obj.value=nomin;
	var order=Math.floor(obj.getAttribute('data-order'));
	var max=Math.floor(obj.getAttribute('max'));
	if(max>0 && Math.floor(obj.value)>max) obj.value=max;
	obj.className=obj.className.replace('etlapkosar_unsaved','');
	if(Math.floor(obj.value)!=order)
		obj.className+=' etlapkosar_unsaved';
	var ost=o.getAttribute('style').replace(/background[^;]+;/,'');
	// o.setAttribute('style','background-color:'+(Math.floor(obj.value)>0?o.getAttribute('data-bg'):'transparent')+' !important;'+ost);
	jQuery(o).css('-webkit-box-shadow', '');
	jQuery(o).css('-moz-box-shadow', '');
	jQuery(o).css('box-shadow', '');
	if(Math.floor(obj.value)>0) {
		jQuery(o).css('-webkit-box-shadow', 'inset 0px 0px 0px 3px '+o.getAttribute('data-bg'));
		jQuery(o).css('-moz-box-shadow', 'inset 0px 0px 0px 3px '+o.getAttribute('data-bg'));
		jQuery(o).css('box-shadow', 'inset 0px 0px 0px 3px '+o.getAttribute('data-bg'));
	}
	o.className=o.className.replace('etlapcella_order','');
	if(Math.floor(obj.value)>0) o.className+=' etlapcella_order';

	var http_request = new XMLHttpRequest();
	http_request.open('GET',document.location.href+'&cart='+obj.getAttribute('data-item')+'&price='+obj.getAttribute('data-price')+'&amount='+Math.floor(obj.value)+'&menucache_id='+obj.getAttribute('data-menucache_id'),false);
	http_request.send();
	if(http_request.status==200) {
	    var c = document.getElementById('resptable_cart'),
			b = document.getElementById('resptable_orderbutton'),
			l = document.getElementById('resptable_orderbuttonl'),
			s = http_request.responseText;
		if( s.startsWith('error:') )
		{
			alert(s.replace('error:', ''));
			obj.value =Math.floor(obj.getAttribute('data-amountbefore'))
		} else 
		{
			var amountAfter=Math.floor(obj.value);
			obj.setAttribute('data-amountbefore', amountAfter)
			if (c != null) c.innerHTML = number_format(s, 0, ',', ' ');
			if (l != null) l.innerHTML = (Math.floor(s) < 0 ? "Lemond" : "Megrendel");
			/*if (b != null) b.className = (Math.floor(s) != 0 ? 'resptable_button' : 'resptable_button_inactive');*/
			if (b != null) b.className = (Math.floor(s) != 0 ? 'resptable_button' : 'resptable_button_inactive');
			try {
				if (window.EKAnalytics && typeof window.EKAnalytics.trackCartChange === 'function') {
					window.EKAnalytics.trackCartChange(obj, amountBefore, amountAfter);
				}
			} catch (analyticsError) {}
		}
	}
}

function address_changed(obj, reload= false) {
	var http_request = new XMLHttpRequest();
	http_request.open('GET',document.location.href+'&address_changed='+obj.value,false);
	http_request.send();
	if(http_request.status==200) {
		var s = http_request.responseText;
		if( s.startsWith('error:') )
		{
			alert(s.replace('error:', ''));
		} else
		{
			console.log('Address changed!');
			if(reload) {
				console.log('Reloading the page');
				// korábbi POST változókat (pl. rendelési cím módosítása gomb cim) itt ne küldje be ismét
				//location.reload();
				location.href = location.pathname + location.search;
			}
		}
	}
}
function resptable_doorder(obj) {
	if(obj.className!='resptable_button') return;
	try {
		if (window.EKAnalytics && typeof window.EKAnalytics.beginCheckoutFromMenu === 'function') {
			window.EKAnalytics.beginCheckoutFromMenu();
		}
	} catch (analyticsError) {}
	jQuery.getJSON( "/index.php?option=com_etlap&task=barion.getCartDataForBarionPixel", function( data ) {
		if ( data.length > 0 )
		{
			for (var x = 0; x < data.length; x++) {
				var addToCartProperties = data[x];
				bp('track', 'addToCart', addToCartProperties);
				console.log(addToCartProperties)
			}

		}  
		document.location.href=document.location.href+'&order';
	});	
//	document.location.href='/index.php/etlapunk?order';
}
function resptable_prevweek(y,w) {
	w--; if(w<1) { w=52; y--; }
	var url=document.location.href.replace(/week=[0-9]+/,'week='+y+(w<10?'0':'')+w);
	document.location.href=url;
}
function resptable_prevweek_new(y,w) {
	var url=document.location.href.replace(/week=[0-9]+/,'week='+y+(w<10?'0':'')+w);
	document.location.href=url;
}
function resptable_nextweek(y,w) {
	w++; if(w>52) { w=1; y++; }
	if(y==2020 && w==1) w=2;
	var url=document.location.href.replace(/week=[0-9]+/,'week='+y+(w<10?'0':'')+w);
	document.location.href=url;
}
function resptable_nextweek_new(y,w) {	
	var url=document.location.href.replace(/week=[0-9]+/,'week='+y+(w<10?'0':'')+w);
	document.location.href=url;
}
function resptable_touchstart(evt) {
	resptable_touchx=evt.changedTouches[0].pageX;
	resptable_touchy=evt.changedTouches[0].pageY;
	return true;
}
function resptable_touchend(evt,i) {	
	var a=resptable_touchx-evt.changedTouches[0].pageX;
	var b=resptable_touchy-evt.changedTouches[0].pageY;
	if(resptable_touchx!=-1 && (a>0?a:-a) > (b>0?b:-b)) {
		if(resptable_touchx-evt.changedTouches[0].pageX<-150)
			resptable_prev(i);
		else if(resptable_touchx-evt.changedTouches[0].pageX>150)
			resptable_next(i);
	}
	resptable_touchx=-1;
	resptable_touchy=-1;
	return true;
}
function resptable_touchcancel(evt) {
	resptable_touchx=-1;
	resptable_touchy=-1;
	return true;
}

function paymode_extrafield(){
	var k=document.getElementById('paymode_select').value;
	if ( k > 0 )
	{
		if ( k == 9 )
		{
			jQuery('#paymode_amount_displayed').attr('max', Math.min( jQuery('#paymode_amount').attr('data-megfizetheto'), jQuery('#paymode_amount').attr('data-ipa') ));
			jQuery('#paymode_amount_displayed').val( Math.min( jQuery('#paymode_amount').attr('data-megfizetheto'), jQuery('#paymode_amount').attr('data-ipa') ) );
		} else
		{
			jQuery('#paymode_amount_displayed').attr('max', jQuery('#paymode_amount').attr('data-megfizetheto') );
			jQuery('#paymode_amount_displayed').val(jQuery('#paymode_amount').attr('data-megfizetheto'));
		}

		var i,o=document.getElementById('paymode_extra'+k);
		var all=document.getElementById('paymode_container').getElementsByTagName('DIV');
		document.getElementById('paymode_selectimg').setAttribute('src','/plugins/content/etlap/paylib/'+k+'.png');
		document.getElementById('paymode_selectimg').setAttribute('style','height:32px !important;');
		for(i=0;i<all.length;i++)
			if(all[i].className=='paymode_extra') all[i].style.display='none';
		if(o!=null) o.style.display='inline';
		document.getElementById('paymode_submit').disabled = k && (k==9 || document.getElementById('paymode_amount_displayed').value>0)?false:true;
		document.getElementById('paymode_submit').value=k==9?"Bevált":"Fizet";
		document.getElementById('paymode_ipa').style.display=k==9?'inline':'none';
	}
}

function resptable_filterbox(t) {
	var btn=document.getElementById('resptable_filterbtn');
	var o=document.getElementById('resptable_filters');
	var o2=document.getElementById('resptable_filtershadow');
	if(o.style.display=='none') {
		btn.setAttribute('style','margin-right:0px;border:2px inset #808080;background:linear-gradient(to bottom, #FFFFFF, #CFCFCF);');
		o.setAttribute('style','display:block;');
		o2.setAttribute('style','display:block;');
		jQuery('#resptable_filters').animate({ scrollTop: (0) }, 'slow');
	} else {
		btn.setAttribute('style','margin-right:0px;border:2px outset #808080;background:linear-gradient(to bottom, #CFCFCF, #FFFFFF);');
		o.setAttribute('style','display:none;');
		o2.setAttribute('style','display:none;');
	}
	resptable_refreshfilter();
	if( jQuery('#filter_enabled').is(':checked') ) {
		jQuery('#dietaszuroTajekoztato').hide();
		jQuery('#filtersbox').show();
	} else {
		jQuery('#dietaszuroTajekoztato').show();
		jQuery('#filtersbox').hide();
	}	
}

(function($){
$(document).ready( function() {
	resptable_recalc();
	resptable_recalc();
	resptable_recalc();
	resptable_recalc();
	resptable_recalc();
	
	jQuery('.etlapkosar').each( function() {
		// if(parseInt(jQuery(this).val())>0) $(this).trigger('change');
		if(parseInt(jQuery(this).val())>0)	cellborder($(this));
	})
	
	const interval = setInterval(function() {
	   resptable_recalc();
	 }, 5000);	
	 
	 jQuery('.etlapkosar-minus').click( function(event) {
		 event.preventDefault();
		 var e = jQuery(this).siblings('input');
		 e.val( Math.max(parseInt(e.val()) - 1, e.attr('min') ) );
		 e.trigger('change');
	 })
	 
	 jQuery('.etlapkosar-plus').click( function(event) {
		 event.preventDefault();
		 var e = jQuery(this).siblings('input');
		 e.val( Math.min(parseInt(e.val()) + 1, e.attr('max') ) );
		 e.trigger('change');
	 })
	
	jQuery('#paymode_amount_displayed').change( function() {
		var amount = parseInt($('#paymode_amount_displayed').val());
		var max = parseInt($('#paymode_amount_displayed').attr('max'));
		// console.log(amount, max, 'KK');
		// if(amount>max) $('#paymode_amount').val( max )	
		if(jQuery('#hetiRendelesOsszeg').length) {
				jQuery('#hetiRendelesOsszeg').html(parseInt( (jQuery('#hetiRendelesOsszeg').attr('data-osszeg') - jQuery('#hetiRendelesOsszeg').attr('data-marfizetett'))-amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")+' Ft');
		}
	})
	$('#megrendelemButtonFinal').click( function() {
		var url = $(this).attr('data-url');
		var adomanyetel = $('#adomanyetel').val();;
		if(!$('#megrendelemCB').is(':checked'))
		{
			alert('AZ ÁSZF ELFOGADÁSA KÖTELEZŐ!');
			return false;
		} else
		{	
			if($('#vajdakiszallitas').length > 0) url += '&napszak='+$('#vajdakiszallitas').val();
			if(adomanyetel > 0) url += '&adomanyetel='+adomanyetel;
			window.location.href = url;			
			$.blockUI({ message: '<h4>Rendelése feldolgozás alatt, köszönjük türelmét</h4>' });
		}
	})	
	
	function kuponOrderMessage(text, ok) {
		var $msg = $('#kupon-order-msg');
		if (!$msg.length) {
			return;
		}
		$msg.show().css('color', ok ? '#46972b' : '#a33').text(text);
	}

	function updateKuponTotals(res) {
		var $totals = $('#kupon-preview-totals');
		if (!$totals.length) {
			return;
		}
		if (!res || !res.ok || typeof res.payable === 'undefined') {
			$totals.hide();
			return;
		}
		var discount = Math.max(0, Number(res.amount) || 0);
		var payable = Math.max(0, Number(res.payable) || 0);
		$('#kupon-preview-discount').text(number_format(discount, 0, ',', ' ') + ' Ft');
		$('#kupon-preview-payable').text(number_format(payable, 0, ',', ' ') + ' Ft');
		$totals.show();
	}

	function checkOrderKupon(code, adomanyetel) {
		return $.ajax({
			method: 'POST',
			url: '/index.php?option=com_etlap&task=etlap.checkkupon',
			dataType: 'json',
			data: {
				code: code,
				week: $('#kupon-order-box').attr('data-week'),
				adomanyetel: adomanyetel || 0
			}
		});
	}

	$('#kupon-order-check').click(function() {
		var code = $.trim($('#kupon-order-code').val());
		if (!code) {
			kuponOrderMessage('Adja meg a kuponkódot.', false);
			return false;
		}
		checkOrderKupon(code, $('#adomanyetel').val()).done(function(res) {
			if (res && res.ok) {
				kuponOrderMessage(res.message, true);
				updateKuponTotals(res);
			} else {
				kuponOrderMessage((res && res.message) ? res.message : 'A kupon nem érvényes.', false);
				updateKuponTotals(null);
			}
		}).fail(function() {
			kuponOrderMessage('A kupon ellenőrzése nem sikerült. Próbálja újra.', false);
			updateKuponTotals(null);
		});
		return false;
	});

	var initialKuponCode = $.trim($('#kupon-order-code').val());
	if (initialKuponCode) {
		$('#kupon-order-check').trigger('click');
	}

	$('#megrendelemButtonFinalKP,#megrendelemButtonFinalOnline').click( function() {
		var url = $(this).attr('data-url');
		var adomanyetel = $('#adomanyetel').val();;
		if(!$('#megrendelemCB2').is(':checked'))
		{
			alert('AZ ÁSZF ELFOGADÁSA KÖTELEZŐ!');
			return false;
		}
		if($('#vajdakiszallitas').length > 0) url += '&napszak='+$('#vajdakiszallitas').val();
		if(adomanyetel > 0) url += '&adomanyetel='+adomanyetel;
		var code = $('#kupon-order-code').length ? $.trim($('#kupon-order-code').val()) : '';
		if (code) {
			$.blockUI({ message: '<h4>Kupon ellenőrzése</h4>' });
			checkOrderKupon(code, adomanyetel).done(function(res) {
				if (!res || !res.ok) {
					$.unblockUI();
					kuponOrderMessage((res && res.message) ? res.message : 'A kupon nem érvényes.', false);
					alert((res && res.message) ? res.message : 'A kupon nem érvényes.');
					return;
				}
				url += '&kupon_code=' + encodeURIComponent(res.code);
				window.location.href = url;
				$.blockUI({ message: '<h4>Rendelése feldolgozás alatt, köszönjük türelmét</h4>' });
			}).fail(function() {
				$.unblockUI();
				kuponOrderMessage('A kupon ellenőrzése nem sikerült. Próbálja újra.', false);
				alert('A kupon ellenőrzése nem sikerült. Próbálja újra.');
			});
			return false;
		}
		window.location.href = url;
		$.blockUI({ message: '<h4>Rendelése feldolgozás alatt, köszönjük türelmét</h4>' });
		return false;
	})
	
	$('#lemondomButtonFinal').click( function() {
		
		$.blockUI({ message: '<h4>Rendelésének lemondása feldolgozás alatt, köszönjük türelmét</h4>' });
	})
	
	$('#paymode_select').change( function() {
		$('#paymode_infotext').html('');
		if($(this).val()==2) {
			var newDiv = $(document.createElement('div')); 
			newDiv.html('<center>Bankkártyás fizetési partnerünk a Six Payment Services, amely az MKB Bank szerződött partnere.<br />A fizetés a https://saferpay.com megbízható, magas szintű titkosítással és megfelelő tanúsítványokkal rendelkező oldalon történik!<br /><strong>Figyelem! Felhívjuk kedves visszatérő ügyfeleink figyelmét, hogy a fizetési felület arculatában változások történtek, ám ez a működést nem befolyásolja, a bankkártyás fizetés továbbra is az eddig megszokott magas biztonsági szintű csatornán keresztül zajlik!</strong></center>');
			/*newDiv.dialog(
				{
					title: "Bankkártyás fizetési tájékoztató",
					maxWidth: 800,
					minWidth: 500,
					modal: true,
				buttons : {
					Ok: function() {
						$(this).dialog("close"); //closing on Ok click
					}
				},
			});*/
			// $('#bankkartyamodal a').trigger('click');
		}
		if($(this).val().length==0) jQuery('#paymode_submit').hide();
		if($(this).val().length>0) jQuery('#paymode_submit').show();
	})
	
	$('#adomanyetel').change( function() {
		var mennyiseg = $(this).val();
		var ar = $(this).attr('data-price');
		$('#adomanyar').html('');
		if(mennyiseg>0)
		{
			$('#adomanyar').html(' ('+(mennyiseg*ar)+' Ft)');
		}
	})
	
	$('.adomanyetel').trigger('change');
	
	$('.mealclose').change( function()
	{
		var mealclose	= $(this).is(':checked') ? 1 : 0;
		var foodid		= $(this).attr('data-foodid');
		$.ajax({
		  method: "POST",
		  url: "/index.php?option=com_etlap&task=etlap.mealclose",
		  data: { foodid: foodid, mealclose: mealclose }
		})
		  .done(function( msg ) {
			
		  });
	})
	
	function storeOpenedBlocks()
	{
		lStorage = window.localStorage;
		var ob = [];
		$('.blokkheader').not('.blokk-closed').each( function()
		{
			var blokk = $(this).attr('data-blokk');
			ob.push(blokk);
		})
		lStorage.setItem("openedBlocks", JSON.stringify(ob));
	}
	
	function setOpenCloseAllButton()
	{
		if ( $('.blokkheader').not('.blokk-closed').length > 0 )
		{
			$('.openAllBlocks').hide();
			$('.closeAllBlocks').show();
		} else {
			$('.openAllBlocks').show();
			$('.closeAllBlocks').hide();			
		}
	}	
	
	lStorage = window.localStorage;
	openedBlocks = lStorage.getItem('openedBlocks');
	var ob = JSON.parse(openedBlocks);
	if(openedBlocks)
	{		
		for(let i = 0; i < ob.length; i++)
		{
			$('.blokkheader[data-blokk="'+ob[i]+'"]').removeClass('blokk-closed');
		}
	
	}
	
	$('.loader').hide();
	$('.resptable-wrap > table > thead').show();
	$('.resptable-wrap > table > tbody').show();

			// storeOpenedBlocks();
		setActiveCells();
		setOpenCloseAllButton();	
	
	$('.openAllBlocks').click( function() {
		$('.blokkheader.blokk-closed').trigger( 'click' );
		$('.openAllBlocks').hide();
		$('.closeAllBlocks').show();
		return false;
	})
	
	$('.closeAllBlocks').click( function() {
		$('.blokkheader').not('.blokk-closed').trigger( 'click' );
		return false;
	})
	
	$('.closeAllBlocks').click( function() {
		$('.blokkheader').not('.blokk-closed').trigger( 'click' );
		return false;
	})
		
	
	$('.blokk-closed').each( function() {
		var blokk = $(this).attr('data-blokk');
		$('.tr-background1[data-blokk="'+blokk+'"]').hide();
	})
	
	$('.blokkheader-desc').each( function() {
		var bc = $(this).prev().css( "background-color" );
		$(this).css('background-color', bc+' !important').css('color','white');
	})
	
	$('.blokkheader td').each( function() {
		// $(this).append('<span style="padding-left:50px">asdasd</span>');
	})
	
	
	$('.blokkheader').css('cursor','pointer').click( function() 
	{
		$(this).find('.triangle').toggleClass("triangle_down1 triangle_up1");
		var blokk = $(this).attr('data-blokk');
		var c = $(this).toggleClass('blokk-closed');
		$('.tr-background1[data-blokk="'+blokk+'"]').toggle('500');
		
		storeOpenedBlocks();
		
		setOpenCloseAllButton();
		
	})
	
	$('.blokkheader').prev('tr').addClass('blokk-last-tr');
	$('.resptable tr:last-child').addClass('blokk-last-tr');
	
	$('.lapozzbalra').click( function() { resptable_prev(0); } );
	$('.lapozzjobbra').click( function() { resptable_next(0); } );
	
	$('#paymode_amount_displayed').blur( function() { $('#paymode_amount_displayed').trigger('change');   });
	$('#paymode_submit').click( function() { $('#paymode_amount_displayed').trigger('change');   });
	
	$('#paymentform').submit( function() {
		if($('#paymode_select').val().length==0)
		{
			var id = jQuery('#my-modal-alert').attr('href')
			jQuery(id).html('Kérjük válassza ki a kívánt Online fizetési módot!');
			jQuery('#my-modal-alert').click();
			return false;
		}
		
		if( parseInt( $('#paymode_amount_displayed').val() ) <= 0)
		{ 
			var id = jQuery('#my-modal-alert').attr('href')
			jQuery(id).html('0 Ft-os fizetés nem indítható!');
			jQuery('#my-modal-alert').click();
			return false;
		}
	})
	
	// $('.blokkheader[data-blokk="1"]').remove();
		$('#paymode_amount_displayed').trigger('change');
	
	$('#paymode_amount_displayed').blur( function() { $('#paymode_amount_displayed').trigger('change');   });

	setOpenCloseAllButton(); 
	
	$('.mealimg').css('cursor','pointer').click( function() {
		console.log($(this).siblings())
		$(this).closest('.cell-wrapper').find('.modal_link').click();
	});	
})
})(jQuery)

function etlapDetailsPickThumb(btn) {
	var gallery = btn.closest('.etlap-details-gallery');
	if (!gallery) {
		return;
	}
	var main = gallery.querySelector('.etlap-details-mainimg');
	if (!main) {
		return;
	}
	main.src = btn.getAttribute('data-full');
	gallery.querySelectorAll('.etlap-details-thumb').forEach(function(b) {
		b.classList.remove('is-active');
	});
	btn.classList.add('is-active');
}

function etlapDetailsUpdateScroll(body) {
	var overflow = body.scrollHeight > body.clientHeight + 2;
	var atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 6;
	body.classList.toggle('is-scrollable', overflow && !atEnd);
}

function etlapDetailsMarkScroll() {
	var body = document.querySelector('#rl_modals_loaded_content .etlap-details-body');
	if (!body) {
		return;
	}
	var update = function() {
		etlapDetailsUpdateScroll(body);
	};
	if (body.getAttribute('data-scrollmark') !== '1') {
		body.setAttribute('data-scrollmark', '1');
		body.addEventListener('scroll', update, { passive: true });
	}
	window.requestAnimationFrame(function() {
		window.requestAnimationFrame(update);
	});
}

if (window.MutationObserver && document.body) {
	new MutationObserver(function() {
		if (document.querySelector('#rl_modals_loaded_content .etlap-details-body')) {
			etlapDetailsMarkScroll();
		}
	}).observe(document.body, { childList: true, subtree: true });
}
