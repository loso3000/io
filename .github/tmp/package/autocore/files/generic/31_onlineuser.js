'use strict';
'require baseclass';
'require rpc';

var callOnlineUsers = rpc.declare({
        object: 'luci',
        method: 'getOnlineUsers'
});
var callOnlineUserlist = rpc.declare({
        object: 'luci',
        method: 'getOnlineUserlist'
});



return baseclass.extend({
	title: _('Online Users'),
	load: function() {
		return Promise.all([
			L.resolveDefault(callOnlineUserlist(), {}),
			L.resolveDefault(callOnlineUsers(), {})
		]);
	},

	render: function(data) {
        if (!data || data.length === 0) return;
		var onlineuserlist = Array.isArray(data[0]) ? data[0] : [],
		    onlineusers  = Array.isArray(data[1]) ? data[1] : [];

		var fields = [
			_('Online Users'), onlineusers ? onlineusers.onlineusers : null
		];

		var usestatus = E('table', { 'class': 'table' });
		if (fields[0] == _('Online Users')) {
				usestatus.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [ fields[0] ]),
					E('td', { 'class': 'td left' }, [
						(fields[1] != null) ? fields[1] : '0'
					])
				]));
			} 

		var table = E('table', { 'class': 'table' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th', 'width': '20%' }, _('Hostname')),
				E('th', { 'class': 'th' , 'width': '40%'}, _('IP Address')),
				E('th', { 'class': 'th', 'width': 'auto' }, _('MAC address')),
				E('th', { 'class': 'th' , 'width': 'auto' }, _('Interface'))
			])
		]);
		cbi_update_table(table, onlineuserlist.map(function(info) {
			var host_name;
			if (info.hostname == "")
				host_name = _('-');
			else 
				host_name = info.hostname;
			return [
				host_name,
				info.ipaddr,
				info.macaddr,
				info.device
			];
		}));
		return E([
			table,
			usestatus
		]);
    }
  });