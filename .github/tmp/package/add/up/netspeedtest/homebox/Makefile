# SPDX-License-Identifier: GPL-3.0-only
# Copyright (c) 2022-2026 sirpdboy herboy2008@gmail.com
#

include $(TOPDIR)/rules.mk

PKG_NAME:=homebox
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

ifeq ($(ARCH),aarch64)
	PKG_ARCH_LINUX:=linux-arm64-musl
else ifeq ($(ARCH),arm)
	PKG_ARCH_LINUX:=linux-armv7-musl
else ifeq ($(ARCH),i386)
	PKG_ARCH_LINUX:=linux-386-musl
else ifeq ($(ARCH),x86_64)
	PKG_ARCH_LINUX:=linux-amd64-musl
endif

PKG_SOURCE:=homebox-$(PKG_ARCH_LINUX)-v$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/sirpdboy/homebox/releases/download/v$(PKG_VERSION)/
include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Home Local Network Speed Test Tool
  URL:=https://github.com/XGHeaven/homebox
  DEPENDS:=@(i386||x86_64||arm||aarch64)
  MAINTAINER:=sirpdboy <herboy2008@gmail.com>
endef

define Package/$(PKG_NAME)/description
  A Toolbox for Home Local Networks Speed Test
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	[ ! -f $(PKG_BUILD_DIR)/$(PKG_SOURCE) ] && wget $(PKG_SOURCE_URL)/v$(PKG_REAL_VER)/$(PKG_SOURCE) -O $(PKG_BUILD_DIR)/$(PKG_SOURCE)
	tar -xzvf $(PKG_BUILD_DIR)/$(PKG_SOURCE) -C $(PKG_BUILD_DIR)
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/$(PKG_NAME) $(1)/usr/bin/homebox
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
