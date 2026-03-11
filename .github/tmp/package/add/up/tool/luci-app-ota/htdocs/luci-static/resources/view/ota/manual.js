/*
 *  Copyright (C) 2019-2026 author sirpdboy herboy2008@gmail.com
 *  
 *  Licensed to the public under the Apache License 2.0
 */

'use strict';

'require view';
'require form';
'require rpc';
'require fs';
'require ui';
'require dom';

// RPC 声明
var callManualDoFlash = rpc.declare({
    object: 'ota',
    method: 'manual_do_flash',
    params: ['keep', 'expsize', 'bopkg', 'filepath']
});

var callFlashProgress = rpc.declare({
    object: 'ota',
    method: 'flash_progress'
});

var callGetTargetIP = rpc.declare({
    object: 'ota',
    method: 'get_target_ip',
    params: ['keep', 'expsize']
});

var callSystemValidateFirmwareImage = rpc.declare({
    object: 'system',
    method: 'validate_firmware_image',
    params: ['path'],
    expect: { '': { valid: false, forcable: true } }
});

// 获取存储大小
function findStorageSize(procmtd, procpart) {
    var kernsize = 0, rootsize = 0, wholesize = 0;

    procmtd.split(/\n/).forEach(function(ln) {
        var match = ln.match(/^mtd\d+: ([0-9a-f]+) [0-9a-f]+ "(.+)"$/),
            size = match ? parseInt(match[1], 16) : 0;

        switch (match ? match[2] : '') {
        case 'linux':
        case 'firmware':
            if (size > wholesize)
                wholesize = size;
            break;

        case 'kernel':
        case 'kernel0':
            kernsize = size;
            break;

        case 'rootfs':
        case 'rootfs0':
        case 'ubi':
        case 'ubi0':
            rootsize = size;
            break;
        }
    });

    if (wholesize > 0)
        return wholesize;
    else if (kernsize > 0 && rootsize > kernsize)
        return kernsize + rootsize;

    procpart.split(/\n/).forEach(function(ln) {
        var match = ln.match(/^\s*\d+\s+\d+\s+(\d+)\s+(\S+)$/);
        if (match) {
            var size = parseInt(match[1], 10);

            if (!match[2].match(/\d/) && size > 2048 && wholesize == 0)
                wholesize = size * 1024;
        }
    });

    return wholesize;
}

var mapdata = { actions: {} };

