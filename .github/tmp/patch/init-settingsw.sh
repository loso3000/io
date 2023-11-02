#!/bin/bash

# sed -i 's/string ListenIP.*/string ListenIP 0.0.0.0/g' /usr/libexec/softethervpn/vpn_server.config
uci -q set fstab.@global[0].check_fs=1

ifname=$(uci -q get network.lan.ifname ) 
[ "x$ifname" = "x" ] && ifname="device" || ifname="ifname" 
[ -n "$wan_interface" ] || wan_interface=$(uci -q get network.wan.$ifname 2>/dev/null) 
a=$(ip address | awk -F ': ' '/eth[0-9]+/ {print $2}' )
b=$(echo "$a" | wc -l)
[ ${b} -gt 1 ] && {
	  lannet=""
	  for i in $(seq 1 $b) ; do [ "${wan_interface}" = "$(echo "$a" | sed -n ${i}p)" ] || lannet="${lannet} $(echo "$a" | sed -n ${i}p)" ;done
 	  [ "x$ifname" = "xdevice" ] &&  uci -q set network.@$ifname[0].ports="${lannet}"  || uci -q set network.lan.$ifname="${lannet}"
}
uci -q set network.wan.$ifname="${wan_interface}"
uci -q set network.wan6.$ifname="${wan_interface}"

uci commit network
uci commit fstab
uci set luci.main.mediaurlbase='/luci-static/kucat'
uci commit luci
uci set dhcp.@dnsmasq[0].port='53'
uci commit dhcp
sed -i '/coremark/d' /etc/crontabs/root
mv /etc/seccomp/umdns.json /etc/seccomp/umdns.1json
/etc/init.d/umdns restart
# sed -i "s/releases\/18.06.9/snapshots/g" /etc/opkg/distfeeds.conf
# ipv6
# sed -i 's/^[^#].*option ula/#&/' /etc/config/network
ntpd -n -q -p 1.lede.pool.ntp.org
exit 0
