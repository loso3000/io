#!/bin/bash
# scripts/lib/setup.sh
# 环境设置和依赖检查

# 依赖列表
REQUIRED_DEPS=(
    "xorriso"
    "grub-mkimage"
    "mkfs.vfat"
    "wget"
)

# 检查依赖
check_dependencies() {
    print_step "检查系统依赖"
    
    local missing_deps=()
    
    for dep in "${REQUIRED_DEPS[@]}"; do
        if ! command_exists "$dep"; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "缺少以下依赖:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        exit 1
    fi
    
    log_info "所有依赖已安装"
}

# 设置目录结构
setup_directories() {
    print_step "设置构建目录"
    
    # 清理并创建目录
    clean_dir "$BUILD_DIR"
    ensure_dir "$BUILD_DIR"
    
    # 创建ISO目录结构
    ISO_ROOT="$BUILD_DIR/iso_root"
    ensure_dir "$ISO_ROOT/boot/grub"
    ensure_dir "$ISO_ROOT/efi/boot"
    ensure_dir "$ISO_ROOT/kernel"
    ensure_dir "$ISO_ROOT/live/filesystem"
    
    # 确保输出目录存在
    ensure_dir "$OUTPUT_DIR"
    
    log_info "构建目录: $BUILD_DIR"
    log_info "输出目录: $OUTPUT_DIR"
}

# 下载内核
download_kernel() {
    print_step "下载内核文件"
    
    local kernel_dir="$ISO_ROOT/kernel"
    
    # 内核URL（Alpine Linux）
    local kernel_url="https://dl-cdn.alpinelinux.org/alpine/v3.18/releases/x86_64/boot/vmlinuz-lts"
    local initrd_url="https://dl-cdn.alpinelinux.org/alpine/v3.18/releases/x86_64/boot/initramfs-lts"
    
    # 下载内核
    if ! download_file "$kernel_url" "$kernel_dir/vmlinuz"; then
        log_error "内核下载失败"
        exit 1
    fi
    
    # 下载initrd
    if ! download_file "$initrd_url" "$kernel_dir/initrd.img"; then
        log_error "initrd下载失败"
        exit 1
    fi
    
    log_info "内核文件下载完成"
    echo "  vmlinuz:    $(du -h "$kernel_dir/vmlinuz" | cut -f1)"
    echo "  initrd.img: $(du -h "$kernel_dir/initrd.img" | cut -f1)"
}

# 创建根文件系统
create_rootfs() {
    print_step "创建根文件系统"
    
    local rootfs_dir="$ISO_ROOT/live/filesystem"
    
    # 下载静态busybox
    local busybox_url="https://www.busybox.net/downloads/binaries/1.35.0-x86_64-linux-musl/busybox"
    
    if ! download_file "$busybox_url" "$rootfs_dir/busybox"; then
        log_error "busybox下载失败"
        exit 1
    fi
    
    chmod +x "$rootfs_dir/busybox"
    
    # 创建init脚本
    cat > "$rootfs_dir/init" << 'EOF'
#!/bin/busybox sh

# 挂载必要的文件系统
/bin/busybox mount -t proc proc /proc
/bin/busybox mount -t sysfs sysfs /sys
/bin/busybox mount -t devtmpfs devtmpfs /dev

# 启动信息
/bin/busybox echo ""
/bin/busybox echo "========================================"
/bin/busybox echo "  Minimal Live ISO"
/bin/busybox echo "  Successfully Booted!"
/bin/busybox echo "========================================"
/bin/busybox echo ""

# 启动shell
exec /bin/busybox sh
EOF
    
    chmod +x "$rootfs_dir/init"
    
    # 创建符号链接
    cd "$rootfs_dir"
    for cmd in sh ls cat echo mount ps pwd cd mkdir rmdir rm cp mv ln clear; do
        ln -sf busybox "$cmd" 2>/dev/null || true
    done
    
    log_info "根文件系统创建完成"
}
