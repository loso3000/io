#!/bin/bash
# scripts/lib/iso.sh
# ISO构建和验证

# 构建ISO
build_iso() {
    print_step "构建ISO镜像"
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local iso_name="${ISO_PREFIX}-${timestamp}.iso"
    local iso_path="$OUTPUT_DIR/$iso_name"
    
    cd "$ISO_ROOT"
    
    log_info "开始构建ISO..."
    log_debug "源目录: $ISO_ROOT"
    log_debug "输出文件: $iso_path"
    
    # 构建ISO（单行命令避免解析问题）
    xorriso -as mkisofs \
        -iso-level 3 \
        -volid "MINIMAL_LIVE" \
        -rock \
        -joliet \
        -b boot/grub/boot.img \
        -no-emul-boot \
        -boot-load-size 4 \
        -boot-info-table \
        -eltorito-alt-boot \
        -e efi/boot/bootx64.efi \
        -no-emul-boot \
        -o "$iso_path" \
        .
    
    if [ -f "$iso_path" ]; then
        log_info "ISO构建成功: $iso_name"
        echo "  大小: $(du -h "$iso_path" | cut -f1)"
        echo "  路径: $iso_path"
    else
        log_error "ISO构建失败"
        exit 1
    fi
    
    # 保存最新ISO的路径
    LATEST_ISO="$iso_path"
}

# 验证ISO
verify_iso() {
    print_step "验证ISO文件"
    
    if [ -z "$LATEST_ISO" ] || [ ! -f "$LATEST_ISO" ]; then
        log_error "找不到ISO文件进行验证"
        return 1
    fi
    
    log_info "验证文件: $(basename "$LATEST_ISO")"
    
    # 检查文件类型
    echo ""
    echo "=== ISO基本信息 ==="
    file "$LATEST_ISO"
    
    # 检查引导记录
    echo ""
    echo "=== 引导记录 ==="
    xorriso -indev "$LATEST_ISO" -toc 2>&1 | grep -i -E "(boot|eltorito|efi|system area)" || true
    
    # 检查关键文件
    echo ""
    echo "=== 关键文件检查 ==="
    local check_files=(
        "/boot/grub/boot.img"
        "/efi/boot/bootx64.efi"
        "/kernel/vmlinuz"
        "/kernel/initrd.img"
    )
    
    for file in "${check_files[@]}"; do
        if xorriso -indev "$LATEST_ISO" -find "$file" 2>&1 | grep -q "$file"; then
            echo "  ✓ $file"
        else
            echo "  ✗ $file (缺失)"
        fi
    done
    
    log_info "ISO验证完成"
}

# 清理构建文件
cleanup_build() {
    print_step "清理构建文件"
    
    if [ "${KEEP_BUILD:-false}" != "true" ]; then
        clean_dir "$BUILD_DIR"
        log_info "构建目录已清理"
    else
        log_info "保留构建目录: $BUILD_DIR"
    fi
}
