#!/bin/bash
# scripts/lib/boot.sh
# 引导系统配置

# 准备引导文件
prepare_boot_files() {
    print_step "准备引导文件"
    
    prepare_grub_config
    prepare_bios_boot
    prepare_efi_boot
    
    log_info "引导文件准备完成"
}

# 准备GRUB配置
prepare_grub_config() {
    print_step "配置GRUB引导"
    
    local grub_dir="$ISO_ROOT/boot/grub"
    local efi_grub_dir="$ISO_ROOT/efi/boot/grub"
    
    ensure_dir "$efi_grub_dir"
    
    # 创建GRUB配置文件
    cat > "$grub_dir/grub.cfg" << 'EOF'
# Minimal Live ISO - GRUB Configuration
set timeout=5
set default=0

# 加载必要模块
insmod iso9660
insmod linux
insmod normal

menuentry "Minimal Live Shell" {
    echo "Loading kernel..."
    linux /kernel/vmlinuz console=ttyS0 console=tty0 init=/init
    echo "Loading initrd..."
    initrd /kernel/initrd.img
}
EOF
    
    # 复制到EFI目录
    cp "$grub_dir/grub.cfg" "$efi_grub_dir/"
    
    log_info "GRUB配置创建完成"
}

# 准备BIOS引导
prepare_bios_boot() {
    print_step "准备BIOS引导"
    
    local grub_dir="$ISO_ROOT/boot/grub"
    
    # 复制BIOS引导镜像
    if [ -f /usr/lib/grub/i386-pc/boot.img ]; then
        cp /usr/lib/grub/i386-pc/boot.img "$grub_dir/"
        log_info "BIOS引导镜像已复制"
    else
        log_error "找不到BIOS引导镜像: /usr/lib/grub/i386-pc/boot.img"
        exit 1
    fi
}

# 准备EFI引导
prepare_efi_boot() {
    print_step "准备UEFI引导"
    
    local efi_dir="$ISO_ROOT/efi/boot"
    
    # 查找EFI引导文件
    local efi_sources=(
        "/usr/lib/grub/x86_64-efi-signed/grubnetx64.efi.signed"
        "/usr/lib/grub/x86_64-efi/monolithic/grub.efi"
    )
    
    local efi_found=false
    
    for source in "${efi_sources[@]}"; do
        if [ -f "$source" ]; then
            cp "$source" "$efi_dir/bootx64.efi"
            log_info "UEFI引导文件已复制: $source"
            efi_found=true
            break
        fi
    done
    
    if [ "$efi_found" = false ]; then
        log_warn "未找到预编译的EFI文件，尝试生成..."
        
        if command_exists grub-mkimage; then
            grub-mkimage -p /efi/boot -O x86_64-efi -o "$efi_dir/bootx64.efi" \
                iso9660 fat ext2 linux normal boot
            
            if [ -f "$efi_dir/bootx64.efi" ]; then
                log_info "UEFI引导文件已生成"
            else
                log_error "UEFI引导文件生成失败"
                exit 1
            fi
        else
            log_error "无法生成EFI引导文件"
            exit 1
        fi
    fi
}
