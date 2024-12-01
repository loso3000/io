#!/bin/bash
#=================================================
# File name: preset-terminal-tools.sh
# System Required: Linux
# Version: 1.0
# Lisence: MIT
# Author: SuLingGG
# Blog: https://mlapp.cn
#=================================================

mkdir -p files/root
cp  -rf ./patch/z.zshrc ./files/root/.zshrc
pushd files/root

## Install oh-my-zsh
# Clone oh-my-zsh repository
git clone https://github.com/ohmyzsh/ohmyzsh ./.oh-my-zsh

# git clone https://github.com/robbyrussell/oh-my-zsh ./.oh-my-zsh
# Install extra plugins
git clone https://github.com/zsh-users/zsh-autosuggestions ./.oh-my-zsh/custom/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ./.oh-my-zsh/custom/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-completions ./.oh-my-zsh/custom/plugins/zsh-completions
popd

## opkg ##
PLATFORM=$(cat .config | grep CONFIG_TARGET_ARCH_PACKAGES | awk -F '"' '{print $2}')
TARGET=$(cat .config | grep CONFIG_TARGET_BOARD | awk -F '"' '{print $2}')
SUBTARGET=$(cat .config | grep CONFIG_TARGET_SUBTARGET | awk -F '"' '{print $2}')

mkdir -p files/etc/opkg
pushd files/etc/opkg
cat <<-EOF > "distfeeds.conf"
src/gz openwrt_core https://mirrors.cloud.tencent.com/snapshots/targets/$TARGET/$SUBTARGET/packages
src/gz openwrt_base https://mirrors.cloud.tencent.com/snapshots/packages/$PLATFORM/base
src/gz openwrt_luci https://mirrors.cloud.tencent.com/snapshots/packages/$PLATFORM/luci
src/gz openwrt_packages https://mirrors.cloud.tencent.com/snapshots/packages/$PLATFORM/packages
src/gz openwrt_routing https://mirrors.cloud.tencent.com/snapshots/packages/$PLATFORM/routing
src/gz openwrt_telephony https://mirrors.cloud.tencent.com/snapshots/packages/$PLATFORM/telephony
EOF
popd
