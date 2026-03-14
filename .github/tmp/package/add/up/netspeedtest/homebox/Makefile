# SPDX-License-Identifier: GPL-3.0-only
# Copyright (c) 2022-2026 sirpdboy herboy2008@gmail.com
#

include $(TOPDIR)/rules.mk

PKG_NAME:=homebox
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

ifeq ($(ARCH),aarch64)
	PKG_ARCH:=arm64
else ifeq ($(ARCH),arm)
	PKG_ARCH:=arm
else ifeq ($(ARCH),i386)
	PKG_ARCH:=386
else ifeq ($(ARCH),x86_64)
	PKG_ARCH:=amd64
endif
PKG_LICENSE:=Proprietary
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=sirpdboy <herboy2008@gmail.com>
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_ARCH)-$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Speed Test
  TITLE:=Home Local Network Speed Test Tool
  URL:=https://github.com/XGHeaven/homebox
  DEPENDS:=@(i386||x86_64||arm||aarch64)
endef

define Package/$(PKG_NAME)/description
  A Toolbox for Home Local Networks Speed Test
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	[ ! -f $(PKG_BUILD_DIR)/homebox-linux-$(PKG_ARCH)-musl-v$(PKG_VERSION).tar.gz ] && wget https://github.com/sirpdboy/homebox/releases/download/v$(PKG_VERSION)/homebox-linux-$(PKG_ARCH)-musl-v$(PKG_VERSION).tar.gz -O $(PKG_BUILD_DIR)/homebox-linux-$(PKG_ARCH)-musl-v$(PKG_VERSION).tar.gz
	tar -xzvf $(PKG_BUILD_DIR)/homebox-linux-$(PKG_ARCH)-musl-v$(PKG_VERSION).tar.gz -C $(PKG_BUILD_DIR)
	[ -f $(PKG_BUILD_DIR)/homebox ] || exit 1
	chmod +x $(PKG_BUILD_DIR)/homebox
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/homebox $(1)/usr/bin/homebox
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
