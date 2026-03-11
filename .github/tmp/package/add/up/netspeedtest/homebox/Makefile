# SPDX-License-Identifier: GPL-3.0-only
# Copyright (c) 2020-2024 sirpdboy herboy2008@gmail.com
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
	TARGET_FILE="$(PKG_BUILD_DIR)/server-linux-$(H_ARCH).tar.gz"
	
	if [ ! -f "$$TARGET_FILE" ]; then \
		echo "Downloading from $$DOWNLOAD_URL"; \
		wget --timeout=30 \
		     --tries=3 \
		     --retry-connrefused \
		     --secure-protocol=TLSv1_2 \
		     -O "$$TARGET_FILE.tmp" \
		     "$$DOWNLOAD_URL" || { \
			echo "Download failed!"; \
			rm -f "$$TARGET_FILE.tmp"; \
			exit 1; \
		}; \
		if [ ! -s "$$TARGET_FILE.tmp" ] || [ $$(stat -c%s "$$TARGET_FILE.tmp" 2>/dev/null || stat -f%z "$$TARGET_FILE.tmp" 2>/dev/null) -lt 1024 ]; then \
			echo "Downloaded file is too small or empty!"; \
			rm -f "$$TARGET_FILE.tmp"; \
			exit 1; \
		fi; \
		if ! gzip -t "$$TARGET_FILE.tmp" 2>/dev/null; then \
			echo "Downloaded file is not a valid gzip archive!"; \
			rm -f "$$TARGET_FILE.tmp"; \
			exit 1; \
		fi; \
		mv "$$TARGET_FILE.tmp" "$$TARGET_FILE"; \
		echo "Download successful"; \
	else \
		echo "Using existing file: $$TARGET_FILE"; \
	fi
	echo "Extracting $$TARGET_FILE"
	if ! tar -xzvf "$$TARGET_FILE" -C $(PKG_BUILD_DIR); then \
		echo "Extraction failed!"; \
		exit 1; \
	fi
	if [ ! -f "$(PKG_BUILD_DIR)/server-linux-$(H_ARCH)" ]; then \
		echo "Error: Binary file not found after extraction"; \
		echo "Contents of $(PKG_BUILD_DIR):"; \
		ls -la $(PKG_BUILD_DIR); \
		exit 1; \
	fi
	
	chmod 755 $(PKG_BUILD_DIR)/server-linux-$(H_ARCH)

	file $(PKG_BUILD_DIR)/server-linux-$(H_ARCH) || true
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/bin
	
	if [ ! -f $(PKG_BUILD_DIR)/server-linux-$(H_ARCH) ]; then \
		echo "Error: Binary file not found at $(PKG_BUILD_DIR)/server-linux-$(H_ARCH)"; \
		exit 1; \
	fi
	
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/server-linux-$(H_ARCH) $(1)/usr/bin/homebox
	
	if [ -f $(1)/usr/bin/homebox ]; then \
		echo "homebox installed successfully to $(1)/usr/bin/homebox"; \
		ls -la $(1)/usr/bin/homebox; \
		file $(1)/usr/bin/homebox || true; \
	else \
		echo "ERROR: homebox installation failed!"; \
		exit 1; \
	fi
endef

define Package/$(PKG_NAME)/cleanup
	rm -rf $(PKG_BUILD_DIR)
	@echo "Cleaned up $(PKG_BUILD_DIR)"
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
