# SPDX-License-Identifier: GPL-3.0-only
# Copyright (c) 2020-2026 sirpdboy herboy2008@gmail.com
#

include $(TOPDIR)/rules.mk

PKG_NAME:=homebox
PKG_VERSION:=0.1.2
PKG_RELEASE:=1
ifeq ($(ARCH),aarch64)
	H_ARCH:=arm64
else ifeq ($(ARCH),arm)
	H_ARCH:=arm
else ifeq ($(ARCH),i386)
	H_ARCH:=386
else ifeq ($(ARCH),x86_64)
	H_ARCH:=amd64
else
	$(error Unsupported architecture: $(ARCH))
endif

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=net
  CATEGORY:=Network
  TITLE:=A Toolbox for Home Local Networks Speed Test
  URL:=https://github.com/sirpdboy/homebox
  DEPENDS:=
endef

define Package/$(PKG_NAME)/description
  A Toolbox for Home Local Networks Speed Test
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	DOWNLOAD_URL="https://github.com/sirpdboy/homebox/releases/download/v$(PKG_VERSION)/homebox-linux-$(H_ARCH)-musl.tar.gz"
	TARGET_FILE="$(PKG_BUILD_DIR)/homebox-linux-$(H_ARCH)-musl.tar.gz"
	BINARY_NAME="homebox-linux-$(H_ARCH)-musl"
	[ ! -f $(PKG_BUILD_DIR)/homebox-linux-$(H_ARCH)-musl.tar.gz ] && wget https://github.com/sirpdboy/homebox/releases/download/v$(PKG_VERSION)/homebox-linux-$(H_ARCH)-musl.tar.gz -O $(PKG_BUILD_DIR)/homebox-linux-$(H_ARCH)-musl.tar.gz

	tar -xzvf $(PKG_BUILD_DIR)/homebox-linux-$(H_ARCH)-musl.tar.gz -C $(PKG_BUILD_DIR) || exit 1
endef

define Build/Compile
	@echo "Using pre-compiled binary"
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/homebox-linux-$(H_ARCH)-musl $(1)/usr/bin/homebox
	
endef


$(eval $(call BuildPackage,$(PKG_NAME)))
