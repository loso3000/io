#!/bin/bash
# scripts/build-live-iso.sh
# 主构建脚本 - 调度器

set -e

# 导入库函数
source "$(dirname "$0")/lib/utils.sh"
source "$(dirname "$0")/lib/setup.sh"
source "$(dirname "$0")/lib/boot.sh"
source "$(dirname "$0")/lib/iso.sh"

# 默认配置
BUILD_DIR="${BUILD_DIR:-$(pwd)/build}"
OUTPUT_DIR="${OUTPUT_DIR:-$(pwd)/output}"
ISO_PREFIX="minimal-live"

main() {
    print_header "开始构建最小化Live ISO"
    
    # 初始化环境
    check_dependencies
    setup_directories
    
    # 准备文件
    download_kernel
    create_rootfs
    prepare_boot_files
    
    # 构建ISO
    build_iso
    
    # 验证结果
    verify_iso
    
    print_success "构建完成！"
}

# 运行主函数
main "$@"