return view.extend({
    load: function() {
        return Promise.all([
            fs.trimmed('/proc/mtd'),
            fs.trimmed('/proc/partitions'),
            fs.trimmed('/proc/mounts')
        ]);
    },

render: function(data) {
    var procmtd = data[0] || '';
    var procpart = data[1] || '';
    var procmounts = data[2] || '';
    
    var has_rootfs_data = (procmtd.match(/"rootfs_data"/) != null) || (procmounts.match("overlayfs:\/overlay \/ ") != null);
    var storage_size = findStorageSize(procmtd, procpart);
    
    var m, s, o;

    m = new form.JSONMap(mapdata, _('Manual Expansion Upgrade'));
    m.tabbed = true;
    m.readonly = !L.hasViewPermission();

        s = m.section(form.NamedSection, 'actions', _('Upgrade Operations'));

    o = s.option(form.SectionValue, 'actions', form.NamedSection, 'actions', 'actions', _('Flash new firmware image'), 
        _('Upload firmware image here to replace the running firmware.<br /> If expanding or upgrading, please first expand the partition to 4G or more, and then choose DD expansion or upgrading.<br /> Note that expansion or upgrading cannot retain the configuration.'));
    
    var ss = o.subsection;

    o = ss.option(form.Button, 'sysupgrade', _('Image'));
    o.inputstyle = 'action important';
    o.inputtitle = _('Flash image...');
    o.onclick = L.bind(this.handleSysupgrade, this, storage_size, has_rootfs_data);

    return m.render();
    },


    handleSysupgrade: function(storage_size, has_rootfs_data, ev) {
        var self = this;
        
        return ui.uploadFile('/tmp/firmware.img', ev.target)
            .then(L.bind(function(btn, reply) {
                btn.firstChild.data = _('Checking image…');

                ui.showModal(_('Checking image…'), [
                    E('span', { 'class': 'spinning' }, _('Verifying the uploaded image file.'))
                ]);

                return callSystemValidateFirmwareImage('/tmp/firmware.img')
                    .then(function(res) { return [ reply, res ]; });
            }, this, ev.target))
            .then(L.bind(function(btn, reply) {
                return fs.stat('/tmp/firmware.img')
                    .then(function(stat) {
                        reply.push(stat);
                        return reply;
                    });
            }, this, ev.target))
            .then(L.bind(function(btn, res) {
                /* 刷机选项表 [0]:checkbox元素 [1]:条件 [2]:传递给manual_do_flash的参数 */
                var opts = {
                    keep : [ E('input', { type: 'checkbox' }), false, 'keep' ],
                    bopkg : [ E('input', { type: 'checkbox' }), false, 'bopkg' ]
                };
  
                
                var is_valid = res[1].valid;
                var is_forceable = res[1].forceable;
                var allow_backup = res[1].allow_backup;
                var is_too_big = (storage_size > 0 && res[2].size > storage_size);
                var body = [];

                body.push(E('p', _("The flash image was uploaded. Below is the checksum and file size listed, compare them with the original file to ensure data integrity. <br /> Click 'Continue' below to start the flash procedure.")));
            
            var infoList = E('ul', { 'class': 'cbi-section' }, [
                res[2].size ? E('li', {}, '%s: %s'.format(_('Size'), self.formatFileSize(res[2].size))) : '',
                res[0].checksum ? E('li', {}, '%s: %s'.format(_('MD5'), res[0].checksum)) : '',
                res[0].sha256sum ? E('li', {}, '%s: %s'.format(_('SHA256'), res[0].sha256sum)) : ''
            ]);
            body.push(infoList);

            body.push(E('hr'));
	    
            var expsizeSelect = E('select', { 
                'id': 'expsize', 
                'name': 'expsize',
                'style': 'width: auto',
                'class': 'cbi-input-select'
            }, [
                E('option', { value: '0', selected: 'selected' }, _('No expansion (Sysupgrade)')),
                E('option', { value: '1' }, _('Expand AUTO (DD Mode)')),
                E('option', { value: '2' }, _('Expand by 4G (DD Mode)')),
                E('option', { value: '3' }, _('Expand by 10G (DD Mode)')),
                E('option', { value: '4' }, _('Expand by 20G (DD Mode)')),
                E('option', { value: '5' }, _('Expand by 50G (DD Mode)')),
                E('option', { value: '6' }, _('Expand by 100G (DD Mode)'))
            ]);

            body.push(E('div', { 'class': 'cbi-value' }, [
                E('label', { 'class': 'cbi-value-title', 'for': 'expsize' }, _('Select expansion mode')),
                E('div', { 'class': 'cbi-value-field' }, [ expsizeSelect ])
            ]));

            var keepCheckbox = E('input', { 
                type: 'checkbox', 
                name: 'keep', 
                id: 'keep', 
                value: '1',
                checked: 'checked',
                class: 'cbi-input-checkbox'
            });

            body.push(E('div', { 'class': 'cbi-value keep-options', 'id': 'keep-settings' }, [
                E('label', { 'class': 'cbi-value-title', 'for': 'keep' }, _('Keep settings configuration')),
                E('div', { 'class': 'cbi-value-field' }, [ keepCheckbox ])
            ]));
            var bopkgCheckbox = E('input', { 
                type: 'checkbox', 
                name: 'bopkg', 
                id: 'bopkg', 
                value: '1',
                checked: 'checked',
                class: 'cbi-input-checkbox'
            });

            body.push(E('div', { 'class': 'cbi-value keep-options', 'id': 'keep-plugins' }, [
                E('label', { 'class': 'cbi-value-title', 'for': 'bopkg' }, _('Keep installed plugins (test)')),
                E('div', { 'class': 'cbi-value-field' }, [ bopkgCheckbox ])
            ]));

            expsizeSelect.addEventListener('change', function(e) {
                var isSysupgrade = (e.target.value === '0');
                var keepDiv = document.getElementById('keep-settings');
                var bopkgDiv = document.getElementById('keep-plugins');
                
                if (keepDiv) keepDiv.style.display = isSysupgrade ? 'block' : 'none';
                if (bopkgDiv) bopkgDiv.style.display = isSysupgrade ? 'block' : 'none';
                
                self.updateTargetIPInfo(e.target.value, document.getElementById('keep')?.checked || true);
            });

            body.push(E('div', { 'class': 'cbi-value', 'style': 'margin-top: 10px;' }, [
                E('label', { 'class': 'cbi-value-title' }, _('Flash Information')),
                E('div', { 'class': 'cbi-value-field' }, [
                    E('div', { 'id': 'target-ip-info', 'style': 'padding: 8px;  border-radius: 4px;' })
                ])
            ]));

            self.updateTargetIPInfo('0', true).then(function(ip) {
                var infoEl = document.getElementById('target-ip-info');
                if (infoEl) {
                    infoEl.innerHTML = '<strong>' + _('Target IP after flash:') + '</strong> ' + ip;
                }
            });

            if (!is_valid || is_too_big) {
                    body.push(E('hr'));

                if (is_too_big) {
                    body.push(E('div', { 'class': 'alert-message' }, [
                        _('It appears that you are trying to flash an image that does not fit into the flash memory, please verify the image file!')
                    ]));
                }

                if (!is_valid) {
                    body.push(E('div', { 'class': 'alert-message' }, [
                        res[1].msg ? res[1].msg : '',
                        _('The uploaded image file does not contain a supported format. Make sure that you choose the generic image format for your platform.')
                    ]));
                }
            }


                // 继续按钮
                var cntbtn = E('button', {
                    'class': 'btn cbi-button-action important',
                    'click': ui.createHandlerFn(this, 'handleSysupgradeConfirm', ev.target, opts, expsizeSelect),
                }, [ _('Continue') ]);

                // 强制刷机选项
                if ((!is_valid || is_too_big) && is_forceable) {
                    body.push(E('p', {}, E('label', { 'class': 'btn alert-message danger' }, [
                        E('input', { type: 'checkbox', id: 'force-check' }), ' ', _('Force upgrade'),
                        E('br'), E('br'),
                        _('Select \'Force upgrade\' to flash the image even if the image format check fails. Use only if you are sure that the firmware is correct and meant for your device!')
                    ])));
                    
                    var forceCheck = document.getElementById('force-check');
                    if (forceCheck) {
                        forceCheck.addEventListener('change', function(ev) {
                            cntbtn.disabled = !ev.target.checked;
                        });
                    }
                    cntbtn.disabled = true;
                };

                body.push(E('div', { 'class': 'right' }, [
                    E('button', {
                        'class': 'btn',
                        'click': ui.createHandlerFn(this, function(ev) {
                            return fs.remove('/tmp/firmware.img').finally(ui.hideModal);
                        })
                    }, [ _('Cancel') ]), ' ', cntbtn
                ]));

                ui.showModal(_('Flash image?'), body);
                
            }, this, ev.target))
            .catch(function(e) { 
                ui.hideModal();
                ui.addNotification(null, E('p', e.message)); 
            })
            .finally(L.bind(function(btn) {
                btn.firstChild.data = _('Flash image...');
            }, this, ev.target));
    },

    updateTargetIPInfo: function(expsize, keep) {
        var self = this;
        return callGetTargetIP({ keep: keep ? 1 : 0, expsize: parseInt(expsize) || 0 })
            .then(function(response) {
                if (response && response.code === 0 && response.target_ip) {
                    var ip = response.target_ip;
                    var infoEl = document.getElementById('target-ip-info');
                    if (infoEl) {
                        infoEl.innerHTML = '<strong>' + _('Target IP after flash:') + '</strong> ' + ip;
                    }
                    return ip;
                }
                return '192.168.10.1';
            });
    },

    handleSysupgradeConfirm: function(btn, opts, expsizeSelect, ev) {
        var self = this;
        
        btn.firstChild.data = _('Flashing…');

        ui.showModal(_('Flashing…'), [
            E('p', { 'class': 'spinning' }, _('The system is flashing now.<br /> DO NOT POWER OFF THE DEVICE!<br /> Wait a few minutes before you try to reconnect.'))
        ]);

        var expsize = parseInt(expsizeSelect.value) || 0;
        var keep = opts.keep[0].checked ? 1 : 0;
        var bopkg = opts.bopkg[0].checked ? 1 : 0;
        
        // 调试信息
        console.log('Flashing with params:', {
            keep: keep,
            expsize: expsize,
            bopkg: bopkg,
            filepath: '/tmp/firmware.img'
        });

        // 调用手动刷机RPC - 确保参数顺序正确
        return callManualDoFlash(keep, expsize, bopkg, '/tmp/firmware.img')
            .then(function(response) {
                console.log('Flash response:', response);
                
                if (response && response.code === 0) {
                    // 开始监控进度
                    self.monitorFlashProgress(response.target_ip || '192.168.10.1', keep === 1 && expsize === 0);
                } else {
                    var errorMsg = response && response.msg ? response.msg : _('Unknown error');
                    ui.hideModal();
                    ui.addNotification(null, E('p', { style: 'color: #dc3545;' }, 
                        _('Flash failed: ') + errorMsg));
                    
                    // 恢复按钮状态
                    btn.firstChild.data = _('Flash image...');
                }
            })
            .catch(function(error) {
                console.error('Flash error:', error);
                ui.hideModal();
                ui.addNotification(null, E('p', { style: 'color: #dc3545;' }, 
                    _('Flash request failed: ') + (error.message || _('Unknown error'))));
                
                // 恢复按钮状态
                btn.firstChild.data = _('Flash image...');
            });
    },

    monitorFlashProgress: function(target_ip, keepSettings) {
        var self = this;
        
        // 更新进度模态框
        var progressModal = ui.showModal(_('Firmware Upgrade'), [
            E('div', { 'class': 'progress-container', 'style': 'width: 100%; height: 24px; background: rgba(0,0,0,0.1); border-radius: 12px; position: relative; overflow: hidden; margin: 15px 0;' }, [
                E('div', { 'id': 'flash-progress-bar', 'class': 'progress-bar', 'style': 'height: 100%; background: linear-gradient(90deg, #4CAF50, #8BC34A); transition: width 0.3s ease; position: absolute; left: 0; top: 0; width: 0%;' }),
                E('div', { 'id': 'flash-progress-text', 'class': 'progress-text', 'style': 'position: absolute; width: 100%; text-align: center; line-height: 24px;  text-shadow: 1px 1px 2px rgba(0,0,0,0.3); z-index: 1;' }, '0%')
            ]),
            E('div', { 'id': 'flash-status', 'style': 'text-align: center; margin: 10px 0; font-weight: bold;' }, _('Starting flash process...')),
            E('pre', { 'id': 'flash-log', 'style': 'background: #1e1e1e; color: #d4d4d4; padding: 12px; border-radius: 6px; height: 200px; overflow-y: auto; font-family: monospace; font-size: 12px; line-height: 1.5; white-space: pre-wrap; margin: 15px 0;' })
        ]);

        function checkProgress() {
            callFlashProgress().then(function(response) {
                console.log('Progress response:', response);
                
                if (!response) {
                    setTimeout(checkProgress, 1000);
                    return;
                }

                // 更新进度条
                if (response.progress !== undefined) {
                    var progress = Math.min(100, Math.max(0, response.progress));
                    var bar = document.getElementById('flash-progress-bar');
                    var text = document.getElementById('flash-progress-text');
                    if (bar) bar.style.width = progress + '%';
                    if (text) text.textContent = Math.round(progress) + '%';
                }

                // 更新状态
                if (response.message) {
                    var status = document.getElementById('flash-status');
                    if (status) status.textContent = response.message;
                }

                // 更新日志
                if (response.log) {
                    var log = document.getElementById('flash-log');
                    if (log) {
                        log.textContent = response.log;
                        log.scrollTop = log.scrollHeight;
                    }
                }

                // 处理完成状态
                if (response.status === 'complete' || response.status === 'rebooting') {
                    ui.hideModal();
                    self.showRebootOptions(target_ip, keepSettings);
                    return;
                } else if (response.status === 'failed') {
                    ui.hideModal();
                    ui.addNotification(null, E('p', { style: 'color: #dc3545;' }, 
                        _('Flash failed: ') + (response.message || _('Unknown error'))));
                    return;
                }

                // 继续监控
                setTimeout(checkProgress, 1000);
            }).catch(function(error) {
                console.error('Progress check error:', error);
                setTimeout(checkProgress, 2000);
            });
        }

        checkProgress();
    },

    showRebootOptions: function(target_ip, keepSettings) {
        var self = this;
        var countdown = 50;
        
        var modal = ui.showModal(_('Flash Complete'), [
            E('p', { 'style': 'color: #4CAF50; font-weight: bold;margin:  0 20px;' }, _('Flash completed! Device is rebooting...')),
            E('p', {}, _('The device is rebooting now. You will be redirected automatically or you can manually access the device.')),
            E('div', { 'style': 'text-align: center; font-size: 32px; font-weight: bold; margin: 20px 0; color: #007bff;' }, [
                E('span', { 'id': 'countdown' }, countdown),
                E('span', { 'style': 'font-size: 16px; margin-left: 10px;' }, _('seconds'))
            ]),
            E('div', { 'style': 'text-align: center; margin-top: 20px;' }, [
                E('button', {
                    'class': 'btn cbi-button-action',
                    'click': function() {
                        window.open('http://' + target_ip, '_blank');
                    }
                }, _('Manual Access'))
            ])
        ]);

        // 倒计时
        var timer = setInterval(function() {
            countdown--;
            var countEl = document.getElementById('countdown');
            if (countEl) countEl.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(timer);
                ui.hideModal();
                
                // 尝试自动重连
                var reconnectIp = keepSettings ? window.location.hostname : target_ip;
                ui.awaitReconnect(reconnectIp, window.location.hostname);
            }
        }, 1000);
    },

    formatFileSize: function(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    },

    handleSave: null,
    handleSaveApply: null,
    handleReset: null
});