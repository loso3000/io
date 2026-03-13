# SPDX-License-Identifier: GPL-3.0-only
# Copyright (c) 2022-2026 sirpdboy herboy2008@gmail.com
#

include $(TOPDIR)/rules.mk

PKG_NAME:=homebox
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_SOURCE_URL:=https://github.com/sirpdboy/homebox
PKG_SOURCE_PROTO:=https

# x86_64, i386, arm_cortex-a9, aarch64_cortex-a53, mipsel_24kc, etc.
ifeq ($(ARCH),aarch64)
  #  aarch64_cortex-a53, aarch64_cortex-a72 
  PKG_ARCH_LINUX:=linux-arm64-musl
  PKG_HASH:=2fbf023958eda40c9a8d07b19fda0ef49917a936daedc2099f89eef34a73a068
else ifeq ($(ARCH),arm)
  # arm_cortex-a9, arm_cortex-a7, arm_cortex-a15
  PKG_ARCH_LINUX:=linux-armv7-musl
  PKG_HASH:=e27142e425521ddb6a9e9dd4ec049937d58d06204a3d9620cee9a2f0775d42d8
else ifeq ($(ARCH),i386)
  PKG_ARCH_LINUX:=linux-386-musl
  PKG_HASH:=27cbc2ae8dcd37f4d4220606ec1b68420a71220c23d8a0453a8dd00117007c40
else ifeq ($(ARCH),x86_64)
  PKG_ARCH_LINUX:=linux-amd64-musl
  PKG_HASH:=42a1fce75b1c4bfcba82b877447287f97a74332c1f39a07715f0c7ac4b1fcaf1

else
  $(error Unsupported architecture: $(ARCH))
endif

PKG_SOURCE:=homebox-$(PKG_ARCH_LINUX)-v$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/sirpdboy/homebox/releases/download/v$(PKG_VERSION)/

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Speed Test
  TITLE:=Home Local Network Speed Test Tool
  URL:=https://github.com/XGHeaven/homebox
  DEPENDS:=@(i386||x86_64||arm||aarch64)
  MAINTAINER:=sirpdboy <herboy2008@gmail.com>
  PKGARCH:=$(PKG_ARCH_LINUX)
endef

define Package/$(PKG_NAME)/description
  A toolbox for home local network speed test.
  Features:
  - Download/Upload speed test
  - Ping latency test
  - Multiple concurrent connections
  - Web-based UI
endef


define Download/$(PKG_NAME)
  URL:=$(PKG_SOURCE_URL)
  URL_FILE:=$(PKG_SOURCE)
  FILE:=$(PKG_SOURCE)
  HASH:=$(PKG_HASH)
endef

define Build/Prepare
	$(call Download,$(PKG_NAME))
	$(TAR) -xzf $(DL_DIR)/$(PKG_SOURCE) -C $(PKG_BUILD_DIR)
	mv $(PKG_BUILD_DIR)/homebox $(PKG_BUILD_DIR)/$(PKG_NAME)
	chmod +x $(PKG_BUILD_DIR)/$(PKG_NAME)
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/$(PKG_NAME) $(1)/usr/bin/homebox
endef

$(eval $(call BuildPackage,$(PKG_NAME)))