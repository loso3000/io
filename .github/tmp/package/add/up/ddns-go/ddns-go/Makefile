#
# Copyright (C) 2022-2026 sirpdboy <herboy2008@gmail.com>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=ddns-go
PKG_VERSION:=6.16.0
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/jeessy2/ddns-go/tar.gz/v$(PKG_VERSION)?
PKG_HASH:=eb2f8f924e649c71057ef5745ee8f52d27ef72064a2391bf5b90ef51a8ee0293

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=sirpdboy <herboy2008@gmail.com>

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

# UPX Ñ¹ËõÑ¡Ïî
PKG_CONFIG_DEPENDS:= \
	CONFIG_DDNS_GO_COMPRESS_UPX \
	CONFIG_DDNS_GO_UPX_LEVEL

GO_PKG:=github.com/jeessy2/ddns-go/v6
GO_PKG_LDFLAGS:=-w -s
GO_PKG_LDFLAGS_X:=main.Version=$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/ddns-go/config
	config DDNS_GO_COMPRESS_UPX
		bool "Compress ddns-go binary with UPX"
		default y
		help
		  Compress the binary using UPX to reduce package size.
		  This will make the binary smaller but add a small
		  decompression overhead on first execution.
	
	config DDNS_GO_UPX_LEVEL
		string "UPX compression level"
		depends on DDNS_GO_COMPRESS_UPX
		default "--lzma --best"
		help
		  UPX compression options.
		  --lzma --best: Maximum compression (default)
		  --ultra-brute: Extreme compression (very slow)
		  --lzma: Good balance
		  --brute: Slow but good compression
endef

define Package/ddns-go
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=IP Addresses and Names
  TITLE:=Support IPV4 and IPV6 simple and easy-to-use IP binding domain name tool
  URL:=https://github.com/jeessy2/ddns-go
  DEPENDS:=$(GO_ARCH_DEPENDS) +ca-bundle
  USERID:=ddns-go:ddns-go
endef

define Package/ddns-go/description
  A simple and easy-to-use IP binding domain name tool that supports IPV4 and IPV6,
  support Alidns Dnspod Cloudflare Hicloud Callback Baiducloud porkbun GoDaddy Google Domains.
endef

define Build/Compress
	if [ -x "$(GO_PKG_BUILD_BIN_DIR)/ddns-go" ] && [ "$(CONFIG_DDNS_GO_COMPRESS_UPX)" = "y" ]; then \
		case "$(ARCH)" in \
			mips64_*|riscv64_*|loongarch64_*) \
				echo "Skipping UPX for $(ARCH) architecture"; \
				;; \
			*) \
				if command -v upx >/dev/null 2>&1; then \
					echo "Compressing ddns-go with UPX..."; \
					upx $(CONFIG_DDNS_GO_UPX_LEVEL) $(GO_PKG_BUILD_BIN_DIR)/ddns-go 2>/dev/null || \
					upx --lzma --best $(GO_PKG_BUILD_BIN_DIR)/ddns-go 2>/dev/null || \
					echo "UPX compression failed, using uncompressed binary"; \
				else \
					echo "UPX not found, skipping compression"; \
				fi \
				;; \
		esac \
	fi
endef

define Build/InstallDev
	$(call Build/Compress)
endef

define Package/ddns-go/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(GO_PKG_BUILD_BIN_DIR)/ddns-go $(1)/usr/bin/ddns-go
	$(INSTALL_DIR) $(1)/etc/ddns-go
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/ddns-go.init $(1)/etc/init.d/ddns-go
	$(INSTALL_DIR) $(1)/etc/config/
	$(INSTALL_CONF) ./files/ddns-go.conf $(1)/etc/config/ddns-go
endef

define Package/ddns-go/conffiles
/etc/config/ddns-go
/etc/ddns-go/ddns-go-config.yaml
endef

define Package/ddns-go/postinst
#!/bin/sh
if [ -z "$${IPKG_INSTROOT}" ]; then
	echo "ddns-go installed. Binary size:"
	ls -lh /usr/bin/ddns-go 2>/dev/null || true
fi
exit 0
endef

$(eval $(call GoBinPackage,ddns-go))
$(eval $(call BuildPackage,ddns-go))